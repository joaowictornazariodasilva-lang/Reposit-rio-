import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Hono, type MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { ORDER_STATUSES, type OrderStatus } from '@nazario/shared';
import { addonGroupSchema, categorySchema, loginSchema, paymentUpdateSchema, productInputSchema, statusUpdateSchema, storeSettingsSchema } from '@nazario/shared/schemas';
import { config } from '../config';
import { clientIp, parse, readJson } from '../http';
import { verifyPassword } from '../lib/password';
import { createRateLimiter } from '../lib/rate-limit';
import { createSessionToken, readSessionToken, type SessionPayload } from '../lib/session';
import type { Repositories } from '../repositories/types';
import { DomainError, type OrderService } from '../services/orders';
import { computeStats } from '../services/stats';

type Env = { Variables: { admin: SessionPayload } };

const loginLimiter = createRateLimiter(Number(process.env.LOGIN_RATE_LIMIT ?? 5), 15 * 60_000);
const UPLOAD_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/** Every /api/admin route except login goes through this — the UI guard is only cosmetic. */
const requireAdmin: MiddlewareHandler<Env> = async (c, next) => {
  const session = readSessionToken(getCookie(c, config.session.cookie), config.session.secret);
  if (!session) return c.json({ error: 'Sessão expirada. Entre novamente.' }, 401);
  c.set('admin', session);
  await next();
};

/** CSRF defense in depth (cookie is already SameSite=Strict): mutations must come from our own origin. */
const sameOrigin: MiddlewareHandler = async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    const origin = c.req.header('origin');
    // Behind a reverse proxy you control (TRUST_PROXY=1) the public host arrives in X-Forwarded-Host.
    const host = (process.env.TRUST_PROXY === '1' && c.req.header('x-forwarded-host')) || c.req.header('host');
    const allowed = [config.corsOrigin, config.publicUrl].filter(Boolean);
    if (origin && host && new URL(origin).host !== host && !allowed.includes(origin)) {
      return c.json({ error: 'Origem não permitida.' }, 403);
    }
  }
  await next();
};

export function adminRoutes(repos: Repositories, orders: OrderService, uploadsDir: string) {
  const app = new Hono<Env>();
  app.use('*', sameOrigin);

  app.post('/login', async (c) => {
    const ip = clientIp(c);
    const limit = loginLimiter.check(ip);
    if (!limit.allowed) {
      c.header('Retry-After', String(limit.retryAfter));
      return c.json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' }, 429);
    }
    const { email, password } = parse(loginSchema, await readJson(c));
    const valid = email === config.admin.email && verifyPassword(password, config.admin.passwordHash);
    if (!valid) return c.json({ error: 'E-mail ou senha incorretos.' }, 401);

    loginLimiter.reset(ip);
    const exp = Math.floor(Date.now() / 1000) + config.session.ttlSeconds;
    setCookie(c, config.session.cookie, createSessionToken({ sub: email, role: 'admin', exp }, config.session.secret), {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'Strict',
      path: '/api',
      maxAge: config.session.ttlSeconds,
    });
    return c.json({ email });
  });

  app.post('/logout', (c) => {
    deleteCookie(c, config.session.cookie, { path: '/api' });
    return c.json({ ok: true });
  });

  app.use('*', requireAdmin);
  app.use('*', async (c, next) => {
    await next();
    c.header('Cache-Control', 'no-store');
  });

  app.get('/me', (c) => c.json({ email: c.get('admin').sub }));

  /* ─── Orders ─── */

  app.get('/orders', async (c) => {
    const statusParam = c.req.query('status');
    const status = statusParam
      ?.split(',')
      .filter((s): s is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(s));
    return c.json(await repos.orders.listOrders({ status: status?.length ? status : undefined }));
  });

  app.get('/orders/:id', async (c) => {
    const order = await repos.orders.getOrder(c.req.param('id'));
    if (!order) throw new DomainError('Pedido não encontrado.', 404);
    return c.json(order);
  });

  app.patch('/orders/:id/status', async (c) => {
    const { status } = parse(statusUpdateSchema, await readJson(c));
    return c.json(await orders.changeStatus(c.req.param('id'), status));
  });

  app.patch('/orders/:id/payment', async (c) => {
    const { status } = parse(paymentUpdateSchema, await readJson(c));
    return c.json(await orders.setPaymentStatus(c.req.param('id'), status));
  });

  app.get('/stats', async (c) => c.json(computeStats(await repos.orders.listOrders())));

  /* ─── Catalog ─── */

  app.get('/catalog', async (c) => {
    const [categories, products, addonGroups, settings] = await Promise.all([
      repos.catalog.listCategories(),
      repos.catalog.listProducts(),
      repos.catalog.listAddonGroups(),
      repos.catalog.getSettings(),
    ]);
    return c.json({ categories, products, addonGroups, settings });
  });

  async function assertUniqueSlug(slug: string, exceptId?: string) {
    const products = await repos.catalog.listProducts();
    if (products.some((p) => p.slug === slug && p.id !== exceptId)) {
      throw new DomainError('Já existe um produto com este endereço (slug).', 409);
    }
  }

  async function assertGroupsExist(ids: string[]) {
    const groups = new Set((await repos.catalog.listAddonGroups()).map((g) => g.id));
    if (ids.some((id) => !groups.has(id))) throw new DomainError('Grupo de adicionais inexistente.', 400);
  }

  app.post('/products', async (c) => {
    const input = parse(productInputSchema, await readJson(c));
    await assertUniqueSlug(input.slug);
    await assertGroupsExist(input.addonGroupIds);
    const product = await repos.catalog.createProduct({ ...input, id: `prd_${randomUUID().slice(0, 8)}` });
    return c.json(product, 201);
  });

  app.patch('/products/:id', async (c) => {
    const patch = parse(productInputSchema.partial(), await readJson(c));
    const id = c.req.param('id');
    if (patch.slug) await assertUniqueSlug(patch.slug, id);
    if (patch.addonGroupIds) await assertGroupsExist(patch.addonGroupIds);
    const product = await repos.catalog.updateProduct(id, patch);
    if (!product) throw new DomainError('Produto não encontrado.', 404);
    return c.json(product);
  });

  app.delete('/products/:id', async (c) => {
    if (!(await repos.catalog.deleteProduct(c.req.param('id')))) throw new DomainError('Produto não encontrado.', 404);
    return c.json({ ok: true });
  });

  app.put('/categories/:id', async (c) => {
    const category = parse(categorySchema, { ...(await readJson(c) as object), id: c.req.param('id') });
    return c.json(await repos.catalog.saveCategory(category));
  });

  app.put('/addon-groups/:id', async (c) => {
    const group = parse(addonGroupSchema, { ...(await readJson(c) as object), id: c.req.param('id') });
    return c.json(await repos.catalog.saveAddonGroup(group));
  });

  app.delete('/addon-groups/:id', async (c) => {
    if (!(await repos.catalog.deleteAddonGroup(c.req.param('id')))) throw new DomainError('Grupo não encontrado.', 404);
    return c.json({ ok: true });
  });

  app.get('/settings', async (c) => c.json(await repos.catalog.getSettings()));

  app.put('/settings', async (c) => {
    const settings = parse(storeSettingsSchema, await readJson(c));
    return c.json(await repos.catalog.saveSettings(settings));
  });

  /* ─── Uploads (product photos) ─── */

  app.post('/uploads', async (c) => {
    const length = Number(c.req.header('content-length') ?? 0);
    if (length > MAX_UPLOAD_BYTES + 10_000) throw new DomainError('Imagem muito grande (máx. 3 MB).', 400);
    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) throw new DomainError('Envie um arquivo de imagem.', 400);
    const ext = UPLOAD_TYPES[file.type];
    if (!ext) throw new DomainError('Formato não suportado. Use JPG, PNG, WebP ou AVIF.', 400);
    if (file.size > MAX_UPLOAD_BYTES) throw new DomainError('Imagem muito grande (máx. 3 MB).', 400);
    const name = `${randomUUID()}.${ext}`;
    const path = join(uploadsDir, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, Buffer.from(await file.arrayBuffer()));
    return c.json({ url: `/uploads/${name}` }, 201);
  });

  return app;
}

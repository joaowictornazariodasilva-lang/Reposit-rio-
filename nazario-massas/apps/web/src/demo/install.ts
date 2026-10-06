/**
 * Demo build only: answers the storefront's `/api/*` calls inside the browser so the
 * whole product (store + admin) runs without a server. It reuses the real server
 * code — order service, pricing, status rules, dashboard stats, mock Pix and zod
 * validation — with a localStorage-backed repository.
 */
import { ORDER_STATUSES, PricingError, type OrderStatus, type PublicCatalog } from '@nazario/shared';
import {
  addonGroupSchema,
  categorySchema,
  checkoutSchema,
  loginSchema,
  paymentUpdateSchema,
  productInputSchema,
  quoteSchema,
  statusUpdateSchema,
  storeSettingsSchema,
} from '@nazario/shared/schemas';
import type { z } from 'zod';
import { MockPaymentProvider } from '../../../api/src/payments/mock';
import { createOrderService, DomainError, toPublicOrder } from '../../../api/src/services/orders';
import { computeStats } from '../../../api/src/services/stats';
import { DEMO_ADMIN } from '@/lib/env';
import { BrowserStore } from './browser-store';

const store = new BrowserStore();
const repos = store.repositories;
const payments = new MockPaymentProvider();
const orders = createOrderService(repos, payments);
const SESSION_KEY = 'nazario-demo-admin';

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const issue = r.error.issues[0];
    throw new HttpError(400, issue?.message && !issue.message.startsWith('Invalid') ? issue.message : 'Dados inválidos.');
  }
  return r.data;
}

const isAdmin = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return adminInMemory;
  }
};
let adminInMemory = false;
function setAdmin(on: boolean) {
  adminInMemory = on;
  try {
    if (on) sessionStorage.setItem(SESSION_KEY, '1');
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* memory only */
  }
}

type Handler = (ctx: { params: string[]; body: unknown; query: URLSearchParams }) => Promise<unknown>;
const routes: { method: string; pattern: RegExp; admin?: boolean; status?: number; handler: Handler }[] = [];
const route = (method: string, path: string, handler: Handler, opts: { admin?: boolean; status?: number } = {}) =>
  routes.push({ method, pattern: new RegExp(`^${path.replace(/:\w+/g, '([^/]+)')}$`), handler, ...opts });

/* ─── Public ─── */
route('GET', '/api/catalog', async () => {
  const [categories, products, addonGroups, settings] = await Promise.all([
    repos.catalog.listCategories(),
    repos.catalog.listProducts(),
    repos.catalog.listAddonGroups(),
    repos.catalog.getSettings(),
  ]);
  const { coupons: _c, ...publicSettings } = settings;
  const active = new Set(categories.filter((c) => c.active).map((c) => c.id));
  const body: PublicCatalog = {
    categories: categories.filter((c) => c.active),
    products: products.filter((p) => p.active && active.has(p.categoryId)),
    addonGroups: addonGroups.map((g) => ({ ...g, options: g.options.filter((o) => o.active) })),
    settings: publicSettings,
    payments: payments.capabilities,
  };
  return body;
});
route('POST', '/api/quote', async ({ body }) => orders.quote(parse(quoteSchema, body)));
route('POST', '/api/orders', async ({ body }) => toPublicOrder(await orders.create(parse(checkoutSchema, body))), { status: 201 });
route('GET', '/api/orders/:token', async ({ params }) => {
  const order = await repos.orders.getOrderByToken(params[0]!);
  if (!order) throw new HttpError(404, 'Pedido não encontrado.');
  return toPublicOrder(order);
});
route('POST', '/api/orders/:token/simulate-payment', async ({ params }) => {
  const order = await repos.orders.getOrderByToken(params[0]!);
  if (!order) throw new HttpError(404, 'Pedido não encontrado.');
  if (order.payment.status !== 'awaiting_payment') return toPublicOrder(order);
  return toPublicOrder(await orders.setPaymentStatus(order.id, 'paid'));
});

/* ─── Admin ─── */
route('POST', '/api/admin/login', async ({ body }) => {
  const { email, password } = parse(loginSchema, body);
  if (email !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) throw new HttpError(401, 'E-mail ou senha incorretos.');
  setAdmin(true);
  return { email };
});
route('POST', '/api/admin/logout', async () => {
  setAdmin(false);
  return { ok: true };
});
route('GET', '/api/admin/me', async () => ({ email: DEMO_ADMIN.email }), { admin: true });
route(
  'GET',
  '/api/admin/orders',
  async ({ query }) => {
    const status = query
      .get('status')
      ?.split(',')
      .filter((s): s is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(s));
    return repos.orders.listOrders({ status: status?.length ? status : undefined });
  },
  { admin: true },
);
route(
  'GET',
  '/api/admin/orders/:id',
  async ({ params }) => {
    const o = await repos.orders.getOrder(params[0]!);
    if (!o) throw new HttpError(404, 'Pedido não encontrado.');
    return o;
  },
  { admin: true },
);
route('PATCH', '/api/admin/orders/:id/status', async ({ params, body }) => orders.changeStatus(params[0]!, parse(statusUpdateSchema, body).status), { admin: true });
route('PATCH', '/api/admin/orders/:id/payment', async ({ params, body }) => orders.setPaymentStatus(params[0]!, parse(paymentUpdateSchema, body).status), { admin: true });
route('GET', '/api/admin/stats', async () => computeStats(await repos.orders.listOrders()), { admin: true });
route(
  'GET',
  '/api/admin/catalog',
  async () => {
    const [categories, products, addonGroups, settings] = await Promise.all([
      repos.catalog.listCategories(),
      repos.catalog.listProducts(),
      repos.catalog.listAddonGroups(),
      repos.catalog.getSettings(),
    ]);
    return { categories, products, addonGroups, settings };
  },
  { admin: true },
);
async function assertUniqueSlug(slug: string, exceptId?: string) {
  if ((await repos.catalog.listProducts()).some((p) => p.slug === slug && p.id !== exceptId)) {
    throw new HttpError(409, 'Já existe um produto com este endereço (slug).');
  }
}
route(
  'POST',
  '/api/admin/products',
  async ({ body }) => {
    const input = parse(productInputSchema, body);
    await assertUniqueSlug(input.slug);
    return repos.catalog.createProduct({ ...input, id: `prd_${crypto.randomUUID().slice(0, 8)}` });
  },
  { admin: true, status: 201 },
);
route(
  'PATCH',
  '/api/admin/products/:id',
  async ({ params, body }) => {
    const patch = parse(productInputSchema.partial(), body);
    if (patch.slug) await assertUniqueSlug(patch.slug, params[0]);
    const p = await repos.catalog.updateProduct(params[0]!, patch);
    if (!p) throw new HttpError(404, 'Produto não encontrado.');
    return p;
  },
  { admin: true },
);
route(
  'DELETE',
  '/api/admin/products/:id',
  async ({ params }) => {
    if (!(await repos.catalog.deleteProduct(params[0]!))) throw new HttpError(404, 'Produto não encontrado.');
    return { ok: true };
  },
  { admin: true },
);
route('PUT', '/api/admin/categories/:id', async ({ params, body }) => repos.catalog.saveCategory(parse(categorySchema, { ...(body as object), id: params[0] })), { admin: true });
route('PUT', '/api/admin/addon-groups/:id', async ({ params, body }) => repos.catalog.saveAddonGroup(parse(addonGroupSchema, { ...(body as object), id: params[0] })), { admin: true });
route(
  'DELETE',
  '/api/admin/addon-groups/:id',
  async ({ params }) => {
    if (!(await repos.catalog.deleteAddonGroup(params[0]!))) throw new HttpError(404, 'Grupo não encontrado.');
    return { ok: true };
  },
  { admin: true },
);
route('GET', '/api/admin/settings', async () => repos.catalog.getSettings(), { admin: true });
route('PUT', '/api/admin/settings', async ({ body }) => repos.catalog.saveSettings(parse(storeSettingsSchema, body)), { admin: true });
route(
  'POST',
  '/api/admin/uploads',
  async ({ body }) => {
    const file = body instanceof FormData ? body.get('file') : null;
    if (!(file instanceof File)) throw new HttpError(400, 'Envie um arquivo de imagem.');
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) throw new HttpError(400, 'Formato não suportado. Use JPG, PNG, WebP ou AVIF.');
    if (file.size > 3 * 1024 * 1024) throw new HttpError(400, 'Imagem muito grande (máx. 3 MB).');
    // Demo: the photo lives only while this tab is open (no server to store it).
    return { url: URL.createObjectURL(file) };
  },
  { admin: true, status: 201 },
);

/* ─── Sample orders so the dashboard opens with something to look at ─── */
async function seedSampleOrders() {
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
  const samples: { minutes: number; status: OrderStatus; paid?: boolean; input: Parameters<typeof orders.create>[0] }[] = [
    {
      minutes: 4,
      status: 'new',
      input: {
        customer: { name: 'Cliente exemplo · Ana', phone: '11900000001' },
        fulfillment: { type: 'pickup' },
        items: [
          { productId: 'prd_especial-nazario', variantId: 'g', quantity: 1, addonOptionIds: ['borda-catupiry'], notes: 'Cortar em mais fatias' },
          { productId: 'prd_coca-cola-2l', variantId: 'un', quantity: 1, addonOptionIds: [], notes: '' },
        ],
        payment: { method: 'card' },
      },
    },
    {
      minutes: 12,
      status: 'preparing',
      paid: true,
      input: {
        customer: { name: 'Cliente exemplo · Bruno', phone: '11900000002' },
        fulfillment: { type: 'pickup' },
        items: [
          { productId: 'prd_pepperoni', variantId: 'm', quantity: 1, addonOptionIds: [], notes: 'Pouco molho' },
          { productId: 'prd_spaghetti-carbonara', variantId: 'individual', quantity: 2, addonOptionIds: [], notes: '' },
        ],
        payment: { method: 'pix' },
      },
    },
    {
      minutes: 26,
      status: 'ready',
      input: {
        customer: { name: 'Cliente exemplo · Carla', phone: '11900000003' },
        fulfillment: { type: 'pickup' },
        items: [{ productId: 'prd_quatro-queijos', variantId: 'g', quantity: 2, addonOptionIds: [], notes: '' }],
        payment: { method: 'cash', changeFor: 25000 },
      },
    },
    {
      minutes: 48,
      status: 'completed',
      paid: true,
      input: {
        customer: { name: 'Cliente exemplo · Diego', phone: '11900000004' },
        fulfillment: { type: 'pickup' },
        items: [
          { productId: 'prd_margherita', variantId: 'g', quantity: 1, addonOptionIds: ['extra-burrata'], notes: '' },
          { productId: 'prd_limonada-siciliana', variantId: 'un', quantity: 2, addonOptionIds: [], notes: '' },
        ],
        payment: { method: 'pix' },
      },
    },
  ];
  // Earlier days, completed — gives the 7-day chart a shape.
  for (let day = 1; day <= 6; day++) {
    for (let n = 0; n < 2 + ((day * 3) % 4); n++) {
      samples.push({
        minutes: day * 1440 + n * 35,
        status: 'completed',
        paid: true,
        input: {
          customer: { name: `Cliente exemplo · ${day}${n}`, phone: '11900000099' },
          fulfillment: { type: 'pickup' },
          items: [
            [
              { productId: 'prd_calabresa', variantId: 'g' },
              { productId: 'prd_margherita', variantId: 'm' },
              { productId: 'prd_frango-com-catupiry', variantId: 'g' },
              { productId: 'prd_lasanha-a-bolonhesa', variantId: 'duo' },
            ][(day + n) % 4]!,
          ].map((i) => ({ ...i, quantity: 1 + (n % 2), addonOptionIds: [], notes: '' })),
          payment: { method: 'card' },
        },
      });
    }
  }

  for (const sample of samples) {
    const created = await orders.create(checkoutSchema.parse(sample.input));
    const at = minutesAgo(sample.minutes);
    const flow: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed'];
    const upTo = flow.indexOf(sample.status);
    const history = flow
      .slice(0, upTo + 1)
      .filter((s) => !(created.fulfillment.type === 'pickup' && s === 'out_for_delivery'))
      .map((status, i) => ({ status, at: minutesAgo(sample.minutes - i * 4) }));
    const order = store.db.orders.find((o) => o.id === created.id)!;
    Object.assign(order, {
      createdAt: at,
      updatedAt: at,
      status: sample.status,
      statusHistory: history,
      payment: { ...order.payment, ...(sample.paid ? { status: 'paid', paidAt: at, pix: undefined } : {}) },
    });
  }
  store.persist();
}

/* ─── fetch interception ─── */
const nativeFetch = window.fetch.bind(window);
const ready = store.isNew ? seedSampleOrders() : Promise.resolve();

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const url = new URL(raw, location.href);
  const path = url.pathname.replace(/^.*?(\/api\/)/, '/api/');
  if (!path.startsWith('/api/') || (url.origin !== location.origin && !raw.startsWith('/api/'))) return nativeFetch(input, init);

  await ready;
  // A touch of latency so loading states are visible, as on a real network.
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
  const method = (init?.method ?? 'GET').toUpperCase();
  const match = routes.find((r) => r.method === method && r.pattern.test(path));
  if (!match) return json({ error: 'Não encontrado.' }, 404);
  if (match.admin && !isAdmin()) return json({ error: 'Sessão expirada. Entre novamente.' }, 401);
  let body: unknown;
  if (init?.body instanceof FormData) body = init.body;
  else if (typeof init?.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      return json({ error: 'JSON inválido.' }, 400);
    }
  }
  try {
    const result = await match.handler({ params: path.match(match.pattern)!.slice(1), body, query: url.searchParams });
    return json(result, match.status ?? 200);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    if (error instanceof DomainError) return json({ error: error.message }, error.status);
    if (error instanceof PricingError) return json({ error: error.message, code: error.code }, 422);
    console.error(error);
    return json({ error: 'Erro inesperado. Tente novamente.' }, 500);
  }
};

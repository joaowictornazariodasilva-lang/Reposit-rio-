import { Hono } from 'hono';
import { type PublicCatalog } from '@nazario/shared';
import { checkoutSchema, quoteSchema } from '@nazario/shared/schemas';
import { clientIp, parse, readJson } from '../http';
import { createRateLimiter } from '../lib/rate-limit';
import type { PaymentProvider } from '../payments';
import type { Repositories } from '../repositories/types';
import { DomainError, toPublicOrder, type OrderService } from '../services/orders';

const orderLimiter = createRateLimiter(Number(process.env.ORDER_RATE_LIMIT ?? 15), 10 * 60_000);

export function publicRoutes(repos: Repositories, orders: OrderService, payments: PaymentProvider) {
  const app = new Hono();

  app.get('/catalog', async (c) => {
    const [categories, products, addonGroups, settings] = await Promise.all([
      repos.catalog.listCategories(),
      repos.catalog.listProducts(),
      repos.catalog.listAddonGroups(),
      repos.catalog.getSettings(),
    ]);
    const { coupons: _coupons, ...publicSettings } = settings;
    const activeCategories = new Set(categories.filter((cat) => cat.active).map((cat) => cat.id));
    const body: PublicCatalog = {
      categories: categories.filter((cat) => cat.active),
      products: products.filter((p) => p.active && activeCategories.has(p.categoryId)),
      addonGroups: addonGroups.map((g) => ({ ...g, options: g.options.filter((o) => o.active) })),
      settings: publicSettings,
      payments: payments.capabilities,
    };
    c.header('Cache-Control', 'public, max-age=30, stale-while-revalidate=300');
    return c.json(body);
  });

  app.post('/quote', async (c) => {
    const input = parse(quoteSchema, await readJson(c));
    return c.json(await orders.quote(input));
  });

  app.post('/orders', async (c) => {
    const limit = orderLimiter.check(clientIp(c));
    if (!limit.allowed) {
      c.header('Retry-After', String(limit.retryAfter));
      return c.json({ error: 'Muitos pedidos em sequência. Aguarde alguns minutos.' }, 429);
    }
    const input = parse(checkoutSchema, await readJson(c));
    const order = await orders.create(input);
    return c.json(toPublicOrder(order), 201);
  });

  app.get('/orders/:token', async (c) => {
    const order = await repos.orders.getOrderByToken(c.req.param('token'));
    if (!order) throw new DomainError('Pedido não encontrado.', 404);
    c.header('Cache-Control', 'no-store');
    return c.json(toPublicOrder(order));
  });

  /** Test mode only: lets the customer "pay" the fake Pix to exercise the whole flow. */
  app.post('/orders/:token/simulate-payment', async (c) => {
    if (!payments.capabilities.testMode) return c.json({ error: 'Indisponível.' }, 404);
    const order = await repos.orders.getOrderByToken(c.req.param('token'));
    if (!order) throw new DomainError('Pedido não encontrado.', 404);
    if (order.payment.status !== 'awaiting_payment') return c.json(toPublicOrder(order));
    return c.json(toPublicOrder(await orders.setPaymentStatus(order.id, 'paid')));
  });

  return app;
}

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Order, PublicCatalog, PublicOrder } from '@nazario/shared';

let dir: string;
let app: { request: (path: string, init?: RequestInit) => Response | Promise<Response> };

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'nazario-'));
  process.env.DATA_FILE = join(dir, 'db.json');
  const { createApp } = await import('../src/app');
  const { JsonStore } = await import('../src/repositories/json-store');
  const { MockPaymentProvider } = await import('../src/payments/mock');
  const store = await JsonStore.open(process.env.DATA_FILE);
  app = createApp(store.repositories, new MockPaymentProvider());
});
afterAll(() => rm(dir, { recursive: true, force: true }));

const json = (body: unknown, extra: Record<string, string> = {}) => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', ...extra },
  body: JSON.stringify(body),
});

const deliveryAddress = { cep: '05433-000', street: 'Rua Harmonia', number: '120', neighborhood: 'Vila Madalena', city: 'São Paulo' };

const checkout = {
  customer: { name: 'Maria Souza', phone: '(11) 98765-4321' },
  fulfillment: { type: 'pickup' },

  items: [
    { productId: 'prd_margherita', variantId: 'g', quantity: 1, addonOptionIds: ['borda-catupiry'], notes: 'Sem cebola' },
    { productId: 'prd_coca-cola-lata', variantId: 'un', quantity: 2 },
  ],
  payment: { method: 'pix' },
};

async function login(): Promise<string> {
  const res = await app.request('/api/admin/login', json({ email: 'admin@nazariomassas.com.br', password: 'nazario2026' }));
  expect(res.status).toBe(200);
  return res.headers.get('set-cookie')!.split(';')[0]!;
}

describe('public API', () => {
  it('serves the catalog without coupons', async () => {
    const res = await app.request('/api/catalog');
    const body = (await res.json()) as PublicCatalog;
    expect(body.products.length).toBeGreaterThan(30);
    expect(body.settings).not.toHaveProperty('coupons');
    expect(body.payments.testMode).toBe(true);
  });

  it('prices on the server and ignores client totals', async () => {
    const res = await app.request('/api/orders', json({ ...checkout, total: 1 }));
    expect(res.status).toBe(400); // unknown keys are rejected (strict schema)
    const ok = await app.request('/api/orders', json(checkout));
    expect(ok.status).toBe(201);
    const order = (await ok.json()) as PublicOrder;
    expect(order.subtotal).toBe(8200 + 1200 + 1400);
    expect(order.deliveryFee).toBe(0);
    expect(order.total).toBe(10800);
    expect(order.payment.pix?.copyPaste).toMatch(/^000201/);
    expect(order).not.toHaveProperty('id');
    expect(order.customer).not.toHaveProperty('document');
  });

  it('tracks an order by token and simulates the Pix payment', async () => {
    const created = (await (await app.request('/api/orders', json(checkout))).json()) as PublicOrder;
    const paid = (await (await app.request(`/api/orders/${created.token}/simulate-payment`, { method: 'POST' })).json()) as PublicOrder;
    expect(paid.payment.status).toBe('paid');
    expect(paid.status).toBe('confirmed');
    expect((await app.request('/api/orders/not-a-token')).status).toBe(404);
  });

  it('validates checkout input', async () => {
    const bad = await app.request('/api/orders', json({ ...checkout, customer: { name: 'A', phone: '1' } }));
    expect(bad.status).toBe(400);
    const tampered = await app.request('/api/orders', json({ ...checkout, items: [{ productId: 'prd_margherita', variantId: 'xl', quantity: 1 }] }));
    expect(tampered.status).toBe(422);
  });
});

describe('pickup-only store', () => {
  it('rejects delivery orders until the admin enables delivery', async () => {
    const delivery = { ...checkout, fulfillment: { type: 'delivery', address: deliveryAddress } };
    const rejected = await app.request('/api/orders', json(delivery));
    expect(rejected.status).toBe(422);
    expect(((await rejected.json()) as { error: string }).error).toMatch(/apenas com retirada/);

    const cookie = await login();
    const settings = await (await app.request('/api/admin/settings', { headers: { cookie } })).json();
    const saved = await app.request('/api/admin/settings', {
      method: 'PUT',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ ...(settings as object), deliveryEnabled: true }),
    });
    expect(saved.status).toBe(200);
    const accepted = await app.request('/api/orders', json(delivery));
    expect(accepted.status).toBe(201);
    expect(((await accepted.json()) as PublicOrder).deliveryFee).toBe(790);

    await app.request('/api/admin/settings', {
      method: 'PUT',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ ...(settings as object), deliveryEnabled: false }),
    });
  });
});

describe('admin API', () => {
  it('rejects unauthenticated and forged sessions', async () => {
    expect((await app.request('/api/admin/orders')).status).toBe(401);
    expect((await app.request('/api/admin/orders', { headers: { cookie: 'nz_admin=eyJzdWIiOiJ4In0.forged' } })).status).toBe(401);
    const wrong = await app.request('/api/admin/login', json({ email: 'admin@nazariomassas.com.br', password: 'nope' }));
    expect(wrong.status).toBe(401);
  });

  it('blocks cross-origin mutations', async () => {
    const cookie = await login();
    const res = await app.request('/api/admin/products/prd_margherita', {
      method: 'PATCH',
      headers: { cookie, 'content-type': 'application/json', origin: 'https://evil.example', host: 'localhost' },
      body: JSON.stringify({ active: false }),
    });
    expect(res.status).toBe(403);
  });

  it('moves an order through the kitchen workflow', async () => {
    const cookie = await login();
    const orders = (await (await app.request('/api/admin/orders', { headers: { cookie } })).json()) as Order[];
    const order = orders.find((o) => o.status === 'new' && o.fulfillment.type === 'pickup')!;
    const patch = (status: string) =>
      app.request(`/api/admin/orders/${order.id}/status`, { method: 'PATCH', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    expect((await patch('preparing')).status).toBe(200);
    expect((await patch('confirmed')).status).toBe(409); // no going back
    expect((await patch('out_for_delivery')).status).toBe(409); // pickup orders skip delivery
    expect((await patch('ready')).status).toBe(200);
    expect((await patch('completed')).status).toBe(200);
    expect((await patch('cancelled')).status).toBe(409);
    const done = (await (await app.request(`/api/admin/orders/${order.id}`, { headers: { cookie } })).json()) as Order;
    expect(done.statusHistory.map((h) => h.status)).toEqual(['new', 'preparing', 'ready', 'completed']);
    const stats = (await (await app.request(`/api/admin/stats`, { headers: { cookie } })).json()) as { today: { orders: number } };
    expect(stats.today.orders).toBeGreaterThan(0);
  });

  it('manages products and reflects changes in the public catalog', async () => {
    const cookie = await login();
    const headers = { cookie, 'content-type': 'application/json' };
    const res = await app.request('/api/admin/products/prd_margherita', {
      method: 'PATCH', headers, body: JSON.stringify({ active: false }),
    });
    expect(res.status).toBe(200);
    const catalog = (await (await app.request('/api/catalog')).json()) as PublicCatalog;
    expect(catalog.products.find((p) => p.id === 'prd_margherita')).toBeUndefined();
    const created = await app.request('/api/admin/products', {
      method: 'POST', headers,
      body: JSON.stringify({
        slug: 'pizza-teste', categoryId: 'pizzas', name: 'Pizza Teste', shortDescription: 'Teste', description: '',
        ingredients: [], badges: [], featured: false, active: true, sortOrder: 99,
        variants: [{ id: 'u', label: 'Única', price: 5000 }], addonGroupIds: ['borda'],
      }),
    });
    expect(created.status).toBe(201);
    const dup = await app.request('/api/admin/products', { method: 'POST', headers, body: JSON.stringify({ ...((await created.clone().json()) as object), id: undefined }) });
    expect(dup.status).toBe(409);
  });
});

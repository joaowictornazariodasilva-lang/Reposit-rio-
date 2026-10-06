import { expect, test, type Page } from '@playwright/test';

const ADMIN = { email: 'admin@nazariomassas.com.br', password: 'nazario2026' };

async function login(page: Page) {
  await page.goto('/admin');
  await page.getByLabel('E-mail').fill(ADMIN.email);
  await page.getByLabel('Senha').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
}

test('admin API rejects requests without a session', async ({ request }) => {
  expect((await request.get('/api/admin/orders')).status()).toBe(401);
  expect((await request.patch('/api/admin/products/prd_margherita', { data: { active: false } })).status()).toBe(401);
});

test('wrong password shows an error', async ({ page }) => {
  await page.goto('/admin');
  await page.getByLabel('E-mail').fill(ADMIN.email);
  await page.getByLabel('Senha').fill('senha-errada');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos');
});

test('login → dashboard → new order → advance to completed', async ({ page, request }) => {
  await login(page);

  const res = await request.post('/api/orders', {
    data: {
      customer: { name: 'João Pereira', phone: '11912345678' },
      fulfillment: { type: 'pickup' },
      items: [{ productId: 'prd_pepperoni', variantId: 'g', quantity: 1, addonOptionIds: ['borda-cheddar'], notes: 'Pouco molho' }],
      payment: { method: 'card' },
    },
  });
  expect(res.status()).toBe(201);
  const created = await res.json();

  await page.getByRole('link', { name: /^Pedidos/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible();
  await page.getByRole('link', { name: new RegExp(`#${created.number}`) }).first().click({ timeout: 15_000 });

  const detail = page.getByRole('dialog', { name: `Pedido #${created.number}` });
  await expect(detail.getByText('Pouco molho')).toBeVisible();
  await expect(detail.getByText('O cliente vem buscar.')).toBeVisible();
  for (const action of ['Confirmar', 'Iniciar preparo', 'Marcar como pronto', 'Concluir']) {
    await detail.getByRole('button', { name: new RegExp(`^${action}`) }).click();
    await expect(detail.getByRole('button', { name: new RegExp(`^${action}`) })).toHaveCount(0);
  }
  await expect(detail.getByText('Concluído').first()).toBeVisible();

  const tracked = await (await request.get(`/api/orders/${created.token}`)).json();
  expect(tracked.status).toBe('completed');
  expect(tracked.payment.status).toBe('paid');
});

test('cancel an order with confirmation', async ({ page, request }) => {
  const created = await (
    await request.post('/api/orders', {
      data: {
        customer: { name: 'Ana Costa', phone: '11933332222' },
        fulfillment: { type: 'pickup' },
        items: [{ productId: 'prd_margherita', variantId: 'm', quantity: 1 }],
        payment: { method: 'cash' },
      },
    })
  ).json();
  await login(page);
  await page.goto('/admin/pedidos');
  await page.getByRole('link', { name: new RegExp(`#${created.number}`) }).first().click({ timeout: 15_000 });
  const detail = page.getByRole('dialog', { name: `Pedido #${created.number}` });
  await detail.getByRole('button', { name: 'Cancelar pedido' }).click();
  await detail.getByRole('alertdialog').getByRole('button', { name: 'Cancelar pedido' }).click();
  await expect(detail.getByText('Cancelado').first()).toBeVisible();
});

test('edit a price and toggle availability; storefront reflects it', async ({ page, request }) => {
  await login(page);
  await page.goto('/admin/cardapio');
  await page.getByRole('link', { name: 'Editar Napolitana' }).click();
  await page.getByLabel('Preço do tamanho 1').fill('49,90');
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cardápio', exact: true })).toBeVisible();

  let catalog = await (await request.get('/api/catalog')).json();
  expect(catalog.products.find((p: { slug: string }) => p.slug === 'napolitana').variants[0].price).toBe(4990);

  const row = page.getByRole('listitem').filter({ hasText: 'Napolitana' });
  await row.getByRole('switch').click();
  await expect(row.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await expect.poll(async () => {
    catalog = await (await request.get('/api/catalog')).json();
    return catalog.products.some((p: { slug: string }) => p.slug === 'napolitana');
  }).toBe(false);
  await row.getByRole('switch').click(); // restore
});

test('create a new product', async ({ page, request }, info) => {
  const name = `Pizza de Teste ${info.project.name}`;
  const slug = name.toLowerCase().replace(/ /g, '-');
  await login(page);
  await page.goto('/admin/cardapio/novo');
  await page.getByLabel('Nome', { exact: true }).fill(name);
  await page.getByLabel('Descrição curta').fill('Criada pelo teste automatizado.');
  for (const [i, price] of ['40,00', '55,00', '70,00'].entries()) await page.getByLabel(`Preço do tamanho ${i + 1}`).fill(price);
  await page.getByRole('button', { name: 'Criar produto' }).click();
  await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
  const catalog = await (await request.get('/api/catalog')).json();
  expect(catalog.products.some((p: { slug: string }) => p.slug === slug)).toBe(true);
});

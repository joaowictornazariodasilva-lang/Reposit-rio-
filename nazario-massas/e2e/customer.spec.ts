import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Deterministic CEP lookup — no dependency on the public ViaCEP service.
  await page.route('https://viacep.com.br/**', (route) =>
    route.fulfill({ json: { logradouro: 'Rua Harmonia', bairro: 'Vila Madalena', localidade: 'São Paulo', uf: 'SP' } }),
  );
});

test('home → menu → pizza → cart → checkout → Pix → confirmation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('48 horas de');
  await page.getByRole('link', { name: 'Pedir agora' }).click();
  await expect(page).toHaveURL(/\/cardapio$/);

  // Configure a pizza in the product sheet
  await page.getByRole('link', { name: /Margherita/ }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Margherita' });
  await expect(sheet).toBeVisible();
  await sheet.getByText('Grande', { exact: true }).click();
  await sheet.getByText('Borda de Catupiry').click();
  await sheet.getByRole('button', { name: 'Sem cebola' }).click();
  await expect(sheet.getByRole('button', { name: /^Adicionar/ })).toContainText('R$ 94,00');
  await sheet.getByRole('button', { name: /^Adicionar/ }).click();
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('button', { name: /Abrir carrinho, 1 item/ })).toBeVisible();

  // One-tap drink
  await page.getByRole('button', { name: 'Adicionar Coca-Cola ao carrinho' }).click();

  // Cart drawer
  await page.getByRole('button', { name: /Abrir carrinho/ }).click();
  const cart = page.getByRole('dialog', { name: 'Seu carrinho' });
  await expect(cart.getByText('“Sem cebola”')).toBeVisible();
  await cart.getByRole('button', { name: 'Aumentar quantidade' }).last().click();
  await expect(cart.getByText('R$ 14,00')).toBeVisible();
  await cart.getByRole('button', { name: 'Finalizar pedido' }).click();
  await expect(page).toHaveURL(/\/checkout$/);

  // Validation
  await page.getByRole('button', { name: /Fazer pedido/ }).last().click();
  await expect(page.getByText('Confira os campos destacados:')).toBeVisible();

  await page.getByLabel('Nome').fill('Maria Souza');
  await page.getByLabel('Telefone (WhatsApp)').fill('11987654321');
  await page.getByLabel('CEP').fill('05435000');
  await expect(page.getByLabel('Rua')).toHaveValue('Rua Harmonia');
  await page.getByLabel('Número').fill('120');
  await page.locator('#coupon').fill('BEMVINDO10');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.getByText('Cupom BEMVINDO10 aplicado.')).toBeVisible();
  // 94 + 2×7 = 108; −10% = 97,20; + 7,90 delivery = 105,10
  await expect(page.getByRole('button', { name: /Fazer pedido/ }).last()).toContainText('R$ 105,10');
  await page.getByRole('button', { name: /Fazer pedido/ }).last().click();

  // Confirmation + Pix
  await expect(page).toHaveURL(/\/pedido\//);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Pedido recebido!');
  await expect(page.getByRole('img', { name: /QR Code Pix/ })).toBeVisible();
  await page.getByRole('button', { name: 'Simular pagamento' }).click();
  await expect(page.getByText('Pagamento aprovado.')).toBeVisible();
  await expect(page.getByText('Pago', { exact: true })).toBeVisible();

  // Cart was cleared
  await expect(page.getByRole('button', { name: /Abrir carrinho, 0 itens/ })).toBeVisible();
});

test('pickup + cash order with change', async ({ page }) => {
  await page.goto('/cardapio/massas');
  await page.getByRole('link', { name: /Spaghetti Carbonara/ }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Spaghetti Carbonara' });
  await sheet.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await sheet.getByRole('button', { name: /^Adicionar/ }).click();
  await page.goto('/checkout');
  await page.getByText('Retirada no local').click();
  await expect(page.getByLabel('CEP')).toHaveCount(0);
  await page.getByLabel('Nome').fill('Carlos Lima');
  await page.getByLabel('Telefone (WhatsApp)').fill('11955554444');
  await page.getByText('Dinheiro', { exact: true }).click();
  await page.getByLabel('Troco para quanto?').fill('150');
  await page.getByRole('button', { name: /Fazer pedido/ }).last().click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Pedido recebido!');
  await expect(page.getByText('Troco para R$ 150,00')).toBeVisible();
  await expect(page.getByText('Pronto para retirada')).toBeVisible();
});

test('direct product URL renders an indexable page', async ({ page }) => {
  await page.goto('/produto/quatro-queijos');
  await expect(page.getByRole('heading', { level: 1, name: 'Quatro Queijos' })).toBeVisible();
  await expect(page).toHaveTitle(/Quatro Queijos/);
  const jsonLd = await page.locator('script[type="application/ld+json"][data-route]').textContent();
  expect(JSON.parse(jsonLd!)['@type']).toBe('MenuItem');
});

test('menu search and filters', async ({ page }) => {
  await page.goto('/cardapio');
  await page.getByRole('searchbox', { name: 'Buscar no cardápio' }).first().fill('catupiry');
  await expect(page.getByRole('heading', { name: 'Frango com Catupiry' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Margherita' })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Buscar no cardápio' }).first().fill('xyz-nada');
  await expect(page.getByText('Nenhum item encontrado')).toBeVisible();
});

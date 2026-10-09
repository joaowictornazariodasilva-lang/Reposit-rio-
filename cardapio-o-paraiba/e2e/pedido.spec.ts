import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const NUMERO_TESTE = '5585987054152';

async function montarPedido(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Adicionar Panelada ao pedido' }).first().click();
  await page.getByRole('button', { name: 'Aumentar Panelada' }).first().click();
  await page.getByRole('button', { name: 'Adicionar Pudim ao pedido' }).click();
}

test.describe('carrinho e pedido pelo WhatsApp', () => {
  test.beforeEach(async ({ page }) => {
    // Limpa só na primeira carga de cada teste.
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('manter')) localStorage.clear();
    });
  });

  test('adicionar vira seletor de quantidade e a barra mostra o total', async ({ page }) => {
    await montarPedido(page);
    await expect(page.getByRole('group', { name: 'Quantidade de Panelada' }).first()).toContainText('2');
    const barra = page.getByRole('button', { name: /Ver pedido/ });
    await expect(barra).toContainText('R$ 77,00');
    await expect(barra).toHaveAccessibleName(/3 itens/);
  });

  test('self-service não entra no carrinho', async ({ page }) => {
    await page.goto('/');
    const item = page.locator('#item-self-service-livre');
    await expect(item.getByRole('button', { name: /Adicionar/ })).toHaveCount(0);
    await expect(item).toContainText('Monte no salão');
  });

  test('o carrinho sobrevive a recarregar a página', async ({ page }) => {
    await montarPedido(page);
    await page.evaluate(() => sessionStorage.setItem('manter', '1'));
    await page.reload();
    await expect(page.getByRole('button', { name: /Ver pedido/ })).toBeVisible();
  });

  test('valida nome e telefone antes de abrir o WhatsApp', async ({ page }) => {
    await montarPedido(page);
    await page.getByRole('button', { name: /Ver pedido/ }).click();
    const painel = page.getByRole('dialog', { name: 'Seu pedido' });
    await expect(painel).toBeVisible();
    await painel.getByRole('button', { name: 'Continuar' }).click();

    let popups = 0;
    page.on('popup', () => popups++);
    await page.getByRole('link', { name: /Enviar pedido no WhatsApp/ }).click();
    await expect(page.getByText('Escreva seu nome')).toBeVisible();
    await expect(page.getByText('Informe um telefone com DDD')).toBeVisible();
    await expect(page.getByLabel('Seu nome')).toBeFocused();
    await expect(page.getByLabel('Seu nome')).toHaveAttribute('aria-invalid', 'true');
    expect(popups).toBe(0);
  });

  test('envia o pedido completo para o WhatsApp da casa', async ({ page, context }) => {
    // Não sai para a internet: o WhatsApp é interceptado.
    await context.route(/wa\.me|whatsapp\.com/, (rota) => rota.fulfill({ body: 'ok' }));
    await montarPedido(page);
    await page.getByRole('button', { name: /Ver pedido/ }).click();
    await page.getByLabel('Observações (opcional)').fill('Panelada sem pimenta');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByLabel('Seu nome').fill('João');
    await page.getByLabel('Telefone (WhatsApp)').pressSequentially('85999990000');
    await expect(page.getByLabel('Telefone (WhatsApp)')).toHaveValue('(85) 99999-0000');
    await page.getByRole('radio', { name: 'Comer no salão' }).check();
    await page.getByLabel('Número da mesa (opcional)').fill('7');
    await page.getByRole('radio', { name: 'Pix' }).check();

    const link = page.getByRole('link', { name: /Enviar pedido no WhatsApp/ });
    const href = (await link.getAttribute('href'))!;
    expect(href.startsWith(`https://wa.me/${NUMERO_TESTE}?text=`)).toBe(true);
    const texto = decodeURIComponent(href.split('?text=')[1]);
    expect(texto).toContain('*Cliente:* João');
    expect(texto).toContain('*Telefone:* (85) 99999-0000');
    expect(texto).toContain('*Mesa:* 7');
    expect(texto).toContain('2x Panelada — R$ 70,00');
    expect(texto).toContain('1x Pudim — R$ 7,00');
    expect(texto).toContain('*Total:* R$ 77,00');
    expect(texto).toContain('*Pagamento:* Pix');
    expect(texto).toContain('*Observações:* Panelada sem pimenta');

    const [aba] = await Promise.all([page.waitForEvent('popup'), link.click()]);
    expect(aba.url()).toContain(NUMERO_TESTE);
    await aba.close();
    await expect(page.getByRole('heading', { name: 'Falta só enviar' })).toBeVisible();

    await page.getByRole('button', { name: 'Começar outro pedido' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: /Ver pedido/ })).toHaveCount(0);
  });

  test('lembra nome e telefone no próximo pedido', async ({ page }) => {
    await montarPedido(page);
    await page.getByRole('button', { name: /Ver pedido/ }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByLabel('Seu nome').fill('Maria');
    await page.getByLabel('Telefone (WhatsApp)').fill('85988887777');
    const salvo = await page.evaluate(() => localStorage.getItem('oparaiba:cliente'));
    expect(salvo).toContain('Maria');
  });

  test('Esc fecha o painel e devolve o cardápio', async ({ page }) => {
    await montarPedido(page);
    await page.getByRole('button', { name: /Ver pedido/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: /Ver pedido/ })).toBeVisible();
  });

  test('painel passa no axe nas duas etapas', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await montarPedido(page);
    await page.getByRole('button', { name: /Ver pedido/ }).click();
    let r = await new AxeBuilder({ page }).include('dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('link', { name: /Enviar pedido/ }).click(); // mostra os erros
    r = await new AxeBuilder({ page }).include('dialog').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });

  test('barra do pedido não cobre botões do cardápio', async ({ page }) => {
    await montarPedido(page);
    const barra = await page.locator('.barra-pedido__botao').boundingBox();
    const conteudo = await page.locator('.conteudo').boundingBox();
    const isMobile = (page.viewportSize()?.width ?? 0) < 1024;
    if (!isMobile) {
      // No desktop fica na coluna da capa, sem sobrepor a coluna do cardápio.
      expect(barra!.x + barra!.width).toBeLessThanOrEqual(conteudo!.x);
    } else {
      // No celular o rodapé ganha espaço para o último conteúdo não ficar escondido.
      await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
      await page.waitForTimeout(300); // barra termina de subir
      const rodape = await page.locator('.rodape p').last().boundingBox();
      const barraAgora = await page.locator('.barra-pedido__botao').boundingBox();
      expect(rodape!.y + rodape!.height).toBeLessThanOrEqual(barraAgora!.y);
    }
  });
});

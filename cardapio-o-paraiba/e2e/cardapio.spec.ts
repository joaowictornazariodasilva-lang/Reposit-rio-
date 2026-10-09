import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('cardápio', () => {
  test('mostra a casa, os destaques e todas as categorias', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'O Paraíba' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveText(/Aberto agora|Fecha às|Fechado/);

    const destaques = page.getByRole('region', { name: 'O que pedir' }).getByRole('listitem');
    await expect(destaques).toHaveCount(3);
    await expect(destaques.first()).toContainText('Panelada');
    await expect(destaques.first()).toContainText('R$ 35,00');

    for (const nome of ['Pratos da casa', 'Self-service', 'Acompanhamentos extras', 'Bebidas', 'Sobremesa']) {
      await expect(page.getByRole('heading', { level: 2, name: nome })).toBeAttached();
    }
  });

  test('selo de horário segue o fuso de Fortaleza', async ({ page }) => {
    // 12h em Fortaleza (15h UTC), numa sexta.
    await page.clock.setFixedTime(new Date('2026-10-09T15:00:00Z'));
    await page.goto('/');
    await expect(page.getByRole('status')).toHaveText('Aberto agora · até 15h');
  });

  test('barra de categorias leva à seção e marca a ativa', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Categorias do cardápio' });
    await nav.getByRole('link', { name: 'Bebidas' }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Bebidas' })).toBeInViewport();
    await expect(nav.getByRole('link', { name: 'Bebidas' })).toHaveAttribute('aria-current', 'true');
    await expect(page).toHaveURL(/#bebidas$/);

    // A barra continua visível depois de rolar (sticky).
    await expect(nav).toBeInViewport();
  });

  test('"O que pedir" leva ao prato no cardápio', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Sarrabulho/ }).first().click();
    await expect(page.locator('#item-sarrabulho')).toBeInViewport();
  });

  test('sem rolagem horizontal', async ({ page }) => {
    await page.goto('/');
    const larguras = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(larguras[0]).toBeLessThanOrEqual(larguras[1]);
  });

  test('links externos abrem em nova aba com rel seguro', async ({ page }) => {
    await page.goto('/');
    for (const link of await page.locator('a[target="_blank"]').all()) {
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
    await expect(page.getByRole('link', { name: '@restauranteoparaiba' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/restauranteoparaiba/',
    );
  });

  test('acessibilidade (axe, WCAG 2.1 AA)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
  });

  test('link "Pular para o cardápio" é o primeiro foco', async ({ page, isMobile }) => {
    test.skip(isMobile, 'navegação por teclado');
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pular para o cardápio' })).toBeFocused();
  });
});

test.describe('cartão de mesa', () => {
  test('gera QR para a URL informada e passa no axe', async ({ page }) => {
    await page.goto('/mesa.html?url=https://exemplo.com.br/cardapio');
    await expect(page.locator('.cartao__qr svg')).toHaveCount(2);
    await expect(page.locator('.cartao__url').first()).toHaveText('exemplo.com.br/cardapio');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function audit(page: Page) {
  // Let entrance animations settle so axe measures final colours.
  await page.waitForTimeout(1500);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× — ${v.nodes[0]?.target.join(' ')}`);
  expect(summary, summary.join('\n')).toEqual([]);
}

for (const path of ['/', '/cardapio', '/produto/margherita', '/checkout', '/pagina-inexistente']) {
  test(`WCAG AA: ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await audit(page);
  });
}

test('WCAG AA: product sheet and cart drawer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/cardapio');
  await page.getByRole('link', { name: /Margherita/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await audit(page);
  await page.getByRole('dialog').getByRole('button', { name: /^Adicionar/ }).click();
  await page.getByRole('button', { name: /Abrir carrinho/ }).click();
  await expect(page.getByRole('dialog', { name: 'Seu carrinho' })).toBeVisible();
  await audit(page);
});

test('WCAG AA: admin login and dashboard', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/admin');
  await audit(page);
  await page.getByLabel('E-mail').fill('admin@nazariomassas.com.br');
  await page.getByLabel('Senha').fill('nazario2026');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
  await audit(page);
});

test('keyboard: dialog traps focus and Escape closes it', async ({ page }) => {
  await page.goto('/cardapio');
  await page.getByRole('link', { name: /Margherita/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 40; i++) await page.keyboard.press('Tab');
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

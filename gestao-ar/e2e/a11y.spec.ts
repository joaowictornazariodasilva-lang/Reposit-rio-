import { expect, test } from "@playwright/test";
import { auditar, entrar } from "./apoio";

test("WCAG AA: login", async ({ page }) => {
  await page.goto("/login");
  await auditar(page);
});

for (const tema of ["light", "dark"] as const) {
  test(`WCAG AA (${tema}): telas principais`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: tema });
    await entrar(page);
    await page.evaluate((t) => localStorage.setItem("theme", t), tema);
    for (const rota of ["/", "/clientes", "/equipamentos", "/cadastros/servicos", "/cadastros/produtos", "/cadastros/kits", "/importar", "/configuracoes/equipe", "/agenda"]) {
      await page.goto(rota);
      await expect(page.locator("html")).toHaveClass(new RegExp(tema));
      await auditar(page);
    }
    // Ficha do cliente e do equipamento, e o painel de criação aberto
    await page.goto("/clientes?tipo=pj");
    await page.getByRole("link", { name: /Ed\. Porto Bello/ }).first().click();
    await auditar(page);
    await page.getByRole("link", { name: /BTUs/ }).first().click();
    await expect(page.getByText("Ciclo de limpeza")).toBeVisible();
    await auditar(page);
    await page.goto("/clientes?novo=cliente");
    await expect(page.getByRole("dialog", { name: "Novo cliente" })).toBeVisible();
    await auditar(page);
  });
}

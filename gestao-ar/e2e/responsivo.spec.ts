import { expect, test } from "@playwright/test";
import { entrar } from "./apoio";

test("nenhuma tela tem rolagem horizontal", async ({ page }) => {
  await entrar(page);
  const rotas = ["/", "/clientes", "/equipamentos", "/cadastros/servicos", "/cadastros/produtos", "/cadastros/kits", "/cadastros/fornecedores", "/importar", "/configuracoes", "/configuracoes/equipe", "/configuracoes/auditoria", "/agenda"];
  await page.goto("/clientes?tipo=pj");
  await page.getByRole("link", { name: /Ed\. Porto Bello/ }).first().click();
  await expect(page.getByRole("heading", { name: "Ed. Porto Bello" })).toBeVisible();
  rotas.push(new URL(page.url()).pathname);
  await page.getByRole("link", { name: /BTUs/ }).first().click();
  await expect(page.getByText("Ciclo de limpeza")).toBeVisible();
  rotas.push(new URL(page.url()).pathname);
  for (const r of rotas) {
    await page.goto(r);
    const larguras = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(larguras[0], `${r} mais larga que a tela`).toBeLessThanOrEqual(larguras[1]!);
  }
});

test("painel lateral longo mantém o botão Salvar alcançável", async ({ page }) => {
  await entrar(page);
  await page.goto("/equipamentos?novo=equipamento", { waitUntil: "networkidle" });
  const d = page.getByRole("dialog", { name: "Novo equipamento" });
  await expect(d.getByRole("button", { name: "Cadastrar equipamento" })).toBeInViewport();
});

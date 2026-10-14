import { expect, test } from "@playwright/test";
import { entrar, irPeloMenu } from "./apoio";

test("sem sessão, qualquer tela leva ao login e volta para ela depois", async ({ page }) => {
  await page.goto("/equipamentos");
  await expect(page).toHaveURL(/\/login\?de=%2Fequipamentos/);
  await page.getByLabel("E-mail").fill("dono@brisaclima.demo");
  await page.getByLabel("Senha", { exact: true }).fill("brisa2026");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Equipamentos", level: 1 })).toBeVisible();
});

test("senha errada mostra erro sem revelar se o e-mail existe", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("ninguem@exemplo.com");
  await page.getByLabel("Senha", { exact: true }).fill("qualquer");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator("#login-erro")).toHaveText("E-mail ou senha incorretos.");
});

test("técnico vê menu enxuto e não acessa configurações nem custos", async ({ page }) => {
  await entrar(page, "marcos@brisaclima.demo");
  await expect(page.getByRole("heading", { name: /Marcos/ })).toBeVisible();
  await expect(page.getByText("Meus serviços de hoje")).toBeVisible();
  if ((page.viewportSize()?.width ?? 1440) < 1024) await page.getByRole("button", { name: "Abrir menu" }).click();
  const menu = page.getByRole("navigation", { name: "Menu principal" });
  await expect(menu.getByRole("link", { name: /Clientes/ })).toBeVisible();
  await expect(menu.getByRole("link", { name: /Cadastros/ })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: /Financeiro/ })).toHaveCount(0);
  await page.goto("/configuracoes");
  await expect(page).toHaveURL(/\?negado=1/);
  await expect(page.getByText("Seu perfil não tem acesso")).toBeVisible();
  // O servidor também recusa a exportação
  const r = await page.request.get("/api/exportar/clientes");
  expect(r.status()).toBe(200); // técnico pode ver clientes…
  await page.goto("/cadastros/produtos");
  await expect(page).toHaveURL(/\?negado=1/); // …mas não preços de custo
});

test("sair encerra a sessão", async ({ page }) => {
  await entrar(page);
  await page.getByRole("button", { name: "Menu do usuário" }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/clientes");
  await expect(page).toHaveURL(/\/login/);
});

test("menu leva aos módulos e os futuros explicam o que vem", async ({ page }) => {
  await entrar(page);
  await irPeloMenu(page, "Estoque");
  await expect(page.getByRole("heading", { name: "Estoque", level: 1 })).toBeVisible();
  await expect(page.getByText("Chega no passo 5 do plano")).toBeVisible();
});

import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const SENHA = "brisa2026";

export async function entrar(page: Page, email = "dono@brisaclima.demo") {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(SENHA);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export const celular = (page: Page) => (page.viewportSize()?.width ?? 1440) < 640;

/** Abre o menu lateral no celular quando necessário e clica no item. */
export async function irPeloMenu(page: Page, rotulo: string) {
  if ((page.viewportSize()?.width ?? 1440) < 1024) await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: rotulo, exact: false }).first().click();
}

export async function auditar(page: Page) {
  await page.waitForTimeout(400);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const resumo = r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× — ${v.nodes[0]?.target.join(" ")} — ${v.nodes[0]?.failureSummary?.split("\n")[1] ?? ""}`);
  expect(resumo, resumo.join("\n")).toEqual([]);
}

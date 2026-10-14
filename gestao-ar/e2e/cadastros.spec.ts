import os from "node:os";
import path from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { entrar } from "./apoio";

test("cria produto e calcula margem", async ({ page }) => {
  const nome = `Sensor teste ${test.info().project.name}`;
  await entrar(page);
  await page.goto("/cadastros/produtos");
  await page.getByRole("button", { name: "Novo produto" }).click();
  const d = page.getByRole("dialog", { name: "Novo produto ou peça" });
  await d.getByLabel("Nome").fill(nome);
  await d.getByLabel("Custo").fill("20");
  await d.getByLabel("Preço de venda").fill("50");
  await expect(d.getByText("Margem: 60,0%")).toBeVisible();
  await d.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("cell", { name: new RegExp(nome) }).first()).toBeVisible();
});

test("tipos de serviço mostram preço por faixa de BTUs", async ({ page }) => {
  await entrar(page);
  await page.goto("/cadastros/servicos");
  await expect(page.getByText("Limpeza / higienização completa")).toBeVisible();
  await expect(page.getByText("até 18 mil · R$ 220,00")).toBeVisible();
});

test("importa planilha de clientes com pré-visualização e correção", async ({ page }, info) => {
  await entrar(page);
  const sufixo = info.project.name;
  const csv = [
    "Cliente;CPF/CNPJ;Celular;E-mail;Bairro;Cidade",
    `Importado Um ${sufixo};;(85) 98888-1111;um@exemplo.com;Aldeota;Fortaleza`,
    `Importado Dois ${sufixo};;85977772222;dois@;Meireles;Fortaleza`,
    `;;85966663333;;Centro;Fortaleza`,
  ].join("\n");
  // Caminho só com ASCII: o Chromium headless deste ambiente não lê arquivos de pastas acentuadas.
  const dir = path.join(os.tmpdir(), `e2e-import-${sufixo}-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  const arq = path.join(dir, "clientes.csv");
  writeFileSync(arq, csv);
  await page.goto("/importar", { waitUntil: "networkidle" });
  await page.getByLabel("Escolher planilha").setInputFiles(arq);
  await expect(page.getByText("1 prontas")).toBeVisible();
  await expect(page.getByText("2 com erro")).toBeVisible();
  // corrige o e-mail na própria prévia e desmarca a linha sem nome
  await page.getByLabel(`Linha 3, E-mail`).fill("dois@exemplo.com");
  await page.getByRole("switch", { name: "Importar linha 4" }).click();
  await expect(page.getByText("2 prontas")).toBeVisible();
  await page.getByRole("button", { name: "Importar 2 clientes" }).click();
  await expect(page.getByRole("heading", { name: "2 clientes importados" })).toBeVisible();
  await page.goto(`/clientes?q=Importado`);
  await expect(page.getByText(`Importado Dois ${sufixo}`).filter({ visible: true }).first()).toBeVisible();
});

import { expect, test } from "@playwright/test";
import { entrar } from "./apoio";

test("cadastra cliente pelo painel lateral, adiciona aparelho e encontra na busca", async ({ page }) => {
  const nome = `Teste E2E ${test.info().project.name} ${Date.now()}`;
  await entrar(page);
  await page.getByRole("button", { name: "Criar novo" }).click();
  await page.getByRole("menuitem", { name: /Cliente/ }).click();
  const painel = page.getByRole("dialog", { name: "Novo cliente" });
  await expect(painel).toBeVisible();
  await painel.getByLabel("Nome completo").fill(nome);
  await painel.getByLabel("WhatsApp").fill("85991234567");
  await expect(painel.getByLabel("WhatsApp")).toHaveValue("(85) 99123-4567");
  await painel.getByLabel("Rua / avenida").fill("Av. Dom Luís");
  await painel.getByLabel("Número").fill("500");
  await painel.getByLabel("Bairro").fill("Meireles");
  await painel.getByLabel("Cidade").fill("Fortaleza");
  await painel.getByRole("button", { name: "Salvar e cadastrar aparelho" }).click();

  // Salvou e já abriu o painel do aparelho (a ficha fica atrás, inerte enquanto o painel está aberto)
  await expect(page).toHaveURL(/\/clientes\/[0-9a-f-]{36}\?novo=equipamento/);
  const eq = page.getByRole("dialog", { name: "Novo equipamento" });
  await expect(eq).toBeVisible();
  await expect(eq.getByText(nome)).toBeVisible();
  await eq.getByLabel("Ambiente").fill("Quarto do casal");
  await eq.getByLabel("Marca").fill("Midea");
  await eq.getByLabel("Capacidade (BTUs)").fill("12000");
  await eq.getByRole("button", { name: "Cadastrar equipamento" }).click();

  await expect(page.getByRole("heading", { name: "Midea · 12.000 BTUs" })).toBeVisible();
  await expect(page.getByText("Sem registro de limpeza").first()).toBeVisible();

  // Busca global (Ctrl+K no desktop, botão no celular)
  if ((page.viewportSize()?.width ?? 1440) >= 640) await page.keyboard.press("Control+k");
  else await page.getByRole("button", { name: "Buscar (Ctrl+K)" }).click();
  await page.getByPlaceholder(/Buscar cliente, aparelho/).fill(nome.slice(0, 18));
  await page.getByRole("option", { name: new RegExp(nome) }).click();
  await expect(page.getByRole("heading", { name: nome })).toBeVisible();
  await expect(page.getByRole("link", { name: /Midea · 12.000 BTUs/ })).toBeVisible();
});

test("valida campos com mensagens em português", async ({ page }) => {
  await entrar(page);
  await page.goto("/clientes?novo=cliente");
  const painel = page.getByRole("dialog", { name: "Novo cliente" });
  await painel.getByRole("radio", { name: /Empresa/ }).click();
  await painel.getByRole("textbox", { name: "CNPJ" }).fill("11.111.111/1111-11");
  await painel.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(painel.getByText("Informe o nome do cliente.")).toBeVisible();
  await expect(painel.getByText("CPF/CNPJ inválido — confira os dígitos.")).toBeVisible();
});

test("exclui cliente com desfazer", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1440) < 768, "ação pelo menu da linha da tabela (desktop)");
  await entrar(page);
  await page.goto("/clientes?q=Gustavo");
  const linha = page.getByRole("row", { name: /Gustavo Teixeira/ });
  await linha.getByRole("button", { name: /Mais ações/ }).click();
  await page.getByRole("menuitem", { name: "Excluir" }).click();
  await expect(page.getByText("1 cliente excluído")).toBeVisible();
  await expect(page.getByRole("row", { name: /Gustavo Teixeira/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByRole("row", { name: /Gustavo Teixeira/ })).toBeVisible();
});

test("filtros da lista ficam na URL e a ficha mostra aparelhos e histórico", async ({ page }) => {
  await entrar(page);
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Empresas" }).click();
  await expect(page).toHaveURL(/tipo=pj/);
  await expect(page.getByText(/8 clientes no filtro/)).toBeVisible();
  await page.getByRole("link", { name: /Ed\. Porto Bello/ }).first().click();
  await expect(page.getByRole("heading", { name: "Ed. Porto Bello" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aparelhos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Histórico de atendimentos" })).toBeVisible();
  // WhatsApp com mensagem pronta
  const wa = page.getByRole("link", { name: /WhatsApp/ }).first();
  await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/55\d{10,11}\?text=/);
});

test("equipamentos com limpeza vencida trazem convite pronto", async ({ page }) => {
  await entrar(page);
  await page.goto("/equipamentos");
  await page.getByRole("button", { name: /Limpeza vencida/ }).click();
  await expect(page).toHaveURL(/situacao=limpeza/);
  await page.getByRole("link", { name: /BTUs/ }).first().click();
  await expect(page.getByText("Ciclo de limpeza")).toBeVisible();
  const href = await page.getByRole("link", { name: "WhatsApp" }).first().getAttribute("href");
  expect(decodeURIComponent(href!)).toMatch(/está há \d+ meses sem limpeza/);
});

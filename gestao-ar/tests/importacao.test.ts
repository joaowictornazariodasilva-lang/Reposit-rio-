import { describe, expect, it } from "vitest";
import { CAMPOS, lerNumero, mapearColunas, modeloCsv, validarLinha } from "@/lib/importacao";

describe("mapeamento de colunas", () => {
  it("reconhece cabeçalhos comuns de planilhas brasileiras", () => {
    const m = mapearColunas("clientes", ["Cliente", "CPF/CNPJ", "Celular", "E-mail", "Endereço", "Nº", "Bairro", "Cidade", "UF", "CEP", "Obs."]);
    expect(m).toMatchObject({ nome: 0, documento: 1, whatsapp: 2, email: 3, logradouro: 4, numero: 5, bairro: 6, cidade: 7, uf: 8, cep: 9, notas: 10, telefone: -1 });
  });
  it("o modelo gerado é reconhecido 100% pelo próprio mapeador", () => {
    for (const ent of ["clientes", "produtos"] as const) {
      const cab = modeloCsv(ent).replace(/^﻿/, "").split("\r\n")[0]!.split(";");
      const m = mapearColunas(ent, cab);
      CAMPOS[ent].forEach((c, i) => expect(m[c.chave], `${ent}.${c.chave}`).toBe(i));
    }
  });
  it("produtos: separa SKU de código de barras e custo de preço", () => {
    const m = mapearColunas("produtos", ["Descrição", "Código", "Código de barras", "Preço de custo", "Preço de venda"]);
    expect(m).toMatchObject({ nome: 0, sku: 1, codigoBarras: 2, custo: 3, preco: 4 });
  });
});

describe("validação de linhas", () => {
  it("normaliza números em formato brasileiro", () => {
    expect(lerNumero("R$ 1.234,56")).toBe(1234.56);
    expect(lerNumero("55.5")).toBe(55.5);
    expect(lerNumero("")).toBeNull();
    expect(lerNumero("abc")).toBeNull();
  });
  it("aponta erros por campo e deduz PF/PJ pelo documento", () => {
    const ok = validarLinha("clientes", { nome: "Clínica Bem Estar", documento: "19.131.243/0001-97", whatsapp: "+55 (85) 99123-4567", tags: "VIP; Contrato" });
    expect(ok.erros).toEqual({});
    expect(ok.dados).toMatchObject({ tipo: "pj", whatsapp: "85991234567", tags: ["VIP", "Contrato"] });
    const ruim = validarLinha("clientes", { nome: "", documento: "123.456.789-00", email: "x@", cep: "601" });
    expect(Object.keys(ruim.erros).sort()).toEqual(["cep", "documento", "email", "nome"]);
  });
  it("produtos: unidade e valores", () => {
    const r = validarLinha("produtos", { nome: "Tubo 1/4", unidade: "metro", custo: "28,50", preco: "-1" });
    expect(r.dados).toMatchObject({ unidade: "m", custo: 28.5 });
    expect(r.erros.preco).toBeDefined();
  });
});

import { describe, expect, it } from "vitest";
import { cnpjValido, cpfValido, documentoValido, linkWhatsApp, preencherModelo, primeiroNome } from "@/lib/br";
import { cep, documento, iniciais, moeda, telefone, dataCurta, hojeISO } from "@/lib/format";
import { mascaraCep, mascaraDocumento, mascaraTelefone } from "@/lib/mascaras";

describe("documentos", () => {
  it("valida CPF pelos dígitos verificadores", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("529.982.247-24")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
  });
  it("valida CNPJ", () => {
    expect(cnpjValido("19.131.243/0001-97")).toBe(true);
    expect(cnpjValido("19.131.243/0001-98")).toBe(false);
    expect(documentoValido("45723174000110")).toBe(true);
    expect(documentoValido("123")).toBe(false);
  });
});

describe("whatsapp e modelos", () => {
  it("monta link wa.me com DDI 55 e texto codificado", () => {
    expect(linkWhatsApp("(85) 99123-4567", "Olá, tudo bem?")).toBe("https://wa.me/5585991234567?text=Ol%C3%A1%2C%20tudo%20bem%3F");
    expect(linkWhatsApp("5585991234567")).toBe("https://wa.me/5585991234567");
    expect(linkWhatsApp("1234")).toBeNull();
    expect(linkWhatsApp(null)).toBeNull();
  });
  it("preenche variáveis e mantém as ausentes visíveis", () => {
    expect(preencherModelo("Oi {cliente}, seu {aparelho} em {data}", { cliente: "Ana", aparelho: "LG 12.000 BTUs" })).toBe("Oi Ana, seu LG 12.000 BTUs em {data}");
    expect(primeiroNome("  Maria  da Silva ")).toBe("Maria");
  });
});

describe("formatação pt-BR", () => {
  it("formata moeda, documento, telefone e CEP", () => {
    expect(moeda(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
    expect(documento("52998224725")).toBe("529.982.247-25");
    expect(documento("19131243000197")).toBe("19.131.243/0001-97");
    expect(telefone("85991234567")).toBe("(85) 99123-4567");
    expect(telefone("8532241890")).toBe("(85) 3224-1890");
    expect(cep("60160230")).toBe("60160-230");
    expect(iniciais("Ricardo de Moura")).toBe("RM");
  });
  it("datas puras não sofrem fuso; hoje é calculado em Fortaleza", () => {
    expect(dataCurta("2026-01-05")).toBe("05/01/2026");
    // 02:00 UTC do dia 15 ainda é dia 14 em Fortaleza (UTC-3)
    expect(hojeISO(new Date("2026-10-15T02:00:00Z"))).toBe("2026-10-14");
  });
  it("máscaras progressivas", () => {
    expect(mascaraTelefone("8599123")).toBe("(85) 9912-3");
    expect(mascaraTelefone("85991234567")).toBe("(85) 99123-4567");
    expect(mascaraDocumento("19131243000197", "pj")).toBe("19.131.243/0001-97");
    expect(mascaraDocumento("5299822472", "pf")).toBe("529.982.247-2");
    expect(mascaraCep("60160230")).toBe("60160-230");
  });
});

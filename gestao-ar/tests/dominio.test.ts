import { describe, expect, it } from "vitest";
import { situacaoGarantia, situacaoLimpeza } from "@/lib/dominio";
import { pode } from "@/lib/permissions";
import { mensagemLimpeza } from "@/lib/mensagens";

describe("ciclo de limpeza", () => {
  it("classifica atrasada, próxima, em dia e sem dados", () => {
    expect(situacaoLimpeza("2026-09-01", "2026-10-14").estado).toBe("vencida");
    expect(situacaoLimpeza("2026-07-01", "2026-10-14").rotulo).toBe("Limpeza atrasada há 3 meses");
    expect(situacaoLimpeza("2026-10-30", "2026-10-14")).toMatchObject({ estado: "proxima", dias: 16 });
    expect(situacaoLimpeza("2027-02-01", "2026-10-14").estado).toBe("em_dia");
    expect(situacaoLimpeza(null, "2026-10-14").estado).toBe("sem_dados");
  });
  it("garantia ativa, vencendo e vencida", () => {
    expect(situacaoGarantia("2026-10-20", "2026-10-14")).toMatchObject({ ativa: true, vencendo: true });
    expect(situacaoGarantia("2027-10-20", "2026-10-14")).toMatchObject({ ativa: true, vencendo: false });
    expect(situacaoGarantia("2026-01-01", "2026-10-14")?.ativa).toBe(false);
    expect(situacaoGarantia(null, "2026-10-14")).toBeNull();
  });
  it("mensagem de convite usa o primeiro nome, aparelho e meses sem limpeza", () => {
    const m = mensagemLimpeza({ marca: "LG", btus: 12000, ambiente: "Sala", proximaLimpeza: "2026-08-14", ultimaLimpeza: "2026-02-14T12:00:00Z" }, "Mariana Albuquerque", "Brisa", "2026-10-14");
    expect(m).toContain("Olá, Mariana!");
    expect(m).toContain("LG 12.000 BTUs (Sala)");
    expect(m).toContain("há 8 meses");
    expect(m).not.toMatch(/\{\w+\}/);
  });
});

describe("permissões", () => {
  it("técnico não vê custos, financeiro nem exclusões", () => {
    expect(pode("tecnico", "custos.ver")).toBe(false);
    expect(pode("tecnico", "financeiro.ver")).toBe(false);
    expect(pode("tecnico", "clientes.excluir")).toBe(false);
    expect(pode("tecnico", "equipamentos.ver")).toBe(true);
  });
  it("só admin gerencia equipe; financeiro vê custos", () => {
    expect(pode("admin", "equipe.gerenciar")).toBe(true);
    expect(pode("atendimento", "equipe.gerenciar")).toBe(false);
    expect(pode("financeiro", "custos.ver")).toBe(true);
    expect(pode("atendimento", "custos.ver")).toBe(false);
  });
});

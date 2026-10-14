import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

process.env.PGLITE_DIR = "memory://";
process.env.DEMO_SEED = "true";

const { getDb, schema } = await import("@/server/db");
const { listarClientes, listarEquipamentosDe, obterCliente } = await import("@/server/queries/clientes");
const { buscaGlobal } = await import("@/server/queries/busca");
const { conferirSenha, hashSenha } = await import("@/server/auth/password");

type Sessao = import("@/server/auth/session").Sessao;
let admin: Sessao;
let tecnico: Sessao;
const intruso: Sessao = { usuarioId: "00000000-0000-0000-0000-000000000000", empresaId: "00000000-0000-0000-0000-000000000001", nome: "X", email: "x@x", perfil: "admin" };

beforeAll(async () => {
  const db = await getDb();
  const us = await db.select().from(schema.usuarios);
  const a = us.find((u) => u.perfil === "admin")!;
  const t = us.find((u) => u.perfil === "tecnico")!;
  admin = { usuarioId: a.id, empresaId: a.empresaId, nome: a.nome, email: a.email, perfil: "admin" };
  tecnico = { usuarioId: t.id, empresaId: t.empresaId, nome: t.nome, email: t.email, perfil: "tecnico" };
}, 60_000);

describe("banco de demonstração", () => {
  it("migra e popula com dados coerentes", async () => {
    const { total, linhas } = await listarClientes(admin, {});
    expect(total).toBe(24);
    expect(linhas.length).toBe(24);
    expect(linhas.some((l) => l.qtdEquip > 0 && l.bairro)).toBe(true);
  });

  it("isola empresas: outra empresa não enxerga nada", async () => {
    expect((await listarClientes(intruso, {})).total).toBe(0);
    expect(await listarEquipamentosDe(intruso, {})).toHaveLength(0);
    const umCliente = (await listarClientes(admin, {})).linhas[0]!;
    expect(await obterCliente(intruso, umCliente.id)).toBeNull();
    expect(await buscaGlobal(intruso, "a")).toEqual([]);
    expect(await buscaGlobal(intruso, umCliente.nome.slice(0, 5))).toEqual([]);
  });

  it("filtro de limpeza vencida bate com o cálculo da próxima limpeza", async () => {
    const vencidas = await listarEquipamentosDe(admin, { situacao: "limpeza" });
    expect(vencidas.length).toBeGreaterThan(0);
    const hoje = new Date().toISOString().slice(0, 10);
    for (const e of vencidas) expect(e.proximaLimpeza! <= hoje).toBe(true);
  });

  it("busca global respeita o perfil (técnico não busca produtos)", async () => {
    const r = await buscaGlobal(tecnico, "Capacitor");
    expect(r.filter((x) => x.grupo === "Produtos")).toHaveLength(0);
    const r2 = await buscaGlobal(admin, "Capacitor");
    expect(r2.some((x) => x.grupo === "Produtos")).toBe(true);
  });

  it("busca trata curingas como texto", async () => {
    expect(await buscaGlobal(admin, "%%")).toEqual([]);
  });

  it("senhas guardadas com scrypt e conferidas", async () => {
    const db = await getDb();
    const u = await db.query.usuarios.findFirst({ where: eq(schema.usuarios.id, admin.usuarioId) });
    expect(u!.senhaHash.startsWith("scrypt$")).toBe(true);
    expect(await conferirSenha("brisa2026", u!.senhaHash)).toBe(true);
    expect(await conferirSenha("errada", u!.senhaHash)).toBe(false);
    expect(await conferirSenha("x", await hashSenha("x"))).toBe(true);
  });
});

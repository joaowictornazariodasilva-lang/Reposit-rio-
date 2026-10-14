"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/server/db";
import { exigirPermissao } from "@/server/auth/session";
import { registrar } from "@/server/audit";
import { soDigitos } from "@/lib/format";
import { errosDeCampo, falha, opcional, type Resultado } from "./resultado";

const dinheiro = z.coerce.number({ message: "Valor inválido." }).min(0, "Não pode ser negativo.").max(10_000_000).transform((v) => Math.round(v * 100) / 100);

/* ───────────── Tipos de serviço ───────────── */

const servicoSchema = z.object({
  nome: z.string().trim().min(2, "Dê um nome ao serviço.").max(100),
  categoria: z.enum(schema.categoriaServicoEnum.enumValues),
  descricao: opcional,
  precoPadrao: dinheiro,
  variacoes: z
    .array(z.object({ btusAte: z.coerce.number().int().min(1000).max(500000), preco: dinheiro }))
    .max(12)
    .default([])
    .transform((v) => [...v].sort((a, b) => a.btusAte - b.btusAte)),
  duracaoMin: z.coerce.number().int().min(5, "Mínimo 5 min.").max(24 * 60),
  garantiaDias: z.coerce.number().int().min(0).max(3650),
  recorrenciaMeses: z.coerce.number().int().min(0).max(60).nullable().optional().transform((v) => (v ? v : null)),
  ativo: z.boolean().default(true),
});
export type ServicoInput = z.input<typeof servicoSchema>;

export async function salvarServico(id: string | null, input: ServicoInput): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("cadastros.editar");
    const p = servicoSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(p.error) };
    const db = await getDb();
    const t = schema.tiposServico;
    let novo = id;
    if (id) {
      const r = await db.update(t).set(p.data).where(and(eq(t.id, id), eq(t.empresaId, sessao.empresaId))).returning({ id: t.id });
      if (!r.length) return { ok: false, erro: "Serviço não encontrado." };
    } else {
      const [r] = await db.insert(t).values({ ...p.data, empresaId: sessao.empresaId }).returning({ id: t.id });
      novo = r!.id;
    }
    await registrar(db, sessao, "tipo_servico", novo, id ? "editar" : "criar", `Serviço "${p.data.nome}" salvo`);
    revalidatePath("/cadastros", "layout");
    return { ok: true, id: novo! };
  } catch (e) {
    return falha(e);
  }
}

/* ───────────── Produtos / peças ───────────── */

const produtoSchema = z.object({
  nome: z.string().trim().min(2, "Dê um nome ao produto.").max(140),
  sku: opcional,
  codigoBarras: z.string().optional().nullable().transform((v) => soDigitos(v) || null).refine((v) => !v || (v.length >= 8 && v.length <= 14), "Código de barras com 8 a 14 dígitos."),
  categoriaId: z.uuid().nullable().optional().or(z.literal("")).transform((v) => v || null),
  fornecedorId: z.uuid().nullable().optional().or(z.literal("")).transform((v) => v || null),
  unidade: z.enum(["un", "m", "kg", "l", "cx", "par"]).default("un"),
  custo: dinheiro,
  preco: dinheiro,
  estoqueMinimo: z.coerce.number().min(0).max(1_000_000).default(0),
  favorito: z.boolean().default(false),
});
export type ProdutoInput = z.input<typeof produtoSchema>;

export async function salvarProduto(id: string | null, input: ProdutoInput): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("cadastros.editar");
    const p = produtoSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(p.error) };
    const db = await getDb();
    const t = schema.produtos;
    // Categoria/fornecedor precisam ser da mesma empresa
    if (p.data.categoriaId && !(await db.query.categorias.findFirst({ where: and(eq(schema.categorias.id, p.data.categoriaId), eq(schema.categorias.empresaId, sessao.empresaId)) })))
      return { ok: false, erro: "Categoria inválida." };
    if (p.data.fornecedorId && !(await db.query.fornecedores.findFirst({ where: and(eq(schema.fornecedores.id, p.data.fornecedorId), eq(schema.fornecedores.empresaId, sessao.empresaId)) })))
      return { ok: false, erro: "Fornecedor inválido." };
    let novo = id;
    if (id) {
      const r = await db.update(t).set(p.data).where(and(eq(t.id, id), eq(t.empresaId, sessao.empresaId))).returning({ id: t.id });
      if (!r.length) return { ok: false, erro: "Produto não encontrado." };
    } else {
      const [r] = await db.insert(t).values({ ...p.data, empresaId: sessao.empresaId }).returning({ id: t.id });
      novo = r!.id;
    }
    await registrar(db, sessao, "produto", novo, id ? "editar" : "criar", `Produto "${p.data.nome}" salvo`);
    revalidatePath("/cadastros", "layout");
    return { ok: true, id: novo! };
  } catch (e) {
    return falha(e);
  }
}

export async function alternarFavorito(id: string, favorito: boolean): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("cadastros.editar");
    const db = await getDb();
    await db.update(schema.produtos).set({ favorito }).where(and(eq(schema.produtos.id, id), eq(schema.produtos.empresaId, sessao.empresaId)));
    revalidatePath("/cadastros/produtos");
    return { ok: true, id };
  } catch (e) {
    return falha(e);
  }
}

/** Exclusão reversível (some das listas, o histórico continua apontando para o item). */
export async function excluirCadastro(tipo: "produto" | "fornecedor" | "kit", ids: string[], desfazer = false): Promise<Resultado<{ quantidade: number }>> {
  try {
    const sessao = await exigirPermissao("cadastros.editar");
    const db = await getDb();
    const tabela = tipo === "produto" ? schema.produtos : tipo === "fornecedor" ? schema.fornecedores : schema.kits;
    const r = await db
      .update(tabela)
      .set({ excluidoEm: desfazer ? null : new Date() })
      .where(and(eq(tabela.empresaId, sessao.empresaId), inArray(tabela.id, ids.slice(0, 500))))
      .returning({ id: tabela.id });
    await registrar(db, sessao, tipo, r.length === 1 ? r[0]!.id : null, desfazer ? "restaurar" : "excluir", `${r.length} ${tipo}(s) ${desfazer ? "restaurado(s)" : "excluído(s)"}`);
    revalidatePath("/cadastros", "layout");
    return { ok: true, quantidade: r.length };
  } catch (e) {
    return falha(e);
  }
}

export async function criarCategoria(nome: string): Promise<Resultado<{ id: string; nome: string }>> {
  try {
    const sessao = await exigirPermissao("cadastros.editar");
    const n = nome.trim().slice(0, 60);
    if (n.length < 2) return { ok: false, erro: "Nome da categoria muito curto." };
    const db = await getDb();
    const [c] = await db.insert(schema.categorias).values({ empresaId: sessao.empresaId, nome: n }).returning();
    revalidatePath("/cadastros/produtos");
    return { ok: true, id: c!.id, nome: c!.nome };
  } catch (e) {
    return falha(e);
  }
}

/* ───────────── Fornecedores ───────────── */

const fone = z.string().optional().nullable().transform((v) => soDigitos(v) || null).refine((v) => !v || (v.length >= 10 && v.length <= 13), "Telefone com DDD.");
const fornecedorSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(140),
  documento: z.string().optional().nullable().transform((v) => soDigitos(v) || null),
  contato: opcional,
  telefone: fone,
  whatsapp: fone,
  email: opcional.refine((v) => !v || z.email().safeParse(v).success, "E-mail inválido."),
  prazoEntregaDias: z.coerce.number().int().min(0).max(365).nullable().optional().transform((v) => (v || v === 0 ? v : null)),
  notas: opcional,
});
export type FornecedorInput = z.input<typeof fornecedorSchema>;

export async function salvarFornecedor(id: string | null, input: FornecedorInput): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("cadastros.editar");
    const p = fornecedorSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosDeCampo(p.error) };
    const db = await getDb();
    const t = schema.fornecedores;
    let novo = id;
    if (id) {
      const r = await db.update(t).set(p.data).where(and(eq(t.id, id), eq(t.empresaId, sessao.empresaId))).returning({ id: t.id });
      if (!r.length) return { ok: false, erro: "Fornecedor não encontrado." };
    } else {
      const [r] = await db.insert(t).values({ ...p.data, empresaId: sessao.empresaId }).returning({ id: t.id });
      novo = r!.id;
    }
    await registrar(db, sessao, "fornecedor", novo, id ? "editar" : "criar", `Fornecedor "${p.data.nome}" salvo`);
    revalidatePath("/cadastros", "layout");
    return { ok: true, id: novo! };
  } catch (e) {
    return falha(e);
  }
}

/* ───────────── Kits ───────────── */

const kitSchema = z.object({
  nome: z.string().trim().min(2, "Dê um nome ao kit.").max(120),
  descricao: opcional,
  favorito: z.boolean().default(true),
  itens: z
    .array(
      z.object({
        tipoServicoId: z.uuid().nullable().optional(),
        produtoId: z.uuid().nullable().optional(),
        quantidade: z.coerce.number().positive("Quantidade maior que zero.").max(10000),
        precoUnitario: z.coerce.number().min(0).nullable().optional(),
      }).refine((i) => !!i.tipoServicoId !== !!i.produtoId, "Cada item é um serviço ou um produto."),
    )
    .min(1, "Adicione ao menos um item.")
    .max(40),
});
export type KitInput = z.input<typeof kitSchema>;

export async function salvarKit(id: string | null, input: KitInput): Promise<Resultado> {
  try {
    const sessao = await exigirPermissao("cadastros.editar");
    const p = kitSchema.safeParse(input);
    if (!p.success) return { ok: false, erro: p.error.issues[0]?.message ?? "Confira o kit.", campos: errosDeCampo(p.error) };
    const db = await getDb();
    const servIds = p.data.itens.map((i) => i.tipoServicoId).filter((x): x is string => !!x);
    const prodIds = p.data.itens.map((i) => i.produtoId).filter((x): x is string => !!x);
    const [okServ, okProd] = await Promise.all([
      servIds.length ? db.$count(schema.tiposServico, and(eq(schema.tiposServico.empresaId, sessao.empresaId), inArray(schema.tiposServico.id, servIds))) : 0,
      prodIds.length ? db.$count(schema.produtos, and(eq(schema.produtos.empresaId, sessao.empresaId), inArray(schema.produtos.id, prodIds))) : 0,
    ]);
    if (okServ !== new Set(servIds).size || okProd !== new Set(prodIds).size) return { ok: false, erro: "Há itens inválidos no kit." };

    const novo = await db.transaction(async (tx) => {
      let kitId = id;
      const { itens, ...dados } = p.data;
      if (id) {
        const r = await tx.update(schema.kits).set(dados).where(and(eq(schema.kits.id, id), eq(schema.kits.empresaId, sessao.empresaId))).returning({ id: schema.kits.id });
        if (!r.length) throw new Error("kit não encontrado");
        await tx.delete(schema.kitItens).where(eq(schema.kitItens.kitId, id));
      } else {
        const [k] = await tx.insert(schema.kits).values({ ...dados, empresaId: sessao.empresaId }).returning({ id: schema.kits.id });
        kitId = k!.id;
      }
      await tx.insert(schema.kitItens).values(itens.map((i) => ({ kitId: kitId!, tipoServicoId: i.tipoServicoId ?? null, produtoId: i.produtoId ?? null, quantidade: i.quantidade, precoUnitario: i.precoUnitario ?? null })));
      await registrar(tx, sessao, "kit", kitId, id ? "editar" : "criar", `Kit "${dados.nome}" salvo`);
      return kitId!;
    });
    revalidatePath("/cadastros", "layout");
    return { ok: true, id: novo };
  } catch (e) {
    return falha(e);
  }
}

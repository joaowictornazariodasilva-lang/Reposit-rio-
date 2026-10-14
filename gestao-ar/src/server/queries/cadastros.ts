import "server-only";
import { and, asc, eq, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import type { Sessao } from "@/server/auth/session";
import { like } from "./busca";

export async function listarServicos(sessao: Sessao) {
  const db = await getDb();
  const t = schema.tiposServico;
  return db
    .select({
      id: t.id,
      nome: t.nome,
      categoria: t.categoria,
      descricao: t.descricao,
      precoPadrao: t.precoPadrao,
      variacoes: t.variacoes,
      duracaoMin: t.duracaoMin,
      garantiaDias: t.garantiaDias,
      recorrenciaMeses: t.recorrenciaMeses,
      ativo: t.ativo,
      usos: sql<number>`(select count(*)::int from ${schema.ordensServico} o where o.tipo_servico_id = "tipos_servico"."id")`,
    })
    .from(t)
    .where(eq(t.empresaId, sessao.empresaId))
    .orderBy(sql`${t.ativo} desc`, asc(t.nome));
}

export async function listarProdutos(sessao: Sessao, f: { q?: string; categoria?: string; filtro?: string } = {}) {
  const db = await getDb();
  const p = schema.produtos;
  const cond: (SQL | undefined)[] = [eq(p.empresaId, sessao.empresaId), isNull(p.excluidoEm)];
  if (f.q?.trim()) cond.push(or(ilike(p.nome, like(f.q.trim())), ilike(p.sku, like(f.q.trim())), eq(p.codigoBarras, f.q.trim())));
  if (f.categoria) cond.push(eq(p.categoriaId, f.categoria));
  if (f.filtro === "favoritos") cond.push(eq(p.favorito, true));
  if (f.filtro === "sem_preco") cond.push(eq(p.preco, 0));
  return db
    .select({
      id: p.id,
      nome: p.nome,
      sku: p.sku,
      codigoBarras: p.codigoBarras,
      unidade: p.unidade,
      custo: p.custo,
      preco: p.preco,
      estoqueMinimo: p.estoqueMinimo,
      favorito: p.favorito,
      categoriaId: p.categoriaId,
      categoria: schema.categorias.nome,
      fornecedorId: p.fornecedorId,
      fornecedor: schema.fornecedores.nome,
    })
    .from(p)
    .leftJoin(schema.categorias, eq(schema.categorias.id, p.categoriaId))
    .leftJoin(schema.fornecedores, eq(schema.fornecedores.id, p.fornecedorId))
    .where(and(...cond))
    .orderBy(sql`${p.favorito} desc`, asc(p.nome));
}

export async function listarCategorias(sessao: Sessao) {
  const db = await getDb();
  return db.select({ id: schema.categorias.id, nome: schema.categorias.nome }).from(schema.categorias).where(eq(schema.categorias.empresaId, sessao.empresaId)).orderBy(schema.categorias.nome);
}

export async function listarFornecedores(sessao: Sessao) {
  const db = await getDb();
  const f = schema.fornecedores;
  return db
    .select({
      id: f.id,
      nome: f.nome,
      documento: f.documento,
      contato: f.contato,
      telefone: f.telefone,
      whatsapp: f.whatsapp,
      email: f.email,
      prazoEntregaDias: f.prazoEntregaDias,
      notas: f.notas,
      produtos: sql<number>`(select count(*)::int from ${schema.produtos} p where p.fornecedor_id = "fornecedores"."id" and p.excluido_em is null)`,
    })
    .from(f)
    .where(and(eq(f.empresaId, sessao.empresaId), isNull(f.excluidoEm)))
    .orderBy(asc(f.nome));
}

export async function listarKits(sessao: Sessao) {
  const db = await getDb();
  const kits = await db.select().from(schema.kits).where(and(eq(schema.kits.empresaId, sessao.empresaId), isNull(schema.kits.excluidoEm))).orderBy(asc(schema.kits.nome));
  if (!kits.length) return [];
  const itens = await db
    .select({
      id: schema.kitItens.id,
      kitId: schema.kitItens.kitId,
      tipoServicoId: schema.kitItens.tipoServicoId,
      produtoId: schema.kitItens.produtoId,
      quantidade: schema.kitItens.quantidade,
      precoUnitario: schema.kitItens.precoUnitario,
      nome: sql<string>`coalesce(${schema.tiposServico.nome}, ${schema.produtos.nome})`,
      unidade: schema.produtos.unidade,
      precoCadastro: sql<number>`coalesce(${schema.produtos.preco}, ${schema.tiposServico.precoPadrao})::float`,
      custoCadastro: sql<number>`coalesce(${schema.produtos.custo}, 0)::float`,
    })
    .from(schema.kitItens)
    .innerJoin(schema.kits, eq(schema.kits.id, schema.kitItens.kitId))
    .leftJoin(schema.tiposServico, eq(schema.tiposServico.id, schema.kitItens.tipoServicoId))
    .leftJoin(schema.produtos, eq(schema.produtos.id, schema.kitItens.produtoId))
    .where(eq(schema.kits.empresaId, sessao.empresaId));
  return kits.map((k) => {
    const its = itens.filter((i) => i.kitId === k.id);
    const total = its.reduce((s, i) => s + i.quantidade * (i.precoUnitario ?? i.precoCadastro), 0);
    const custo = its.reduce((s, i) => s + i.quantidade * i.custoCadastro, 0);
    return { ...k, itens: its, total, custo };
  });
}

export type Kit = Awaited<ReturnType<typeof listarKits>>[number];
export type Produto = Awaited<ReturnType<typeof listarProdutos>>[number];
export type Servico = Awaited<ReturnType<typeof listarServicos>>[number];
export type Fornecedor = Awaited<ReturnType<typeof listarFornecedores>>[number];

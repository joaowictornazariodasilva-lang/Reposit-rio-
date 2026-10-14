import "server-only";
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import type { Sessao } from "@/server/auth/session";
import { soDigitos } from "@/lib/format";
import { like } from "./busca";

export const POR_PAGINA = 25;

export type FiltroClientes = { q?: string; tipo?: string; tag?: string; ordem?: string; pagina?: number; todos?: boolean };

export async function listarClientes(sessao: Sessao, f: FiltroClientes) {
  const db = await getDb();
  const c = schema.clientes;
  const cond: (SQL | undefined)[] = [eq(c.empresaId, sessao.empresaId), isNull(c.excluidoEm)];
  const q = f.q?.trim();
  if (q) {
    const d = soDigitos(q);
    cond.push(
      or(
        ilike(c.nome, like(q)),
        ilike(c.nomeFantasia, like(q)),
        ilike(c.email, like(q)),
        d.length >= 3 ? or(ilike(c.documento, like(d)), ilike(c.whatsapp, like(d)), ilike(c.telefone, like(d))) : undefined,
        /^\d+$/.test(q) ? eq(c.codigo, Number(q)) : undefined,
        sql`exists (select 1 from ${schema.locais} l where l.cliente_id = "clientes"."id" and (l.bairro ilike ${like(q)} or l.logradouro ilike ${like(q)}))`,
      ),
    );
  }
  if (f.tipo === "pf" || f.tipo === "pj") cond.push(eq(c.tipo, f.tipo));
  if (f.tag) cond.push(sql`${f.tag} = any(${c.tags})`);
  const where = and(...cond);

  const qtdEquip = sql<number>`(select count(*)::int from ${schema.equipamentos} e where e.cliente_id = "clientes"."id" and e.excluido_em is null)`;
  const ultimoServico = sql<string | null>`(select max(o.concluida_em) from ${schema.ordensServico} o where o.cliente_id = "clientes"."id")`;
  const totalGasto = sql<number>`(select coalesce(sum(o.valor_total), 0)::float from ${schema.ordensServico} o where o.cliente_id = "clientes"."id" and o.status in ('concluida','faturada'))`;

  const ordem =
    f.ordem === "recentes"
      ? [desc(c.criadoEm)]
      : f.ordem === "ultimo"
        ? [sql`${ultimoServico} desc nulls last`]
        : f.ordem === "valor"
          ? [sql`${totalGasto} desc`]
          : [asc(sql`coalesce(${c.nomeFantasia}, ${c.nome})`)];

  const pagina = Math.max(1, f.pagina ?? 1);
  const [linhas, [{ total } = { total: 0 }]] = await Promise.all([
    db
      .select({
        id: c.id,
        codigo: c.codigo,
        tipo: c.tipo,
        nome: c.nome,
        nomeFantasia: c.nomeFantasia,
        documento: c.documento,
        whatsapp: c.whatsapp,
        telefone: c.telefone,
        email: c.email,
        tags: c.tags,
        bairro: sql<string | null>`(select l.bairro from ${schema.locais} l where l.cliente_id = "clientes"."id" order by l.principal desc limit 1)`,
        cidade: sql<string | null>`(select l.cidade from ${schema.locais} l where l.cliente_id = "clientes"."id" order by l.principal desc limit 1)`,
        qtdEquip,
        ultimoServico,
        totalGasto,
      })
      .from(c)
      .where(where)
      .orderBy(...ordem)
      .limit(f.todos ? 10_000 : POR_PAGINA)
      .offset(f.todos ? 0 : (pagina - 1) * POR_PAGINA),
    db.select({ total: sql<number>`count(*)::int` }).from(c).where(where),
  ]);
  return { linhas, total, pagina, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) };
}

export type LinhaCliente = Awaited<ReturnType<typeof listarClientes>>["linhas"][number];

export async function tagsDaEmpresa(sessao: Sessao): Promise<string[]> {
  const db = await getDb();
  const r = await db.execute<{ tag: string }>(
    sql`select distinct unnest(tags) as tag from ${schema.clientes} where empresa_id = ${sessao.empresaId} and excluido_em is null order by 1`,
  );
  return (r as unknown as { rows: { tag: string }[] }).rows.map((x) => x.tag);
}

export async function obterCliente(sessao: Sessao, id: string) {
  const db = await getDb();
  const cliente = await db.query.clientes.findFirst({
    where: and(eq(schema.clientes.id, id), eq(schema.clientes.empresaId, sessao.empresaId), isNull(schema.clientes.excluidoEm)),
  });
  if (!cliente) return null;
  const [locais, contatos, equipamentos, ordens] = await Promise.all([
    db.select().from(schema.locais).where(eq(schema.locais.clienteId, id)).orderBy(desc(schema.locais.principal), schema.locais.nome),
    db.select().from(schema.contatos).where(eq(schema.contatos.clienteId, id)).orderBy(desc(schema.contatos.principal), schema.contatos.nome),
    listarEquipamentosDe(sessao, { clienteId: id }),
    db
      .select({
        id: schema.ordensServico.id,
        numero: schema.ordensServico.numero,
        status: schema.ordensServico.status,
        abertaEm: schema.ordensServico.abertaEm,
        agendadaPara: schema.ordensServico.agendadaPara,
        concluidaEm: schema.ordensServico.concluidaEm,
        valorTotal: schema.ordensServico.valorTotal,
        ehRetorno: schema.ordensServico.ehRetorno,
        servico: schema.tiposServico.nome,
        categoria: schema.tiposServico.categoria,
        equipamentoId: schema.ordensServico.equipamentoId,
        tecnico: schema.usuarios.nome,
      })
      .from(schema.ordensServico)
      .leftJoin(schema.tiposServico, eq(schema.tiposServico.id, schema.ordensServico.tipoServicoId))
      .leftJoin(schema.usuarios, eq(schema.usuarios.id, schema.ordensServico.tecnicoId))
      .where(and(eq(schema.ordensServico.clienteId, id), eq(schema.ordensServico.empresaId, sessao.empresaId)))
      .orderBy(desc(sql`coalesce(${schema.ordensServico.concluidaEm}, ${schema.ordensServico.agendadaPara}, ${schema.ordensServico.abertaEm})`)),
  ]);
  return { cliente, locais, contatos, equipamentos, ordens };
}

/** Equipamentos com a última limpeza e situação calculadas no banco. */
export async function listarEquipamentosDe(
  sessao: Sessao,
  f: { clienteId?: string; q?: string; tipo?: string; situacao?: string; ids?: string[]; limite?: number; offset?: number },
) {
  const db = await getDb();
  const e = schema.equipamentos;
  const cond: (SQL | undefined)[] = [eq(e.empresaId, sessao.empresaId), isNull(e.excluidoEm), isNull(schema.clientes.excluidoEm)];
  if (f.clienteId) cond.push(eq(e.clienteId, f.clienteId));
  if (f.ids) cond.push(inArray(e.id, f.ids));
  if (f.tipo && (schema.tipoEquipamentoEnum.enumValues as readonly string[]).includes(f.tipo)) cond.push(eq(e.tipo, f.tipo as (typeof e.tipo.enumValues)[number]));
  const q = f.q?.trim();
  if (q)
    cond.push(
      or(
        ilike(e.marca, like(q)),
        ilike(e.modelo, like(q)),
        ilike(e.numeroSerie, like(q)),
        ilike(e.ambiente, like(q)),
        ilike(schema.clientes.nome, like(q)),
        ilike(schema.clientes.nomeFantasia, like(q)),
        /^\d{4,6}$/.test(q) ? eq(e.btus, Number(q)) : undefined,
      ),
    );

  const ultimaLimpeza = sql<string | null>`(
    select max(o.concluida_em) from ${schema.ordensServico} o
    join ${schema.tiposServico} t on t.id = o.tipo_servico_id
    where o.equipamento_id = "equipamentos"."id" and o.concluida_em is not null
      and t.categoria in ('preventiva','higienizacao','pmoc','instalacao')
  )`;
  const proximaLimpeza = sql<string | null>`(coalesce(${ultimaLimpeza}, "equipamentos"."data_instalacao"::timestamptz) + interval '6 months')::date::text`;
  const ultimoServico = sql<string | null>`(select max(o.concluida_em) from ${schema.ordensServico} o where o.equipamento_id = "equipamentos"."id")`;
  const qtdServicos = sql<number>`(select count(*)::int from ${schema.ordensServico} o where o.equipamento_id = "equipamentos"."id" and o.status <> 'cancelada')`;

  if (f.situacao === "limpeza") cond.push(sql`${proximaLimpeza}::date <= current_date`);
  if (f.situacao === "garantia") cond.push(sql`${e.garantiaAte} between current_date and current_date + 30`);
  if (f.situacao === "em_garantia") cond.push(sql`${e.garantiaAte} >= current_date`);

  const where = and(...cond);
  const base = db
    .select({
      id: e.id,
      clienteId: e.clienteId,
      cliente: sql<string>`coalesce(${schema.clientes.nomeFantasia}, ${schema.clientes.nome})`,
      clienteWhatsapp: schema.clientes.whatsapp,
      localId: e.localId,
      local: schema.locais.nome,
      bairro: schema.locais.bairro,
      tipo: e.tipo,
      marca: e.marca,
      modelo: e.modelo,
      btus: e.btus,
      gas: e.gas,
      tensao: e.tensao,
      inverter: e.inverter,
      numeroSerie: e.numeroSerie,
      ambiente: e.ambiente,
      dataInstalacao: e.dataInstalacao,
      garantiaAte: e.garantiaAte,
      instaladoPorNos: e.instaladoPorNos,
      observacoes: e.observacoes,
      ultimaLimpeza,
      proximaLimpeza,
      ultimoServico,
      qtdServicos,
      total: sql<number>`(count(*) over())::int`,
    })
    .from(e)
    .innerJoin(schema.clientes, eq(schema.clientes.id, e.clienteId))
    .leftJoin(schema.locais, eq(schema.locais.id, e.localId))
    .where(where)
    .orderBy(sql`${proximaLimpeza} asc nulls last`, e.marca);
  return f.limite ? base.limit(f.limite).offset(f.offset ?? 0) : base;
}

export type LinhaEquipamento = Awaited<ReturnType<typeof listarEquipamentosDe>>[number];

export async function obterEquipamento(sessao: Sessao, id: string) {
  const db = await getDb();
  const [eq0] = await listarEquipamentosDe(sessao, { ids: [id] });
  if (!eq0) return null;
  const historico = await db
    .select({
      id: schema.ordensServico.id,
      numero: schema.ordensServico.numero,
      status: schema.ordensServico.status,
      descricao: schema.ordensServico.descricao,
      abertaEm: schema.ordensServico.abertaEm,
      agendadaPara: schema.ordensServico.agendadaPara,
      concluidaEm: schema.ordensServico.concluidaEm,
      valorTotal: schema.ordensServico.valorTotal,
      ehRetorno: schema.ordensServico.ehRetorno,
      servico: schema.tiposServico.nome,
      categoria: schema.tiposServico.categoria,
      garantiaDias: schema.tiposServico.garantiaDias,
      tecnico: schema.usuarios.nome,
      tecnicoCor: schema.usuarios.cor,
    })
    .from(schema.ordensServico)
    .leftJoin(schema.tiposServico, eq(schema.tiposServico.id, schema.ordensServico.tipoServicoId))
    .leftJoin(schema.usuarios, eq(schema.usuarios.id, schema.ordensServico.tecnicoId))
    .where(and(eq(schema.ordensServico.equipamentoId, id), eq(schema.ordensServico.empresaId, sessao.empresaId)))
    .orderBy(desc(sql`coalesce(${schema.ordensServico.concluidaEm}, ${schema.ordensServico.agendadaPara}, ${schema.ordensServico.abertaEm})`));
  const local = eq0.localId ? await db.query.locais.findFirst({ where: eq(schema.locais.id, eq0.localId) }) : null;
  return { equipamento: eq0, historico, local };
}

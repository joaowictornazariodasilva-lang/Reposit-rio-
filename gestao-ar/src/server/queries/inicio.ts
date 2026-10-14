import "server-only";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import type { Sessao } from "@/server/auth/session";
import { FUSO } from "@/lib/format";
import { listarEquipamentosDe } from "./clientes";

export async function dadosInicio(sessao: Sessao) {
  const db = await getDb();
  const o = schema.ordensServico;
  const e = sessao.empresaId;
  const hojeIni = sql`(date_trunc('day', now() at time zone ${FUSO}) at time zone ${FUSO})`;
  const mesIni = sql`(date_trunc('month', now() at time zone ${FUSO}) at time zone ${FUSO})`;
  const mesAntIni = sql`(date_trunc('month', (now() at time zone ${FUSO}) - interval '1 month') at time zone ${FUSO})`;
  const mesmoDiaMesAnt = sql`((now() at time zone ${FUSO}) - interval '1 month') at time zone ${FUSO}`;

  const filtroTecnico = sessao.perfil === "tecnico" ? eq(o.tecnicoId, sessao.usuarioId) : undefined;

  const [empresa, hoje, kpis, pendencias, vencidas, garantias] = await Promise.all([
    db.query.empresas.findFirst({ where: eq(schema.empresas.id, e) }),
    db
      .select({
        id: o.id,
        numero: o.numero,
        status: o.status,
        agendadaPara: o.agendadaPara,
        cliente: sql<string>`coalesce(${schema.clientes.nomeFantasia}, ${schema.clientes.nome})`,
        clienteId: o.clienteId,
        whatsapp: schema.clientes.whatsapp,
        servico: schema.tiposServico.nome,
        tecnico: schema.usuarios.nome,
        tecnicoCor: schema.usuarios.cor,
        bairro: schema.locais.bairro,
        equipamentoId: o.equipamentoId,
      })
      .from(o)
      .innerJoin(schema.clientes, eq(schema.clientes.id, o.clienteId))
      .leftJoin(schema.tiposServico, eq(schema.tiposServico.id, o.tipoServicoId))
      .leftJoin(schema.usuarios, eq(schema.usuarios.id, o.tecnicoId))
      .leftJoin(schema.locais, eq(schema.locais.id, o.localId))
      .where(and(eq(o.empresaId, e), gte(o.agendadaPara, hojeIni), lt(o.agendadaPara, sql`${hojeIni} + interval '1 day'`), filtroTecnico))
      .orderBy(o.agendadaPara),
    db
      .select({
        clientes: sql<number>`(select count(*)::int from ${schema.clientes} where empresa_id = ${e} and excluido_em is null)`,
        aparelhos: sql<number>`(select count(*)::int from ${schema.equipamentos} where empresa_id = ${e} and excluido_em is null)`,
        faturamentoMes: sql<number>`coalesce(sum(${o.valorTotal}) filter (where ${o.concluidaEm} >= ${mesIni}), 0)::float`,
        faturamentoMesAnt: sql<number>`coalesce(sum(${o.valorTotal}) filter (where ${o.concluidaEm} >= ${mesAntIni} and ${o.concluidaEm} < ${mesmoDiaMesAnt}), 0)::float`,
        servicosMes: sql<number>`(count(*) filter (where ${o.concluidaEm} >= ${mesIni}))::int`,
        retornosMes: sql<number>`(count(*) filter (where ${o.concluidaEm} >= ${mesIni} and ${o.ehRetorno}))::int`,
        serie: sql<number[]>`array(
          select coalesce(sum(x.valor_total), 0)::float from generate_series(0, 5) g(i)
          left join ${o} x on x.empresa_id = ${e} and x.status in ('concluida','faturada')
            and x.concluida_em >= (date_trunc('month', now() at time zone ${FUSO}) - make_interval(months => g.i)) at time zone ${FUSO}
            and x.concluida_em < (date_trunc('month', now() at time zone ${FUSO}) - make_interval(months => g.i - 1)) at time zone ${FUSO}
          group by g.i order by g.i desc
        )`,
      })
      .from(o)
      .where(and(eq(o.empresaId, e), inArray(o.status, ["concluida", "faturada"]))),
    db
      .select({ status: o.status, n: sql<number>`count(*)::int` })
      .from(o)
      .where(and(eq(o.empresaId, e), inArray(o.status, ["aguardando_aprovacao", "aguardando_peca", "concluida", "aberta"]), filtroTecnico))
      .groupBy(o.status),
    listarEquipamentosDe(sessao, { situacao: "limpeza", limite: 6 }),
    listarEquipamentosDe(sessao, { situacao: "garantia", limite: 4 }),
  ]);

  const k = kpis[0] ?? { clientes: 0, aparelhos: 0, faturamentoMes: 0, faturamentoMesAnt: 0, servicosMes: 0, retornosMes: 0, serie: [] };
  const [servicosCadastrados, usuarios] = await Promise.all([
    db.$count(schema.tiposServico, eq(schema.tiposServico.empresaId, e)),
    db.$count(schema.usuarios, and(eq(schema.usuarios.empresaId, e), eq(schema.usuarios.ativo, true))),
  ]);

  return {
    empresa,
    hoje,
    kpis: k,
    pendencias: Object.fromEntries(pendencias.map((p) => [p.status, p.n])) as Partial<Record<string, number>>,
    vencidas,
    totalVencidas: vencidas[0]?.total ?? 0,
    garantias,
    totalGarantias: garantias[0]?.total ?? 0,
    onboarding: {
      empresa: !!empresa?.onboarding.includes("empresa"),
      logo: !!empresa?.logo || !!empresa?.onboarding.includes("logo"),
      servicos: servicosCadastrados > 0,
      equipe: usuarios > 1 || !!empresa?.onboarding.includes("equipe"),
      clientes: k.clientes > 0,
      oculto: !!empresa?.onboarding.includes("oculto"),
    },
  };
}


import "server-only";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/server/db";
import type { Sessao } from "@/server/auth/session";
import { pode } from "@/lib/permissions";
import { soDigitos } from "@/lib/format";
import { TIPOS_EQUIPAMENTO } from "@/lib/dominio";

export type ResultadoBusca = {
  grupo: "Clientes" | "Equipamentos" | "Produtos" | "Ordens de serviço";
  id: string;
  titulo: string;
  detalhe: string;
  href: string;
};

/** Escapa curingas do ILIKE para a busca do usuário não virar padrão. */
export const like = (q: string) => `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

export async function buscaGlobal(sessao: Sessao, q: string, so?: "clientes"): Promise<ResultadoBusca[]> {
  const termo = q.trim();
  if (termo.length < 2) return [];
  const db = await getDb();
  const e = sessao.empresaId;
  const digitos = soDigitos(termo);
  const out: ResultadoBusca[] = [];

  if (pode(sessao.perfil, "clientes.ver")) {
    const c = schema.clientes;
    const rows = await db
      .select({ id: c.id, nome: c.nome, fantasia: c.nomeFantasia, codigo: c.codigo, whatsapp: c.whatsapp })
      .from(c)
      .where(
        and(
          eq(c.empresaId, e),
          isNull(c.excluidoEm),
          or(
            ilike(c.nome, like(termo)),
            ilike(c.nomeFantasia, like(termo)),
            ilike(c.email, like(termo)),
            digitos.length >= 3 ? or(ilike(c.documento, like(digitos)), ilike(c.whatsapp, like(digitos)), ilike(c.telefone, like(digitos))) : undefined,
          ),
        ),
      )
      .orderBy(c.nome)
      .limit(6);
    for (const r of rows)
      out.push({ grupo: "Clientes", id: r.id, titulo: r.fantasia ?? r.nome, detalhe: `Cliente nº ${r.codigo}${r.fantasia ? ` · ${r.nome}` : ""}`, href: `/clientes/${r.id}` });
  }

  if (so === "clientes") return out;

  if (pode(sessao.perfil, "equipamentos.ver")) {
    const q2 = schema.equipamentos;
    const rows = await db
      .select({ id: q2.id, marca: q2.marca, modelo: q2.modelo, btus: q2.btus, tipo: q2.tipo, ambiente: q2.ambiente, cliente: schema.clientes.nome, fantasia: schema.clientes.nomeFantasia })
      .from(q2)
      .innerJoin(schema.clientes, eq(schema.clientes.id, q2.clienteId))
      .where(
        and(
          eq(q2.empresaId, e),
          isNull(q2.excluidoEm),
          or(ilike(q2.marca, like(termo)), ilike(q2.modelo, like(termo)), ilike(q2.numeroSerie, like(termo)), ilike(sql`${q2.marca} || ' ' || coalesce(${q2.modelo}, '')`, like(termo))),
        ),
      )
      .limit(5);
    for (const r of rows)
      out.push({
        grupo: "Equipamentos",
        id: r.id,
        titulo: `${r.marca} ${r.btus.toLocaleString("pt-BR")} BTUs`,
        detalhe: `${TIPOS_EQUIPAMENTO[r.tipo]} · ${r.ambiente ?? "—"} · ${r.fantasia ?? r.cliente}`,
        href: `/equipamentos/${r.id}`,
      });
  }

  if (pode(sessao.perfil, "cadastros.ver")) {
    const p = schema.produtos;
    const rows = await db
      .select({ id: p.id, nome: p.nome, sku: p.sku, preco: p.preco })
      .from(p)
      .where(and(eq(p.empresaId, e), isNull(p.excluidoEm), or(ilike(p.nome, like(termo)), ilike(p.sku, like(termo)), eq(p.codigoBarras, termo))))
      .limit(5);
    for (const r of rows)
      out.push({ grupo: "Produtos", id: r.id, titulo: r.nome, detalhe: `${r.sku ?? "sem SKU"} · R$ ${r.preco.toFixed(2).replace(".", ",")}`, href: `/cadastros/produtos?q=${encodeURIComponent(r.sku ?? r.nome)}` });
  }

  if (pode(sessao.perfil, "os.ver") && /^\d{1,7}$/.test(termo)) {
    const o = schema.ordensServico;
    const rows = await db
      .select({ id: o.id, numero: o.numero, cliente: schema.clientes.nome, equipamentoId: o.equipamentoId })
      .from(o)
      .innerJoin(schema.clientes, eq(schema.clientes.id, o.clienteId))
      .where(and(eq(o.empresaId, e), eq(o.numero, Number(termo))))
      .orderBy(desc(o.abertaEm))
      .limit(1);
    for (const r of rows)
      out.push({ grupo: "Ordens de serviço", id: r.id, titulo: `OS nº ${r.numero}`, detalhe: r.cliente, href: r.equipamentoId ? `/equipamentos/${r.equipamentoId}#os-${r.numero}` : `/clientes` });
  }
  return out;
}

import { NextResponse } from "next/server";
import { lerSessao } from "@/server/auth/session";
import { listarClientes } from "@/server/queries/clientes";
import { pode } from "@/lib/permissions";
import { paraCsv } from "@/lib/csv";
import { dataCurta, documento, hojeISO, telefone } from "@/lib/format";

export async function GET(req: Request) {
  const sessao = await lerSessao();
  if (!sessao || !pode(sessao.perfil, "clientes.ver")) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  const sp = new URL(req.url).searchParams;
  const ids = sp.get("ids")?.split(",").filter(Boolean);
  const { linhas } = await listarClientes(sessao, { q: sp.get("q") ?? undefined, tipo: sp.get("tipo") ?? undefined, tag: sp.get("tag") ?? undefined, ordem: sp.get("ordem") ?? undefined, todos: true });
  const sel = ids?.length ? linhas.filter((l) => ids.includes(l.id)) : linhas;
  const csv = paraCsv(
    sel.map((l) => ({
      ...l,
      tipo: l.tipo === "pj" ? "PJ" : "PF",
      documento: documento(l.documento),
      whatsapp: telefone(l.whatsapp),
      telefone: telefone(l.telefone),
      ultimoServico: dataCurta(l.ultimoServico),
      totalGasto: l.totalGasto.toFixed(2).replace(".", ","),
    })),
    [
      { chave: "codigo", titulo: "Código" },
      { chave: "tipo", titulo: "Tipo" },
      { chave: "nome", titulo: "Nome / razão social" },
      { chave: "nomeFantasia", titulo: "Nome fantasia" },
      { chave: "documento", titulo: "CPF/CNPJ" },
      { chave: "whatsapp", titulo: "WhatsApp" },
      { chave: "telefone", titulo: "Telefone" },
      { chave: "email", titulo: "E-mail" },
      { chave: "bairro", titulo: "Bairro" },
      { chave: "cidade", titulo: "Cidade" },
      { chave: "qtdEquip", titulo: "Aparelhos" },
      { chave: "ultimoServico", titulo: "Último serviço" },
      { chave: "totalGasto", titulo: "Total em serviços (R$)" },
      { chave: "tags", titulo: "Etiquetas" },
    ],
  );
  return new NextResponse(csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="clientes-${hojeISO()}.csv"` },
  });
}

import { NextResponse } from "next/server";
import { lerSessao } from "@/server/auth/session";
import { buscaGlobal } from "@/server/queries/busca";

export async function GET(req: Request) {
  const sessao = await lerSessao();
  if (!sessao) return NextResponse.json({ erro: "Sessão expirada" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.slice(0, 80) ?? "";
  return NextResponse.json({ resultados: await buscaGlobal(sessao, q, sp.get("so") === "clientes" ? "clientes" : undefined) });
}

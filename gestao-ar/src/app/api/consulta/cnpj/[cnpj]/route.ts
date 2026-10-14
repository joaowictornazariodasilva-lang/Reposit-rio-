import { NextResponse } from "next/server";
import { lerSessao } from "@/server/auth/session";
import { consultarCnpj } from "@/server/consultas";

export async function GET(_: Request, { params }: { params: Promise<{ cnpj: string }> }) {
  if (!(await lerSessao())) return NextResponse.json({ erro: "Sessão expirada" }, { status: 401 });
  const r = await consultarCnpj((await params).cnpj);
  return r ? NextResponse.json(r) : NextResponse.json({ erro: "CNPJ não encontrado" }, { status: 404 });
}

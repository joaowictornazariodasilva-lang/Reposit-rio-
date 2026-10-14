import { NextResponse } from "next/server";
import { lerSessao } from "@/server/auth/session";
import { consultarCep } from "@/server/consultas";

export async function GET(_: Request, { params }: { params: Promise<{ cep: string }> }) {
  if (!(await lerSessao())) return NextResponse.json({ erro: "Sessão expirada" }, { status: 401 });
  const r = await consultarCep((await params).cep);
  return r ? NextResponse.json(r) : NextResponse.json({ erro: "CEP não encontrado" }, { status: 404 });
}

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { getDb, schema } from "@/server/db";
import { pode, type Permissao } from "@/lib/permissions";
import type { Perfil } from "@/server/db/schema";

export const COOKIE_SESSAO = "sessao";
const DURACAO_S = 60 * 60 * 12; // 12 h — um expediente

export type Sessao = {
  usuarioId: string;
  empresaId: string;
  nome: string;
  email: string;
  perfil: Perfil;
};

export function segredo(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production" && process.env.DEMO_SEED === "false") {
    throw new Error("SESSION_SECRET ausente ou curto (mín. 32 caracteres).");
  }
  // Demonstração/dev: segredo fixo para a sessão sobreviver a reinícios.
  return new TextEncoder().encode("dev-apenas-demonstracao-nao-use-em-producao-0000");
}

export async function criarSessao(usuarioId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_S}s`)
    .sign(segredo());
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_INSECURE !== "true",
    path: "/",
    maxAge: DURACAO_S,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE_SESSAO);
}

/** Lê a sessão e confere no banco se o usuário ainda existe e está ativo. */
export const lerSessao = cache(async (): Promise<Sessao | null> => {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, segredo(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    const db = await getDb();
    const u = await db.query.usuarios.findFirst({ where: eq(schema.usuarios.id, payload.sub) });
    if (!u || !u.ativo) return null;
    return { usuarioId: u.id, empresaId: u.empresaId, nome: u.nome, email: u.email, perfil: u.perfil };
  } catch {
    return null;
  }
});

/** Para páginas: sem sessão → login; sem permissão → início. */
export async function exigirSessao(permissao?: Permissao): Promise<Sessao> {
  const s = await lerSessao();
  if (!s) redirect("/login");
  if (permissao && !pode(s.perfil, permissao)) redirect("/?negado=1");
  return s;
}

export class AcessoNegado extends Error {
  constructor() {
    super("Você não tem permissão para esta ação.");
  }
}

/** Para ações/rotas: lança erro em vez de redirecionar. */
export async function exigirPermissao(permissao: Permissao): Promise<Sessao> {
  const s = await lerSessao();
  if (!s || !pode(s.perfil, permissao)) throw new AcessoNegado();
  return s;
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/server/db";
import { conferirSenha } from "./password";
import { criarSessao, encerrarSessao } from "./session";

const LIMITE = 5;
const JANELA_MS = 15 * 60 * 1000;

export type EstadoLogin = { erro?: string; email?: string } | undefined;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
  de: z.string().optional(),
});

export async function entrar(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const dados = loginSchema.safeParse(Object.fromEntries(form));
  if (!dados.success) return { erro: dados.error.issues[0]?.message, email: String(form.get("email") ?? "") };
  const { email, senha, de } = dados.data;

  const db = await getDb();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const chave = `${email}|${ip}`;
  const desde = new Date(Date.now() - JANELA_MS);
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.tentativasLogin)
    .where(and(eq(schema.tentativasLogin.chave, chave), gt(schema.tentativasLogin.criadoEm, desde)));
  if (n >= LIMITE) return { erro: "Muitas tentativas. Aguarde 15 minutos e tente de novo.", email };

  const u = await db.query.usuarios.findFirst({ where: eq(schema.usuarios.email, email) });
  // Sempre confere uma senha (mesmo sem usuário) para não revelar quais e-mails existem pelo tempo de resposta.
  const ok = await conferirSenha(senha, u?.senhaHash ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");
  if (!u || !ok || !u.ativo) {
    await db.insert(schema.tentativasLogin).values({ chave });
    return { erro: "E-mail ou senha incorretos.", email };
  }
  await db.delete(schema.tentativasLogin).where(eq(schema.tentativasLogin.chave, chave));
  await criarSessao(u.id);
  await db.insert(schema.auditoria).values({ empresaId: u.empresaId, usuarioId: u.id, entidade: "sessao", acao: "entrar", resumo: `Login de ${u.nome}` });
  redirect(de && de.startsWith("/") && !de.startsWith("//") ? de : "/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}

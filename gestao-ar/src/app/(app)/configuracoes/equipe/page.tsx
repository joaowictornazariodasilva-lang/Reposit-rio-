import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { exigirSessao } from "@/server/auth/session";
import { getDb, schema } from "@/server/db";
import { ListaEquipe } from "@/components/configuracoes/lista-equipe";

export const metadata: Metadata = { title: "Equipe" };

export default async function EquipePage() {
  const sessao = await exigirSessao("equipe.gerenciar");
  const db = await getDb();
  const u = schema.usuarios;
  const usuarios = await db
    .select({ id: u.id, nome: u.nome, email: u.email, perfil: u.perfil, telefone: u.telefone, cor: u.cor, comissaoPct: u.comissaoPct, ativo: u.ativo })
    .from(u)
    .where(eq(u.empresaId, sessao.empresaId))
    .orderBy(asc(u.nome));
  return <ListaEquipe usuarios={usuarios} eu={sessao.usuarioId} />;
}

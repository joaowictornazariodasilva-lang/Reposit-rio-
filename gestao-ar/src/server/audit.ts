import "server-only";
import type { Db } from "@/server/db";
import { schema } from "@/server/db";
import type { Sessao } from "@/server/auth/session";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export async function registrar(
  db: Db | Tx,
  sessao: Sessao,
  entidade: string,
  entidadeId: string | null,
  acao: "criar" | "editar" | "excluir" | "restaurar" | "importar",
  resumo: string,
  dados?: unknown,
) {
  await db.insert(schema.auditoria).values({ empresaId: sessao.empresaId, usuarioId: sessao.usuarioId, entidade, entidadeId, acao, resumo, dados: dados ?? null });
}

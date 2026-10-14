import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { History } from "lucide-react";
import { exigirSessao } from "@/server/auth/session";
import { getDb, schema } from "@/server/db";
import { dataHora } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge, type Tom } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Registro de alterações" };

const TOM: Record<string, Tom> = { criar: "sucesso", editar: "info", excluir: "perigo", restaurar: "alerta", importar: "primario", entrar: "neutro" };

export default async function AuditoriaPage() {
  const sessao = await exigirSessao("auditoria.ver");
  const db = await getDb();
  const a = schema.auditoria;
  const linhas = await db
    .select({ id: a.id, acao: a.acao, entidade: a.entidade, resumo: a.resumo, criadoEm: a.criadoEm, usuario: schema.usuarios.nome })
    .from(a)
    .leftJoin(schema.usuarios, eq(schema.usuarios.id, a.usuarioId))
    .where(eq(a.empresaId, sessao.empresaId))
    .orderBy(desc(a.criadoEm))
    .limit(200);
  return (
    <Card className="overflow-hidden">
      {linhas.length === 0 ? (
        <EmptyState icone={<History />} titulo="Nada registrado ainda" descricao="Toda criação, alteração e exclusão aparece aqui com quem fez e quando." />
      ) : (
        <ul className="divide-y divide-border">
          {linhas.map((l) => (
            <li key={l.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <span className="tabular w-36 shrink-0 text-xs text-fg-subtle">{dataHora(l.criadoEm)}</span>
              <Badge tom={TOM[l.acao] ?? "neutro"} className="w-fit">{l.acao}</Badge>
              <span className="flex-1 text-sm">{l.resumo ?? `${l.acao} ${l.entidade}`}</span>
              <span className="text-xs text-fg-muted">{l.usuario ?? "Sistema"}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

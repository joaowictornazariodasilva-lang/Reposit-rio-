import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { exigirSessao } from "@/server/auth/session";
import { getDb, schema } from "@/server/db";
import { FormEmpresa } from "@/components/configuracoes/form-empresa";

export const metadata: Metadata = { title: "Empresa" };

export default async function EmpresaPage() {
  const sessao = await exigirSessao("empresa.configurar");
  const db = await getDb();
  const e = await db.query.empresas.findFirst({ where: eq(schema.empresas.id, sessao.empresaId) });
  if (!e) return null;
  return <FormEmpresa empresa={e} />;
}

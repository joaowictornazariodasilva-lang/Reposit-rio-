import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { exigirSessao } from "@/server/auth/session";
import { getDb, schema } from "@/server/db";
import { NAV } from "@/lib/navegacao";
import { pode } from "@/lib/permissions";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await exigirSessao();
  const db = await getDb();
  const empresa = await db.query.empresas.findFirst({ where: eq(schema.empresas.id, sessao.empresaId), columns: { nome: true, logo: true } });
  const grupos = NAV.map((g) => ({ ...g, itens: g.itens.filter((i) => pode(sessao.perfil, i.permissao)) })).filter((g) => g.itens.length);
  const recolhido = (await cookies()).get("menu")?.value === "recolhido";
  return (
    <AppShell sessao={sessao} empresa={empresa ?? { nome: "Minha empresa", logo: null }} grupos={grupos} recolhidoInicial={recolhido}>
      {children}
    </AppShell>
  );
}

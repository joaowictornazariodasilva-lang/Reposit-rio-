import { exigirSessao } from "@/server/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { TabsNav } from "@/components/ui/tabs-nav";

export default async function ConfigLayout({ children }: { children: React.ReactNode }) {
  await exigirSessao("empresa.configurar");
  return (
    <>
      <PageHeader titulo="Configurações">
        <TabsNav
          className="mt-5"
          abas={[
            { href: "/configuracoes", rotulo: "Empresa", exato: true },
            { href: "/configuracoes/equipe", rotulo: "Equipe e permissões" },
            { href: "/configuracoes/auditoria", rotulo: "Registro de alterações" },
          ]}
        />
      </PageHeader>
      {children}
    </>
  );
}

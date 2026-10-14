import { exigirSessao } from "@/server/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { TabsNav } from "@/components/ui/tabs-nav";

export default async function CadastrosLayout({ children }: { children: React.ReactNode }) {
  await exigirSessao("cadastros.ver");
  return (
    <>
      <PageHeader titulo="Cadastros" descricao="Serviços, peças e kits que alimentam OS e orçamentos.">
        <TabsNav
          className="mt-5"
          abas={[
            { href: "/cadastros/servicos", rotulo: "Tipos de serviço" },
            { href: "/cadastros/produtos", rotulo: "Produtos e peças" },
            { href: "/cadastros/kits", rotulo: "Kits" },
            { href: "/cadastros/fornecedores", rotulo: "Fornecedores" },
          ]}
        />
      </PageHeader>
      {children}
    </>
  );
}

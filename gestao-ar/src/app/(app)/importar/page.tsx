import type { Metadata } from "next";
import { exigirSessao } from "@/server/auth/session";
import { pode } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { Importador } from "@/components/importacao/importador";

export const metadata: Metadata = { title: "Importar planilha" };

export default async function ImportarPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const sessao = await exigirSessao("importar");
  const { tipo } = await searchParams;
  const podeProdutos = pode(sessao.perfil, "cadastros.editar");
  return (
    <>
      <PageHeader titulo="Importar planilha" descricao="Traga seus clientes e produtos do Excel ou CSV. Você confere tudo antes de gravar." />
      <Importador inicial={tipo === "produtos" && podeProdutos ? "produtos" : "clientes"} podeProdutos={podeProdutos} />
    </>
  );
}

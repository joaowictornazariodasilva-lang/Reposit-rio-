import type { Metadata } from "next";
import { exigirSessao } from "@/server/auth/session";
import { listarCategorias, listarFornecedores, listarProdutos } from "@/server/queries/cadastros";
import { pode } from "@/lib/permissions";
import { ListaProdutos } from "@/components/cadastros/lista-produtos";

export const metadata: Metadata = { title: "Produtos e peças" };

export default async function ProdutosPage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string; filtro?: string; novo?: string }> }) {
  const sessao = await exigirSessao("cadastros.ver");
  const sp = await searchParams;
  const [produtos, categorias, fornecedores] = await Promise.all([listarProdutos(sessao, sp), listarCategorias(sessao), listarFornecedores(sessao)]);
  return (
    <ListaProdutos
      produtos={produtos}
      categorias={categorias}
      fornecedores={fornecedores.map((f) => ({ id: f.id, nome: f.nome }))}
      podeEditar={pode(sessao.perfil, "cadastros.editar")}
      verCusto={pode(sessao.perfil, "custos.ver")}
      filtrando={!!(sp.q || sp.categoria || sp.filtro)}
      abrirNovo={sp.novo === "produto"}
    />
  );
}

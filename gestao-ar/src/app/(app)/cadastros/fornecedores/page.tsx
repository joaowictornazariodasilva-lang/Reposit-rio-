import type { Metadata } from "next";
import { exigirSessao } from "@/server/auth/session";
import { listarFornecedores } from "@/server/queries/cadastros";
import { pode } from "@/lib/permissions";
import { ListaFornecedores } from "@/components/cadastros/lista-fornecedores";

export const metadata: Metadata = { title: "Fornecedores" };

export default async function FornecedoresPage() {
  const sessao = await exigirSessao("cadastros.ver");
  return <ListaFornecedores fornecedores={await listarFornecedores(sessao)} podeEditar={pode(sessao.perfil, "cadastros.editar")} />;
}

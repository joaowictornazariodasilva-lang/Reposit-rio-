import type { Metadata } from "next";
import { exigirSessao } from "@/server/auth/session";
import { listarServicos } from "@/server/queries/cadastros";
import { pode } from "@/lib/permissions";
import { ListaServicos } from "@/components/cadastros/lista-servicos";

export const metadata: Metadata = { title: "Tipos de serviço" };

export default async function ServicosPage() {
  const sessao = await exigirSessao("cadastros.ver");
  const servicos = await listarServicos(sessao);
  return <ListaServicos servicos={servicos} podeEditar={pode(sessao.perfil, "cadastros.editar")} />;
}

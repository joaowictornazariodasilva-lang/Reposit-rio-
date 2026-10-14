import type { Metadata } from "next";
import { exigirSessao } from "@/server/auth/session";
import { listarKits, listarProdutos, listarServicos } from "@/server/queries/cadastros";
import { pode } from "@/lib/permissions";
import { ListaKits } from "@/components/cadastros/lista-kits";

export const metadata: Metadata = { title: "Kits" };

export default async function KitsPage() {
  const sessao = await exigirSessao("cadastros.ver");
  const [kits, servicos, produtos] = await Promise.all([listarKits(sessao), listarServicos(sessao), listarProdutos(sessao)]);
  return (
    <ListaKits
      kits={kits}
      servicos={servicos.filter((s) => s.ativo).map((s) => ({ id: s.id, nome: s.nome, preco: s.precoPadrao }))}
      produtos={produtos.map((p) => ({ id: p.id, nome: p.nome, preco: p.preco }))}
      podeEditar={pode(sessao.perfil, "cadastros.editar")}
      verCusto={pode(sessao.perfil, "custos.ver")}
    />
  );
}

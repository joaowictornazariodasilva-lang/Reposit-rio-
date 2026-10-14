import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileSpreadsheet, UserPlus, Users } from "lucide-react";
import { exigirSessao } from "@/server/auth/session";
import { listarClientes, POR_PAGINA, tagsDaEmpresa } from "@/server/queries/clientes";
import { pode } from "@/lib/permissions";
import { numero } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BarraBusca, FiltroPilulas } from "@/components/lista/barra-busca";
import { hrefComParams, Paginacao } from "@/components/lista/paginacao";
import { TabelaClientes } from "@/components/clientes/tabela-clientes";
import { SeletorUrl } from "@/components/lista/seletor-url";

export const metadata: Metadata = { title: "Clientes" };

type SP = { q?: string; tipo?: string; tag?: string; ordem?: string; pagina?: string };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sessao = await exigirSessao("clientes.ver");
  const sp = await searchParams;
  const [{ linhas, total, pagina, paginas }, tags] = await Promise.all([
    listarClientes(sessao, { ...sp, pagina: Number(sp.pagina) || 1 }),
    tagsDaEmpresa(sessao),
  ]);
  const filtrando = !!(sp.q || sp.tipo || sp.tag);
  const podeEditar = pode(sessao.perfil, "clientes.editar");
  const exportar = hrefComParams("/api/exportar/clientes", { q: sp.q, tipo: sp.tipo, tag: sp.tag, ordem: sp.ordem }, {});

  return (
    <>
      <PageHeader
        titulo="Clientes"
        descricao={`${numero(total)} ${total === 1 ? "cliente" : "clientes"}${filtrando ? " no filtro" : " cadastrados"}`}
        acoes={
          <>
            <a href={exportar} className={buttonVariants({ variant: "secondary" })} download aria-label="Exportar clientes (CSV)">
              <Download /> <span className="hidden sm:inline">Exportar</span>
            </a>
            {pode(sessao.perfil, "importar") ? (
              <Link href="/importar?tipo=clientes" className={buttonVariants({ variant: "secondary" })} aria-label="Importar planilha de clientes">
                <FileSpreadsheet /> <span className="hidden sm:inline">Importar</span>
              </Link>
            ) : null}
            {podeEditar ? (
              <Button asChild>
                <Link href="?novo=cliente" scroll={false}>
                  <UserPlus /> Novo cliente
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mb-4 grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <BarraBusca placeholder="Buscar por nome, telefone, CPF/CNPJ, bairro…" className="flex-1" />
          <SeletorUrl
            param="ordem"
            rotulo="Ordenar"
            opcoes={[
              { valor: "", rotulo: "Nome (A–Z)" },
              { valor: "recentes", rotulo: "Cadastrados por último" },
              { valor: "ultimo", rotulo: "Atendidos recentemente" },
              { valor: "valor", rotulo: "Maior valor em serviços" },
            ]}
            className="sm:w-56"
          />
        </div>
        <FiltroPilulas
          param="tipo"
          opcoes={[
            { valor: "", rotulo: "Todos" },
            { valor: "pf", rotulo: "Pessoa física" },
            { valor: "pj", rotulo: "Empresas" },
          ]}
        />
        {tags.length ? (
          <FiltroPilulas param="tag" opcoes={[{ valor: "", rotulo: "Todas as etiquetas" }, ...tags.map((t) => ({ valor: t, rotulo: t }))]} />
        ) : null}
      </div>

      <Card className="overflow-hidden">
        {linhas.length ? (
          <>
            <TabelaClientes linhas={linhas} podeExcluir={pode(sessao.perfil, "clientes.excluir")} podeEditar={podeEditar} />
            <Paginacao pagina={pagina} paginas={paginas} total={total} porPagina={POR_PAGINA} href={(p) => hrefComParams("/clientes", sp as Record<string, string>, { pagina: p })} />
          </>
        ) : filtrando ? (
          <EmptyState
            icone={<Users />}
            titulo="Nenhum cliente neste filtro"
            descricao="Tente outro termo — a busca aceita nome, telefone, CPF/CNPJ, e-mail ou bairro."
            acoes={
              <Link href="/clientes" className={buttonVariants({ variant: "secondary" })}>
                Limpar filtros
              </Link>
            }
          />
        ) : (
          <EmptyState
            icone={<Users />}
            titulo="Cadastre seu primeiro cliente"
            descricao="Com o cliente cadastrado você registra os aparelhos dele, abre OS e recebe lembretes de limpeza. Já tem uma planilha? Importe em minutos."
            acoes={
              <>
                {podeEditar ? (
                  <Button asChild>
                    <Link href="?novo=cliente" scroll={false}>
                      <UserPlus /> Novo cliente
                    </Link>
                  </Button>
                ) : null}
                <Link href="/importar?tipo=clientes" className={buttonVariants({ variant: "secondary" })}>
                  <FileSpreadsheet /> Importar planilha
                </Link>
              </>
            }
          />
        )}
      </Card>
    </>
  );
}


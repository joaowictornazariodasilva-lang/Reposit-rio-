import type { Metadata } from "next";
import Link from "next/link";
import { AirVent, Plus } from "lucide-react";
import { eq } from "drizzle-orm";
import { exigirSessao } from "@/server/auth/session";
import { listarEquipamentosDe } from "@/server/queries/clientes";
import { getDb, schema } from "@/server/db";
import { pode } from "@/lib/permissions";
import { TIPOS_EQUIPAMENTO } from "@/lib/dominio";
import { btus, dataCurta, hojeISO, numero } from "@/lib/format";
import { mensagemLimpeza } from "@/lib/mensagens";
import { PageHeader } from "@/components/ui/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BarraBusca, FiltroPilulas } from "@/components/lista/barra-busca";
import { SeletorUrl } from "@/components/lista/seletor-url";
import { hrefComParams, Paginacao } from "@/components/lista/paginacao";
import { SeloGarantia, SeloLimpeza } from "@/components/equipamentos/selos";
import { BotaoWhatsApp } from "@/components/whatsapp";

export const metadata: Metadata = { title: "Equipamentos" };
const POR_PAGINA = 25;

type SP = { q?: string; tipo?: string; situacao?: string; pagina?: string };

export default async function EquipamentosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sessao = await exigirSessao("equipamentos.ver");
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const db = await getDb();
  const [linhas, empresa, [vencidas], [garantia]] = await Promise.all([
    listarEquipamentosDe(sessao, { q: sp.q, tipo: sp.tipo, situacao: sp.situacao, limite: POR_PAGINA, offset: (pagina - 1) * POR_PAGINA }),
    db.query.empresas.findFirst({ where: eq(schema.empresas.id, sessao.empresaId), columns: { nome: true } }),
    listarEquipamentosDe(sessao, { situacao: "limpeza", limite: 1 }),
    listarEquipamentosDe(sessao, { situacao: "garantia", limite: 1 }),
  ]);
  const total = linhas[0]?.total ?? 0;
  const hoje = hojeISO();
  const filtrando = !!(sp.q || sp.tipo || sp.situacao);

  return (
    <>
      <PageHeader
        titulo="Equipamentos"
        descricao={`${numero(total)} ${total === 1 ? "aparelho" : "aparelhos"}${filtrando ? " no filtro" : " sob nossos cuidados"}`}
        acoes={
          pode(sessao.perfil, "equipamentos.editar") ? (
            <Button asChild>
              <Link href="?novo=equipamento" scroll={false}>
                <Plus /> Novo equipamento
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="mb-4 grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <BarraBusca placeholder="Buscar por marca, modelo, nº de série, ambiente ou cliente…" className="flex-1" />
          <SeletorUrl param="tipo" rotulo="Tipo de aparelho" opcoes={[{ valor: "", rotulo: "Todos os tipos" }, ...Object.entries(TIPOS_EQUIPAMENTO).map(([valor, rotulo]) => ({ valor, rotulo }))]} className="sm:w-52" />
        </div>
        <FiltroPilulas
          param="situacao"
          opcoes={[
            { valor: "", rotulo: "Todos" },
            { valor: "limpeza", rotulo: "Limpeza vencida", contador: vencidas?.total ?? 0 },
            { valor: "garantia", rotulo: "Garantia vence em 30 dias", contador: garantia?.total ?? 0 },
            { valor: "em_garantia", rotulo: "Em garantia" },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        {linhas.length === 0 ? (
          filtrando ? (
            <EmptyState
              icone={<AirVent />}
              titulo={sp.situacao === "limpeza" ? "Nenhuma limpeza atrasada" : "Nenhum aparelho neste filtro"}
              descricao={sp.situacao === "limpeza" ? "Todos os aparelhos estão com a limpeza em dia. Ótimo trabalho." : "Tente outro termo ou limpe os filtros."}
              acoes={<Link href="/equipamentos" className={buttonVariants({ variant: "secondary" })}>Limpar filtros</Link>}
            />
          ) : (
            <EmptyState
              icone={<AirVent />}
              titulo="Cadastre o primeiro aparelho"
              descricao="Cada aparelho ganha uma ficha com marca, BTUs, gás, garantia e todo o histórico de serviços — e o sistema avisa quando a limpeza vencer."
              acoes={
                <Button asChild>
                  <Link href="?novo=equipamento" scroll={false}>
                    <Plus /> Novo equipamento
                  </Link>
                </Button>
              }
            />
          )
        ) : (
          <>
            <ul className="divide-y divide-border">
              {linhas.map((e) => (
                <li key={e.id} className="group flex flex-col gap-3 px-4 py-3.5 hover:bg-surface-2 sm:flex-row sm:items-center sm:px-5">
                  <Link href={`/equipamentos/${e.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-soft-fg">
                      <AirVent className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium group-hover:text-primary">
                        {e.marca} · {btus(e.btus)} <span className="font-normal text-fg-subtle">{TIPOS_EQUIPAMENTO[e.tipo]}{e.inverter ? " inverter" : ""}</span>
                      </span>
                      <span className="block truncate text-xs text-fg-subtle">
                        {e.cliente} · {e.ambiente ?? "ambiente não informado"}
                        {e.bairro ? ` · ${e.bairro}` : ""}
                      </span>
                    </span>
                  </Link>
                  <div className="flex flex-wrap items-center gap-1.5 pl-[52px] sm:w-[340px] sm:justify-end sm:pl-0">
                    <span className="mr-1 hidden text-xs text-fg-subtle lg:inline">Última limpeza {e.ultimaLimpeza ? dataCurta(e.ultimaLimpeza) : "—"}</span>
                    <SeloLimpeza proxima={e.proximaLimpeza} hoje={hoje} />
                    <SeloGarantia ate={e.garantiaAte} hoje={hoje} />
                  </div>
                  <div className="hidden sm:block">
                    <BotaoWhatsApp fone={e.clienteWhatsapp} texto={mensagemLimpeza(e, e.cliente, empresa?.nome ?? "", hoje)} somenteIcone rotulo={`Convidar ${e.cliente} para limpeza`} />
                  </div>
                </li>
              ))}
            </ul>
            <Paginacao pagina={pagina} paginas={Math.max(1, Math.ceil(total / POR_PAGINA))} total={total} porPagina={POR_PAGINA} href={(p) => hrefComParams("/equipamentos", sp as Record<string, string>, { pagina: p })} />
          </>
        )}
      </Card>
    </>
  );
}

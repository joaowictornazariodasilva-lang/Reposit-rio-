import type { Metadata } from "next";
import Link from "next/link";
import { AirVent, ArrowRight, CalendarDays, ClipboardCheck, PackageSearch, ShieldAlert, ThermometerSun, TrendingDown, TrendingUp, Users } from "lucide-react";
import { exigirSessao } from "@/server/auth/session";
import { dadosInicio } from "@/server/queries/inicio";
import { pode } from "@/lib/permissions";
import { STATUS_OS, situacaoGarantia, situacaoLimpeza } from "@/lib/dominio";
import { btus, dataExtenso, FUSO, hojeISO, moeda, numero, saudacao } from "@/lib/format";
import { mensagemLimpeza } from "@/lib/mensagens";
import { primeiroNome } from "@/lib/br";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BotaoWhatsApp } from "@/components/whatsapp";
import { Onboarding } from "@/components/inicio/onboarding";
import { MiniColunas } from "@/components/inicio/sparkline";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Início" };

const hora = (d: Date | null) => (d ? new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" }).format(d) : "--:--");

function rotulosMeses(n: number) {
  const agora = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - (n - 1 - i), 1);
    return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(d);
  });
}

export default async function Inicio({ searchParams }: { searchParams: Promise<{ negado?: string }> }) {
  const sessao = await exigirSessao("inicio.ver");
  const { negado } = await searchParams;
  const d = await dadosInicio(sessao);
  const hoje = hojeISO();
  const verDinheiro = pode(sessao.perfil, "financeiro.ver");
  const tecnico = sessao.perfil === "tecnico";
  const nomeEmpresa = d.empresa?.nome ?? "";
  const variacao = d.kpis.faturamentoMesAnt ? ((d.kpis.faturamentoMes - d.kpis.faturamentoMesAnt) / d.kpis.faturamentoMesAnt) * 100 : null;
  const mostrarOnboarding = sessao.perfil === "admin" && !d.onboarding.oculto && !Object.entries(d.onboarding).filter(([k]) => k !== "oculto").every(([, v]) => v);

  const pend = [
    { chave: "aguardando_aprovacao", rotulo: "Orçamentos aguardando aprovação", icone: ClipboardCheck },
    { chave: "aguardando_peca", rotulo: "OS aguardando peça", icone: PackageSearch },
    { chave: "concluida", rotulo: "OS concluídas para cobrar", icone: ClipboardCheck },
  ].filter((p) => (d.pendencias[p.chave] ?? 0) > 0 && (!tecnico || p.chave !== "concluida"));

  return (
    <>
      {negado ? <p className="mb-4 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning" role="status">Seu perfil não tem acesso àquela tela. Fale com o administrador se precisar.</p> : null}

      <div className="mb-6">
        <p className="text-sm text-fg-subtle">{dataExtenso()}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">
          {saudacao()}, {primeiroNome(sessao.nome)}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {d.hoje.length ? `${d.hoje.length} atendimento${d.hoje.length > 1 ? "s" : ""} ${tecnico ? "seus " : ""}hoje` : "Nenhum atendimento agendado para hoje"}
          {!tecnico && d.totalVencidas ? ` · ${d.totalVencidas} aparelhos precisando de limpeza` : ""}
        </p>
      </div>

      {mostrarOnboarding ? <Onboarding passos={d.onboarding} /> : null}

      {/* Indicadores */}
      {!tecnico ? (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {verDinheiro ? (
            <Card className="col-span-2 p-4 sm:p-5 lg:col-span-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-fg-subtle">Faturamento no mês</p>
                  <p className="tabular mt-1 text-2xl font-semibold tracking-tight">{moeda(d.kpis.faturamentoMes)}</p>
                </div>
                <MiniColunas valores={d.kpis.serie} rotulos={rotulosMeses(d.kpis.serie.length)} />
              </div>
                {variacao !== null ? (
                  <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", variacao >= 0 ? "text-success" : "text-danger")}>
                    {variacao >= 0 ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
                    {variacao >= 0 ? "+" : ""}
                    {variacao.toFixed(0)}% vs mês passado
                    <span className="sr-only">(mesmo período)</span>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-fg-subtle">{d.kpis.servicosMes} serviços concluídos</p>
                )}
            </Card>
          ) : null}
          <Kpi rotulo="Clientes" valor={numero(d.kpis.clientes)} detalhe={`${numero(d.kpis.aparelhos)} aparelhos`} href="/clientes" icone={<Users />} />
          <Kpi rotulo="Limpezas vencidas" valor={numero(d.totalVencidas)} detalhe="oportunidades de retorno" href="/equipamentos?situacao=limpeza" icone={<ThermometerSun />} quente={d.totalVencidas > 0} />
          <Kpi rotulo="Garantias vencendo" valor={numero(d.totalGarantias)} detalhe="nos próximos 30 dias" href="/equipamentos?situacao=garantia" icone={<ShieldAlert />} />
          {!verDinheiro ? <Kpi rotulo="Serviços no mês" valor={numero(d.kpis.servicosMes)} detalhe={`${d.kpis.retornosMes} retorno(s) em garantia`} icone={<ClipboardCheck />} /> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card aria-labelledby="t-hoje">
          <CardHeader id="t-hoje" titulo={tecnico ? "Meus serviços de hoje" : "Agenda de hoje"} descricao="Em ordem de horário" icone={<CalendarDays />} />
          <CardBody className="pt-3">
            {d.hoje.length ? (
              <ol className="grid grid-cols-1 gap-2">
                {d.hoje.map((o) => {
                  const st = STATUS_OS[o.status];
                  return (
                    <li key={o.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <span className="tabular w-12 shrink-0 text-sm font-semibold">{hora(o.agendadaPara)}</span>
                      <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: o.tecnicoCor ?? "var(--border-strong)" }} aria-hidden />
                      <Link href={o.equipamentoId ? `/equipamentos/${o.equipamentoId}` : `/clientes/${o.clienteId}`} className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium hover:text-primary">{o.cliente}</span>
                        <span className="block truncate text-xs text-fg-subtle">
                          {o.servico}
                          {o.bairro ? ` · ${o.bairro}` : ""}
                          {!tecnico && o.tecnico ? ` · ${primeiroNome(o.tecnico)}` : ""}
                        </span>
                      </Link>
                      <Badge tom={st.tom} className="hidden sm:inline-flex">{st.rotulo}</Badge>
                      <BotaoWhatsApp fone={o.whatsapp} texto={`Olá! Aqui é da ${nomeEmpresa}. Confirmando seu atendimento hoje às ${hora(o.agendadaPara)}.`} somenteIcone rotulo={`Confirmar com ${o.cliente}`} />
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState className="py-8" icone={<CalendarDays />} titulo="Dia livre na agenda" descricao="Aproveite para chamar quem está com a limpeza vencida — a lista ao lado já tem a mensagem pronta." />
            )}
            {pend.length ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-fg-subtle">Precisa da sua ação</p>
                <ul className="grid gap-2 sm:grid-cols-3">
                  {pend.map((p) => (
                    <li key={p.chave} className="flex items-center gap-2.5 rounded-lg bg-warning-soft px-3 py-2.5 text-warning">
                      <p.icone className="size-4 shrink-0" aria-hidden />
                      <span className="text-xs">
                        <strong className="tabular block text-base font-semibold">{d.pendencias[p.chave]}</strong>
                        {p.rotulo}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardBody>
        </Card>

        {!tecnico ? (
          <div className="grid min-w-0 grid-cols-1 content-start gap-5">
            <Card aria-labelledby="t-oport">
              <CardHeader
                id="t-oport"
                titulo="Oportunidades de retorno"
                descricao="Limpeza vencida — convite pronto no WhatsApp"
                icone={<ThermometerSun />}
                acao={d.totalVencidas > d.vencidas.length ? <Link href="/equipamentos?situacao=limpeza" className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver {d.totalVencidas} <ArrowRight /></Link> : null}
              />
              <CardBody className="pt-3">
                {d.vencidas.length ? (
                  <ul className="grid grid-cols-1 gap-1">
                    {d.vencidas.map((e) => {
                      const s = situacaoLimpeza(e.proximaLimpeza, hoje);
                      return (
                        <li key={e.id} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-2">
                          <Link href={`/equipamentos/${e.id}`} className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{e.cliente}</span>
                            <span className="block truncate text-xs text-fg-subtle">
                              {e.marca} {btus(e.btus)} · {e.ambiente ?? "—"} · <span className="text-accent">{s.rotulo.replace("Limpeza atrasada", "atrasada")}</span>
                            </span>
                          </Link>
                          <BotaoWhatsApp fone={e.clienteWhatsapp} texto={mensagemLimpeza(e, e.cliente, nomeEmpresa, hoje)} somenteIcone rotulo={`Convidar ${e.cliente} para limpeza`} />
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="py-4 text-center text-sm text-fg-muted">Todos os aparelhos estão com a limpeza em dia.</p>
                )}
              </CardBody>
            </Card>

            {d.garantias.length ? (
              <Card aria-labelledby="t-gar">
                <CardHeader id="t-gar" titulo="Garantias vencendo" descricao="Ofereça revisão antes do fim da garantia" icone={<ShieldAlert />} />
                <CardBody className="pt-3">
                  <ul className="grid grid-cols-1 gap-1">
                    {d.garantias.map((e) => (
                      <li key={e.id}>
                        <Link href={`/equipamentos/${e.id}`} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-2">
                          <AirVent className="size-4 shrink-0 text-fg-subtle" aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{e.cliente}</span>
                            <span className="block truncate text-xs text-fg-subtle">{e.marca} {btus(e.btus)} · {situacaoGarantia(e.garantiaAte, hoje)?.rotulo}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

function Kpi({ rotulo, valor, detalhe, href, icone, quente }: { rotulo: string; valor: string; detalhe: string; href?: string; icone: React.ReactNode; quente?: boolean }) {
  const corpo = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs text-fg-subtle">{rotulo}</p>
        <span className={cn("text-fg-subtle [&_svg]:size-4", quente && "text-accent")}>{icone}</span>
      </div>
      <p className={cn("tabular mt-1 text-2xl font-semibold tracking-tight", quente && "text-accent")}>{valor}</p>
      <p className="mt-1 text-xs text-fg-subtle">{detalhe}</p>
    </>
  );
  return href ? (
    <Link href={href} className="rounded-lg border border-border bg-surface p-4 shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-border-strong hover:shadow-sm sm:p-5">
      {corpo}
    </Link>
  ) : (
    <Card className="p-4 sm:p-5">{corpo}</Card>
  );
}

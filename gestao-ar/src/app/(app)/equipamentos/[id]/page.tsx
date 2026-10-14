import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AirVent, ArrowLeft, Camera, ClipboardList, MapPin, Navigation, RotateCcw } from "lucide-react";
import { eq } from "drizzle-orm";
import { exigirSessao } from "@/server/auth/session";
import { obterEquipamento } from "@/server/queries/clientes";
import { getDb, schema } from "@/server/db";
import { pode } from "@/lib/permissions";
import { TIPOS_EQUIPAMENTO, situacaoLimpeza } from "@/lib/dominio";
import { btus, dataCurta, hojeISO, moeda, relativo } from "@/lib/format";
import { mensagemLimpeza } from "@/lib/mensagens";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { BotaoWhatsApp } from "@/components/whatsapp";
import { SeloGarantia, SeloLimpeza } from "@/components/equipamentos/selos";
import { LinhaDoTempo } from "@/components/equipamentos/linha-do-tempo";
import { Termostato } from "@/components/equipamentos/termostato";
import { AcoesEquipamento } from "@/components/equipamentos/acoes-equipamento";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const sessao = await exigirSessao("equipamentos.ver");
  const { id } = await params;
  const d = /^[0-9a-f-]{36}$/.test(id) ? await obterEquipamento(sessao, id) : null;
  return { title: d ? `${d.equipamento.marca} ${btus(d.equipamento.btus)}` : "Equipamento" };
}

export default async function EquipamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao("equipamentos.ver");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const dados = await obterEquipamento(sessao, id);
  if (!dados) notFound();
  const { equipamento: e, historico, local } = dados;
  const db = await getDb();
  const empresa = await db.query.empresas.findFirst({ where: eq(schema.empresas.id, sessao.empresaId), columns: { nome: true } });
  const hoje = hojeISO();
  const sit = situacaoLimpeza(e.proximaLimpeza, hoje);
  const feitas = historico.filter((o) => o.status === "concluida" || o.status === "faturada");
  const retornos = historico.filter((o) => o.ehRetorno).length;
  const verValor = sessao.perfil !== "tecnico";
  const destino = local ? encodeURIComponent([local.logradouro, local.numero, local.bairro, local.cidade, local.uf].filter(Boolean).join(", ")) : null;

  const ficha: [string, React.ReactNode][] = [
    ["Tipo", `${TIPOS_EQUIPAMENTO[e.tipo]}${e.inverter ? " · inverter" : ""}`],
    ["Capacidade", btus(e.btus)],
    ["Modelo", e.modelo ?? "—"],
    ["Nº de série", e.numeroSerie ? <span className="font-mono text-xs">{e.numeroSerie}</span> : "—"],
    ["Gás", e.gas ?? "—"],
    ["Tensão", e.tensao ?? "—"],
    ["Instalação", e.dataInstalacao ? `${dataCurta(e.dataInstalacao)}${e.instaladoPorNos ? " · pela nossa equipe" : ""}` : "—"],
    ["Garantia até", e.garantiaAte ? dataCurta(e.garantiaAte) : "—"],
  ];

  return (
    <>
      <Link href={`/clientes/${e.clienteId}`} className="mb-3 inline-flex h-9 items-center gap-1.5 rounded text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> {e.cliente}
      </Link>

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-soft-fg">
          <AirVent className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {e.marca} · {btus(e.btus)}
          </h1>
          <p className="mt-0.5 text-sm text-fg-muted">
            {e.ambiente ?? "Ambiente não informado"} · <Link href={`/clientes/${e.clienteId}`} className="hover:text-primary hover:underline">{e.cliente}</Link>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <SeloLimpeza proxima={e.proximaLimpeza} hoje={hoje} />
            <SeloGarantia ate={e.garantiaAte} hoje={hoje} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotaoWhatsApp fone={e.clienteWhatsapp} texto={mensagemLimpeza(e, e.cliente, empresa?.nome ?? "", hoje)} variante={sit.estado === "vencida" ? "soft" : "secondary"} rotulo="Convidar para limpeza pelo WhatsApp" />
          {pode(sessao.perfil, "equipamentos.editar") ? <AcoesEquipamento equipamento={e} /> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-5">
          <Card aria-labelledby="t-ficha">
            <CardHeader id="t-ficha" titulo="Ficha do equipamento" icone={<AirVent />} />
            <CardBody>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {ficha.map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-2xs text-fg-subtle">{k}</dt>
                    <dd className="mt-0.5 truncate text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              {e.observacoes ? <p className="mt-5 rounded-md bg-surface-2 px-3 py-2 text-sm text-fg-muted">{e.observacoes}</p> : null}
            </CardBody>
          </Card>

          <Card aria-labelledby="t-hist">
            <CardHeader id="t-hist" titulo="Histórico de serviços" descricao={`${historico.length} atendimento(s) neste aparelho`} icone={<ClipboardList />} />
            <CardBody>
              {historico.length ? (
                <LinhaDoTempo itens={historico} mostrarValor={verValor} />
              ) : (
                <p className="py-6 text-center text-sm text-fg-muted">Nenhum serviço registrado ainda. As OS deste aparelho aparecem aqui automaticamente.</p>
              )}
            </CardBody>
          </Card>

          <Card aria-labelledby="t-fotos">
            <CardHeader id="t-fotos" titulo="Fotos" descricao="Antes/depois e placa de identificação" icone={<Camera />} />
            <CardBody>
              <p className="rounded-md border border-dashed border-border-strong px-4 py-6 text-center text-sm text-fg-muted">
                As fotos são tiradas pelo técnico dentro da OS (app de campo) e ficam reunidas aqui, por data.
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="grid min-w-0 grid-cols-1 content-start gap-5">
          <Card>
            <CardBody>
              <Termostato situacao={sit} proxima={e.proximaLimpeza} ultima={e.ultimaLimpeza} />
            </CardBody>
          </Card>
          <Card>
            <dl className="grid grid-cols-2 divide-x divide-border">
              <div className="p-4">
                <dt className="text-2xs text-fg-subtle">Serviços feitos</dt>
                <dd className="tabular mt-0.5 text-lg font-semibold">{feitas.length}</dd>
              </div>
              <div className="p-4">
                <dt className="text-2xs text-fg-subtle">{verValor ? "Total investido" : "Último serviço"}</dt>
                <dd className="tabular mt-0.5 text-lg font-semibold">{verValor ? moeda(feitas.reduce((s, o) => s + o.valorTotal, 0)) : e.ultimoServico ? relativo(e.ultimoServico) : "—"}</dd>
              </div>
            </dl>
            {retornos ? (
              <p className="flex items-center gap-2 border-t border-border px-4 py-3 text-xs text-warning">
                <RotateCcw className="size-3.5" /> {retornos} retorno(s) em garantia neste aparelho
              </p>
            ) : null}
          </Card>
          {local ? (
            <Card aria-labelledby="t-local">
              <CardHeader id="t-local" titulo={local.nome} descricao="Local de instalação" icone={<MapPin />} />
              <CardBody className="pt-3 text-sm text-fg-muted">
                <p>{[local.logradouro && `${local.logradouro}${local.numero ? `, ${local.numero}` : ""}`, local.complemento].filter(Boolean).join(" · ") || "Endereço incompleto"}</p>
                <p>{[local.bairro, local.cidade].filter(Boolean).join(" · ")}</p>
                {destino ? (
                  <div className="mt-3 flex gap-2">
                    <a className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-surface-2" href={`https://www.google.com/maps/search/?api=1&query=${destino}`} target="_blank" rel="noopener noreferrer">
                      <MapPin className="size-3.5" /> Google Maps
                    </a>
                    <a className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium hover:bg-surface-2" href={`https://waze.com/ul?q=${destino}&navigate=yes`} target="_blank" rel="noopener noreferrer">
                      <Navigation className="size-3.5" /> Waze
                    </a>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

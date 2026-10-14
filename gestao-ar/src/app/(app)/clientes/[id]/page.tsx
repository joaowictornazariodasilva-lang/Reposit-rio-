import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AirVent, ArrowLeft, CalendarClock, ClipboardList, MapPin, Phone, Plus, StickyNote } from "lucide-react";
import { eq } from "drizzle-orm";
import { exigirSessao } from "@/server/auth/session";
import { obterCliente } from "@/server/queries/clientes";
import { getDb, schema } from "@/server/db";
import { pode } from "@/lib/permissions";
import { btus, dataCurta, documento, hojeISO, moeda, numero, relativo, telefone } from "@/lib/format";
import { primeiroNome, preencherModelo } from "@/lib/br";
import { MENSAGEM_LIMPEZA_PADRAO, TIPOS_EQUIPAMENTO, situacaoLimpeza } from "@/lib/dominio";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BotaoWhatsApp } from "@/components/whatsapp";
import { Avatar } from "@/components/clientes/tabela-clientes";
import { SeloGarantia, SeloLimpeza } from "@/components/equipamentos/selos";
import { EditarCliente } from "@/components/clientes/editar-cliente";
import { CartaoContatos, CartaoLocais } from "@/components/clientes/cartoes-cliente";
import { LinhaDoTempo } from "@/components/equipamentos/linha-do-tempo";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const sessao = await exigirSessao("clientes.ver");
  const d = /^[0-9a-f-]{36}$/.test((await params).id) ? await obterCliente(sessao, (await params).id) : null;
  return { title: d ? (d.cliente.nomeFantasia ?? d.cliente.nome) : "Cliente" };
}

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirSessao("clientes.ver");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const dados = await obterCliente(sessao, id);
  if (!dados) notFound();
  const { cliente, locais, contatos, equipamentos, ordens } = dados;
  const db = await getDb();
  const empresa = await db.query.empresas.findFirst({ where: eq(schema.empresas.id, sessao.empresaId), columns: { nome: true } });

  const hoje = hojeISO();
  const nome = cliente.nomeFantasia ?? cliente.nome;
  const concluidas = ordens.filter((o) => o.status === "concluida" || o.status === "faturada");
  const total = concluidas.reduce((s, o) => s + o.valorTotal, 0);
  const ultimo = concluidas[0]?.concluidaEm ?? null;
  const vencidos = equipamentos.filter((e) => situacaoLimpeza(e.proximaLimpeza, hoje).estado === "vencida");
  const podeEditar = pode(sessao.perfil, "clientes.editar");
  const podeEquip = pode(sessao.perfil, "equipamentos.editar");
  const contatoPrincipal = contatos.find((c) => c.principal) ?? contatos[0];
  const whats = cliente.whatsapp ?? contatoPrincipal?.whatsapp ?? null;

  const msgLimpeza =
    vencidos.length > 0
      ? preencherModelo(MENSAGEM_LIMPEZA_PADRAO, {
          cliente: primeiroNome(cliente.tipo === "pj" ? (contatoPrincipal?.nome ?? nome) : cliente.nome),
          empresa: empresa?.nome,
          aparelho: vencidos.length === 1 ? `${vencidos[0]!.marca} ${btus(vencidos[0]!.btus)}` : `(${vencidos.length} aparelhos)`,
          ambiente: vencidos.length === 1 ? (vencidos[0]!.ambiente ?? "—") : vencidos.map((v) => v.ambiente).filter(Boolean).join(", "),
          meses: Math.max(6, Math.round(-Math.min(...vencidos.map((v) => situacaoLimpeza(v.proximaLimpeza, hoje).dias ?? 0)) / 30) + 6),
        })
      : `Olá, ${primeiroNome(cliente.tipo === "pj" ? (contatoPrincipal?.nome ?? nome) : cliente.nome)}! Aqui é da ${empresa?.nome ?? "nossa empresa"}.`;

  const porLocal = new Map<string, typeof equipamentos>();
  for (const e of equipamentos) {
    const k = e.localId ?? "sem";
    porLocal.set(k, [...(porLocal.get(k) ?? []), e]);
  }

  return (
    <>
      <Link href="/clientes" className="mb-3 inline-flex h-9 items-center gap-1.5 rounded text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Clientes
      </Link>

      <Card className="mb-5">
        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar nome={nome} pj={cliente.tipo === "pj"} className="size-12 text-sm" />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight">{nome}</h1>
              <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-fg-subtle">
                <span>Cliente nº {cliente.codigo}</span>
                {cliente.nomeFantasia ? <span>· {cliente.nome}</span> : null}
                {cliente.documento ? <span>· {documento(cliente.documento)}</span> : null}
                {cliente.origem ? <span>· via {cliente.origem.toLowerCase()}</span> : null}
              </p>
              {cliente.tags.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {cliente.tags.map((t) => (
                    <Badge key={t} tom={t === "VIP" ? "acento" : t === "Contrato" ? "primario" : "neutro"}>
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <BotaoWhatsApp fone={whats} texto={msgLimpeza} variante="secondary" rotulo={vencidos.length ? "WhatsApp com convite para limpeza" : "Enviar WhatsApp"} />
            {cliente.telefone || whats ? (
              <a href={`tel:+55${(cliente.telefone ?? whats)!}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                <Phone /> Ligar
              </a>
            ) : null}
            {podeEditar ? <EditarCliente cliente={cliente} /> : null}
            {podeEquip ? (
              <Button asChild size="sm">
                <Link href={`?novo=equipamento&cliente=${cliente.id}`} scroll={false}>
                  <Plus /> Aparelho
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
        <dl className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
          {[
            ["Aparelhos", numero(equipamentos.length)],
            ["Serviços feitos", numero(concluidas.length)],
            ["Total em serviços", moeda(total)],
            ["Último atendimento", ultimo ? relativo(ultimo) : "Nunca"],
          ].map(([k, v], i) => (
            <div key={k} className={`px-4 py-3 sm:px-5 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i > 0 ? "sm:border-l" : ""} border-border`}>
              <dt className="text-2xs text-fg-subtle">{k}</dt>
              <dd className="tabular mt-0.5 text-base font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {vencidos.length ? (
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-accent-soft-fg sm:flex-row sm:items-center">
          <CalendarClock className="size-5 shrink-0" />
          <p className="flex-1 text-sm">
            <strong className="font-semibold">{vencidos.length === 1 ? "1 aparelho precisa" : `${vencidos.length} aparelhos precisam`} de limpeza.</strong> A mensagem de convite já está pronta no botão de WhatsApp.
          </p>
          <BotaoWhatsApp fone={whats} texto={msgLimpeza} variante="secondary" rotulo="Enviar convite de limpeza" className="self-start sm:self-auto" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-5">
          <Card aria-labelledby="t-aparelhos">
            <CardHeader id="t-aparelhos" titulo="Aparelhos" descricao="Ficha e histórico de cada equipamento" icone={<AirVent />} />
            <CardBody className="grid gap-5">
              {equipamentos.length === 0 ? (
                <EmptyState
                  className="py-8"
                  icone={<AirVent />}
                  titulo="Nenhum aparelho cadastrado"
                  descricao="Cadastre os aparelhos deste cliente para acompanhar limpezas, garantia e histórico."
                  acoes={
                    podeEquip ? (
                      <Button asChild>
                        <Link href={`?novo=equipamento&cliente=${cliente.id}`} scroll={false}>
                          <Plus /> Cadastrar aparelho
                        </Link>
                      </Button>
                    ) : null
                  }
                />
              ) : (
                [...porLocal.entries()].map(([localId, eqs]) => {
                  const local = locais.find((l) => l.id === localId);
                  return (
                    <div key={localId}>
                      {locais.length > 1 || !local ? (
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
                          <MapPin className="size-3.5" /> {local ? `${local.nome}${local.bairro ? ` · ${local.bairro}` : ""}` : "Sem local definido"}
                        </p>
                      ) : null}
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {eqs.map((e) => (
                          <li key={e.id}>
                            <Link href={`/equipamentos/${e.id}`} className="group block h-full rounded-lg border border-border p-3.5 transition-[border-color,box-shadow] duration-150 hover:border-border-strong hover:shadow-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold group-hover:text-primary">
                                    {e.marca} · {btus(e.btus)}
                                  </p>
                                  <p className="truncate text-xs text-fg-subtle">
                                    {TIPOS_EQUIPAMENTO[e.tipo]}
                                    {e.inverter ? " inverter" : ""} · {e.ambiente ?? "ambiente não informado"}
                                  </p>
                                </div>
                                <span className="tabular shrink-0 text-2xs text-fg-subtle">{e.qtdServicos} serv.</span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-1">
                                <SeloLimpeza proxima={e.proximaLimpeza} hoje={hoje} />
                                <SeloGarantia ate={e.garantiaAte} hoje={hoje} />
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>

          <Card aria-labelledby="t-historico">
            <CardHeader id="t-historico" titulo="Histórico de atendimentos" descricao={`${ordens.length} ordens de serviço`} icone={<ClipboardList />} />
            <CardBody>
              {ordens.length ? (
                <LinhaDoTempo
                  itens={ordens.slice(0, 30).map((o) => ({
                    ...o,
                    aparelho: (() => {
                      const e = equipamentos.find((x) => x.id === o.equipamentoId);
                      return e ? `${e.marca} ${btus(e.btus)} · ${e.ambiente ?? ""}` : null;
                    })(),
                    href: o.equipamentoId ? `/equipamentos/${o.equipamentoId}` : undefined,
                  }))}
                  mostrarValor={sessao.perfil !== "tecnico"}
                />
              ) : (
                <p className="py-6 text-center text-sm text-fg-muted">Nenhum atendimento ainda. As OS deste cliente aparecem aqui.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid min-w-0 grid-cols-1 content-start gap-5">
          <CartaoContatos clienteId={cliente.id} contatos={contatos} podeEditar={podeEditar} />
          <CartaoLocais clienteId={cliente.id} locais={locais} podeEditar={podeEditar} />
          <Card aria-labelledby="t-notas">
            <CardHeader id="t-notas" titulo="Notas internas" icone={<StickyNote />} />
            <CardBody className="pt-3">
              {cliente.notas ? <p className="whitespace-pre-line text-sm text-fg-muted">{cliente.notas}</p> : <p className="text-sm text-fg-subtle">Sem notas. Use “Editar” para registrar preferências do cliente.</p>}
              <p className="mt-3 text-2xs text-fg-subtle">
                Cliente desde {dataCurta(cliente.criadoEm)}
                {cliente.email ? ` · ${cliente.email}` : ""}
                {cliente.telefone ? ` · ${telefone(cliente.telefone)}` : ""}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

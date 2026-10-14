"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, MapPin, Navigation, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { removerContato, removerLocal, salvarContato, salvarLocal } from "@/server/actions/clientes";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BotaoWhatsApp } from "@/components/whatsapp";
import { cep as fmtCep, telefone } from "@/lib/format";
import { mascaraCep, mascaraTelefone } from "@/lib/mascaras";
import { CamposEndereco, enderecoVazio, type EnderecoForm } from "./campos-endereco";

type Contato = { id: string; nome: string; cargo: string | null; telefone: string | null; whatsapp: string | null; email: string | null; principal: boolean };
type Local = { id: string; nome: string; cep: string | null; logradouro: string | null; numero: string | null; complemento: string | null; bairro: string | null; cidade: string | null; uf: string | null; referencia: string | null; principal: boolean };

/** Confirmação curta para remoções (contatos/locais não têm desfazer). */
function useConfirmar() {
  const [estado, setEstado] = useState<{ titulo: string; descricao: string; acao: () => void } | null>(null);
  const dialogo = (
    <Dialog open={!!estado} onOpenChange={(o) => !o && setEstado(null)}>
      <DialogContent
        titulo={estado?.titulo ?? ""}
        descricao={estado?.descricao}
        rodape={
          <>
            <Button variant="ghost" onClick={() => setEstado(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                estado?.acao();
                setEstado(null);
              }}
            >
              Remover
            </Button>
          </>
        }
      />
    </Dialog>
  );
  return { confirmar: setEstado, dialogo };
}

export function CartaoContatos({ clienteId, contatos, podeEditar }: { clienteId: string; contatos: Contato[]; podeEditar: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState<Contato | "novo" | null>(null);
  const [form, setForm] = useState({ nome: "", cargo: "", whatsapp: "", telefone: "", email: "" });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();
  const { confirmar, dialogo } = useConfirmar();

  function abrir(c: Contato | "novo") {
    setEditando(c);
    setErros({});
    setForm(
      c === "novo"
        ? { nome: "", cargo: "", whatsapp: "", telefone: "", email: "" }
        : { nome: c.nome, cargo: c.cargo ?? "", whatsapp: mascaraTelefone(c.whatsapp ?? ""), telefone: mascaraTelefone(c.telefone ?? ""), email: c.email ?? "" },
    );
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarContato(clienteId, editando === "novo" || !editando ? null : editando.id, form);
      if (!r.ok) {
        setErros(r.campos ?? {});
        return void toast.error(r.erro);
      }
      toast.success("Contato salvo");
      setEditando(null);
      router.refresh();
    });
  }

  return (
    <Card aria-labelledby="t-contatos">
      <CardHeader
        id="t-contatos"
        titulo="Contatos"
        icone={<UserRound />}
        acao={
          podeEditar ? (
            <Button variant="ghost" size="icon-sm" onClick={() => abrir("novo")} aria-label="Adicionar contato">
              <Plus />
            </Button>
          ) : null
        }
      />
      <CardBody className="pt-3">
        {contatos.length ? (
          <ul className="grid grid-cols-1 gap-3">
            {contatos.map((c) => (
              <li key={c.id} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{c.nome}</span>
                    {c.principal ? <Badge tom="contorno">principal</Badge> : null}
                  </p>
                  <p className="truncate text-xs text-fg-subtle">{[c.cargo, telefone(c.whatsapp ?? c.telefone)].filter(Boolean).join(" · ") || "Sem telefone"}</p>
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1 truncate text-xs text-fg-subtle hover:text-primary">
                      <Mail className="size-3" /> {c.email}
                    </a>
                  ) : null}
                </div>
                <BotaoWhatsApp fone={c.whatsapp} somenteIcone rotulo={`WhatsApp de ${c.nome}`} />
                {podeEditar ? (
                  <Button variant="ghost" size="icon-sm" onClick={() => abrir(c)} aria-label={`Editar ${c.nome}`}>
                    <Pencil />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-fg-subtle">Nenhum contato. Adicione quem atende no local (síndico, gerente…).</p>
        )}
      </CardBody>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent
          titulo={editando === "novo" ? "Novo contato" : "Editar contato"}
          rodape={
            <>
              {editando && editando !== "novo" ? (
                <Button
                  variant="ghost"
                  className="mr-auto text-danger"
                  onClick={() => {
                    const alvo = editando;
                    setEditando(null);
                    confirmar({
                      titulo: `Remover ${alvo.nome}?`,
                      descricao: "O contato sai da ficha do cliente.",
                      acao: () =>
                        iniciar(async () => {
                          const r = await removerContato(clienteId, alvo.id);
                          if (r.ok) toast.success("Contato removido");
                          else toast.error(r.erro);
                          router.refresh();
                        }),
                    });
                  }}
                >
                  <Trash2 /> Remover
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
              <Button onClick={salvar} carregando={pendente}>
                Salvar
              </Button>
            </>
          }
        >
          <form
            className="grid grid-cols-2 gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              salvar();
            }}
          >
            <Field label="Nome" htmlFor="ct-nome" obrigatorio erro={erros.nome} className="col-span-2">
              <Input id="ct-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} autoFocus />
            </Field>
            <Field label="Cargo" htmlFor="ct-cargo" className="col-span-2">
              <Input id="ct-cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
            </Field>
            <Field label="WhatsApp" htmlFor="ct-whats" erro={erros.whatsapp} className="col-span-2 sm:col-span-1">
              <Input id="ct-whats" inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: mascaraTelefone(e.target.value) })} />
            </Field>
            <Field label="Telefone" htmlFor="ct-tel" erro={erros.telefone} className="col-span-2 sm:col-span-1">
              <Input id="ct-tel" inputMode="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })} />
            </Field>
            <Field label="E-mail" htmlFor="ct-email" erro={erros.email} className="col-span-2">
              <Input id="ct-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
              Salvar
            </button>
          </form>
        </DialogContent>
      </Dialog>
      {dialogo}
    </Card>
  );
}

function enderecoLinha(l: Local) {
  return [l.logradouro && `${l.logradouro}${l.numero ? `, ${l.numero}` : ""}`, l.complemento, l.bairro, l.cidade && `${l.cidade}${l.uf ? `/${l.uf}` : ""}`].filter(Boolean).join(" · ");
}

export function CartaoLocais({ clienteId, locais, podeEditar }: { clienteId: string; locais: Local[]; podeEditar: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState<Local | "novo" | null>(null);
  const [form, setForm] = useState<EnderecoForm>(enderecoVazio);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();
  const { confirmar, dialogo } = useConfirmar();

  function abrir(l: Local | "novo") {
    setEditando(l);
    setErros({});
    setForm(
      l === "novo"
        ? { ...enderecoVazio, nome: locais.length ? "" : "Principal" }
        : {
            nome: l.nome,
            cep: mascaraCep(l.cep ?? ""),
            logradouro: l.logradouro ?? "",
            numero: l.numero ?? "",
            complemento: l.complemento ?? "",
            bairro: l.bairro ?? "",
            cidade: l.cidade ?? "",
            uf: l.uf ?? "",
            referencia: l.referencia ?? "",
          },
    );
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarLocal(clienteId, editando === "novo" || !editando ? null : editando.id, { ...form, nome: form.nome ?? "" });
      if (!r.ok) {
        setErros(r.campos ?? {});
        return void toast.error(r.erro);
      }
      toast.success("Endereço salvo");
      setEditando(null);
      router.refresh();
    });
  }

  return (
    <Card aria-labelledby="t-locais">
      <CardHeader
        id="t-locais"
        titulo="Locais de atendimento"
        icone={<MapPin />}
        acao={
          podeEditar ? (
            <Button variant="ghost" size="icon-sm" onClick={() => abrir("novo")} aria-label="Adicionar local">
              <Plus />
            </Button>
          ) : null
        }
      />
      <CardBody className="pt-3">
        {locais.length ? (
          <ul className="grid grid-cols-1 gap-3">
            {locais.map((l) => {
              const end = enderecoLinha(l);
              const destino = encodeURIComponent([l.logradouro, l.numero, l.bairro, l.cidade, l.uf].filter(Boolean).join(", "));
              return (
                <li key={l.id} className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{l.nome}</p>
                    <p className="text-xs text-fg-subtle">{end || "Endereço incompleto"}</p>
                    {l.cep ? <p className="text-2xs text-fg-subtle">CEP {fmtCep(l.cep)}</p> : null}
                    {l.referencia ? <p className="mt-0.5 text-xs italic text-fg-subtle">{l.referencia}</p> : null}
                    {end ? (
                      <div className="mt-2 flex gap-2">
                        <a className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium text-fg-muted hover:bg-surface-2 hover:text-fg sm:h-7" href={`https://www.google.com/maps/search/?api=1&query=${destino}`} target="_blank" rel="noopener noreferrer">
                          <MapPin className="size-3.5" /> Maps
                        </a>
                        <a className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-2.5 text-xs font-medium text-fg-muted hover:bg-surface-2 hover:text-fg sm:h-7" href={`https://waze.com/ul?q=${destino}&navigate=yes`} target="_blank" rel="noopener noreferrer">
                          <Navigation className="size-3.5" /> Waze
                        </a>
                      </div>
                    ) : null}
                  </div>
                  {podeEditar ? (
                    <Button variant="ghost" size="icon-sm" onClick={() => abrir(l)} aria-label={`Editar ${l.nome}`}>
                      <Pencil />
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-sm text-fg-subtle">
            Sem endereço cadastrado.
            {podeEditar ? (
              <Button variant="link" className="ml-1" onClick={() => abrir("novo")}>
                Adicionar endereço
              </Button>
            ) : null}
          </div>
        )}
      </CardBody>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent
          titulo={editando === "novo" ? "Novo local" : "Editar local"}
          descricao="Digite o CEP e o endereço é preenchido."
          className="max-w-xl"
          rodape={
            <>
              {editando && editando !== "novo" ? (
                <Button
                  variant="ghost"
                  className="mr-auto text-danger"
                  onClick={() => {
                    const alvo = editando;
                    setEditando(null);
                    confirmar({
                      titulo: `Remover o local “${alvo.nome}”?`,
                      descricao: "Só é possível remover locais sem aparelhos vinculados.",
                      acao: () =>
                        iniciar(async () => {
                          const r = await removerLocal(clienteId, alvo.id);
                          if (r.ok) toast.success("Local removido");
                          else toast.error(r.erro);
                          router.refresh();
                        }),
                    });
                  }}
                >
                  <Trash2 /> Remover
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => setEditando(null)}>
                Cancelar
              </Button>
              <Button onClick={salvar} carregando={pendente}>
                Salvar
              </Button>
            </>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              salvar();
            }}
          >
            <CamposEndereco prefixo="loc" comNome valor={form} onChange={setForm} erros={erros} />
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
              Salvar
            </button>
          </form>
        </DialogContent>
      </Dialog>
      {dialogo}
    </Card>
  );
}

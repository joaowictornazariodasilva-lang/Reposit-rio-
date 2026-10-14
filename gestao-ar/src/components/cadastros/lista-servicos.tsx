"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Pencil, Plus, Repeat, ShieldCheck, Trash2, Wrench } from "lucide-react";
import type { Servico } from "@/server/queries/cadastros";
import { salvarServico, type ServicoInput } from "@/server/actions/cadastros";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { InputMoeda } from "@/components/ui/input-moeda";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { CATEGORIAS_SERVICO } from "@/lib/dominio";
import { moeda, numero } from "@/lib/format";
import { cn } from "@/lib/utils";

type Form = Omit<ServicoInput, "precoPadrao" | "variacoes"> & { precoPadrao: number; variacoes: { btusAte: number; preco: number }[] };
const vazio: Form = { nome: "", categoria: "higienizacao", descricao: "", precoPadrao: 0, variacoes: [], duracaoMin: 60, garantiaDias: 90, recorrenciaMeses: null, ativo: true };

function duracao(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}

export function ListaServicos({ servicos, podeEditar }: { servicos: Servico[]; podeEditar: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | "novo" | null>(null);
  const [form, setForm] = useState<Form>(vazio);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();

  function abrir(s: Servico | "novo") {
    setErros({});
    if (s === "novo") {
      setForm(vazio);
      setEditando("novo");
    } else {
      setForm({ nome: s.nome, categoria: s.categoria, descricao: s.descricao ?? "", precoPadrao: s.precoPadrao, variacoes: s.variacoes, duracaoMin: s.duracaoMin, garantiaDias: s.garantiaDias, recorrenciaMeses: s.recorrenciaMeses, ativo: s.ativo });
      setEditando(s.id);
    }
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarServico(editando === "novo" ? null : editando, form);
      if (!r.ok) {
        setErros(r.campos ?? {});
        return void toast.error(r.erro);
      }
      toast.success("Serviço salvo");
      setEditando(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">Ao escolher o serviço na OS, o preço e a garantia vêm preenchidos — inclusive por faixa de BTUs.</p>
        {podeEditar ? (
          <Button onClick={() => abrir("novo")} className="shrink-0">
            <Plus /> Novo serviço
          </Button>
        ) : null}
      </div>
      {servicos.length === 0 ? (
        <Card>
          <EmptyState icone={<Wrench />} titulo="Cadastre seus serviços" descricao="Instalação, limpeza, carga de gás… Com os preços cadastrados, montar uma OS ou orçamento leva segundos." acoes={podeEditar ? <Button onClick={() => abrir("novo")}><Plus /> Novo serviço</Button> : null} />
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {servicos.map((s) => (
            <li key={s.id}>
              <Card className={cn("flex h-full flex-col p-4 transition-shadow hover:shadow-sm", !s.ativo && "opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.nome}</p>
                    {CATEGORIAS_SERVICO[s.categoria].toLowerCase() !== s.nome.toLowerCase() ? <p className="text-xs text-fg-subtle">{CATEGORIAS_SERVICO[s.categoria]}</p> : null}
                  </div>
                  {podeEditar ? (
                    <Button variant="ghost" size="icon-sm" onClick={() => abrir(s)} aria-label={`Editar ${s.nome}`}>
                      <Pencil />
                    </Button>
                  ) : null}
                </div>
                <p className="tabular mt-3 text-xl font-semibold">
                  {s.variacoes.length ? <span className="mr-1 text-xs font-normal text-fg-subtle">a partir de</span> : null}
                  {s.variacoes[0]?.preco || s.precoPadrao ? moeda(s.variacoes[0]?.preco ?? s.precoPadrao) : <span className="text-base font-medium text-fg-muted">Preço pelos itens</span>}
                </p>
                {s.variacoes.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {s.variacoes.map((v) => (
                      <li key={v.btusAte}>
                        <Badge tom="contorno" className="tabular">
                          até {numero(v.btusAte / 1000)} mil · {moeda(v.preco)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-4 text-xs text-fg-muted">
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> {duracao(s.duracaoMin)}</span>
                  {s.garantiaDias ? <span className="flex items-center gap-1"><ShieldCheck className="size-3.5" /> {s.garantiaDias} dias</span> : null}
                  {s.recorrenciaMeses ? <span className="flex items-center gap-1"><Repeat className="size-3.5" /> retorno em {s.recorrenciaMeses} {s.recorrenciaMeses === 1 ? "mês" : "meses"}</span> : null}
                  <span className="ml-auto text-fg-subtle">{s.usos} OS</span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <SheetContent
          titulo={editando === "novo" ? "Novo tipo de serviço" : "Editar serviço"}
          rodape={
            <>
              <Button variant="ghost" className="mr-auto" onClick={() => setEditando(null)}>Cancelar</Button>
              <Button onClick={salvar} carregando={pendente}>Salvar</Button>
            </>
          }
        >
          <form className="grid grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
            <Field label="Nome" htmlFor="sv-nome" obrigatorio erro={erros.nome} className="col-span-2">
              <Input id="sv-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Field>
            <Field label="Categoria" htmlFor="sv-cat" className="col-span-2">
              <NativeSelect id="sv-cat" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as Form["categoria"] })}>
                {Object.entries(CATEGORIAS_SERVICO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Preço padrão" htmlFor="sv-preco" erro={erros.precoPadrao}>
              <InputMoeda id="sv-preco" valor={form.precoPadrao} onChange={(v) => setForm({ ...form, precoPadrao: v })} />
            </Field>
            <Field label="Duração (min)" htmlFor="sv-dur" erro={erros.duracaoMin}>
              <Input id="sv-dur" inputMode="numeric" value={String(form.duracaoMin)} onChange={(e) => setForm({ ...form, duracaoMin: Number(e.target.value.replace(/\D/g, "")) })} />
            </Field>
            <Field label="Garantia (dias)" htmlFor="sv-gar" erro={erros.garantiaDias}>
              <Input id="sv-gar" inputMode="numeric" value={String(form.garantiaDias)} onChange={(e) => setForm({ ...form, garantiaDias: Number(e.target.value.replace(/\D/g, "")) })} />
            </Field>
            <Field label="Sugerir retorno (meses)" htmlFor="sv-rec" hint="Ex.: limpeza a cada 6 meses. Vazio = não sugerir.">
              <Input id="sv-rec" inputMode="numeric" value={form.recorrenciaMeses ? String(form.recorrenciaMeses) : ""} onChange={(e) => setForm({ ...form, recorrenciaMeses: Number(e.target.value.replace(/\D/g, "")) || null })} />
            </Field>

            <fieldset className="col-span-2 grid gap-2">
              <legend className="mb-1 text-xs font-medium">Preço por faixa de BTUs <span className="font-normal text-fg-subtle">(opcional)</span></legend>
              {form.variacoes.map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-fg-subtle">até</span>
                    <Input aria-label={`Faixa ${i + 1}: BTUs até`} inputMode="numeric" className="tabular pl-10" value={String(v.btusAte)} onChange={(e) => setForm({ ...form, variacoes: form.variacoes.map((x, j) => (j === i ? { ...x, btusAte: Number(e.target.value.replace(/\D/g, "")) } : x)) })} />
                  </div>
                  <InputMoeda aria-label={`Faixa ${i + 1}: preço`} valor={v.preco} onChange={(n) => setForm({ ...form, variacoes: form.variacoes.map((x, j) => (j === i ? { ...x, preco: n } : x)) })} />
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover faixa ${i + 1}`} onClick={() => setForm({ ...form, variacoes: form.variacoes.filter((_, j) => j !== i) })}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" className="justify-self-start" onClick={() => setForm({ ...form, variacoes: [...form.variacoes, { btusAte: (form.variacoes.at(-1)?.btusAte ?? 6000) + 6000, preco: form.variacoes.at(-1)?.preco ?? form.precoPadrao }] })}>
                <Plus /> Adicionar faixa
              </Button>
            </fieldset>

            <Field label="Descrição (aparece no orçamento)" htmlFor="sv-desc" className="col-span-2">
              <Textarea id="sv-desc" rows={3} value={form.descricao ?? ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </Field>
            <label htmlFor="sv-ativo" className="col-span-2 flex min-h-11 items-center justify-between rounded-md border border-border px-3">
              <span className="text-sm">Ativo (aparece ao criar OS)</span>
              <Switch id="sv-ativo" checked={form.ativo} onCheckedChange={(c) => setForm({ ...form, ativo: c })} />
            </label>
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Salvar</button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Boxes, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Kit } from "@/server/queries/cadastros";
import { excluirCadastro, salvarKit } from "@/server/actions/cadastros";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { InputMoeda } from "@/components/ui/input-moeda";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { moeda } from "@/lib/format";

type Opcao = { id: string; nome: string; preco: number };
type Item = { ref: string; quantidade: number; precoUnitario: number | null };
type Form = { nome: string; descricao: string; favorito: boolean; itens: Item[] };

export function ListaKits({ kits, servicos, produtos, podeEditar, verCusto }: { kits: Kit[]; servicos: Opcao[]; produtos: Opcao[]; podeEditar: boolean; verCusto: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | "novo" | null>(null);
  const [form, setForm] = useState<Form>({ nome: "", descricao: "", favorito: true, itens: [] });
  const [pendente, iniciar] = useTransition();

  const opcao = (ref: string) => (ref.startsWith("s:") ? servicos.find((s) => `s:${s.id}` === ref) : produtos.find((p) => `p:${p.id}` === ref));
  const total = form.itens.reduce((s, i) => s + i.quantidade * (i.precoUnitario ?? opcao(i.ref)?.preco ?? 0), 0);

  function abrir(k: Kit | "novo") {
    if (k === "novo") {
      setForm({ nome: "", descricao: "", favorito: true, itens: servicos[0] ? [{ ref: `s:${servicos[0].id}`, quantidade: 1, precoUnitario: null }] : [] });
      setEditando("novo");
      return;
    }
    setForm({
      nome: k.nome,
      descricao: k.descricao ?? "",
      favorito: k.favorito,
      itens: k.itens.map((i) => ({ ref: i.tipoServicoId ? `s:${i.tipoServicoId}` : `p:${i.produtoId}`, quantidade: i.quantidade, precoUnitario: i.precoUnitario })),
    });
    setEditando(k.id);
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarKit(editando === "novo" ? null : editando, {
        nome: form.nome,
        descricao: form.descricao,
        favorito: form.favorito,
        itens: form.itens.map((i) => ({
          tipoServicoId: i.ref.startsWith("s:") ? i.ref.slice(2) : null,
          produtoId: i.ref.startsWith("p:") ? i.ref.slice(2) : null,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
        })),
      });
      if (!r.ok) return void toast.error(r.erro);
      toast.success("Kit salvo");
      setEditando(null);
      router.refresh();
    });
  }

  function excluir(id: string, nome: string) {
    iniciar(async () => {
      await excluirCadastro("kit", [id]);
      setEditando(null);
      toast(`Kit “${nome}” excluído`, { duration: 8000, action: { label: "Desfazer", onClick: async () => { await excluirCadastro("kit", [id], true); router.refresh(); } } });
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">Pacotes prontos (serviço + materiais) para montar orçamento e OS com um clique.</p>
        {podeEditar ? (
          <Button onClick={() => abrir("novo")} className="shrink-0">
            <Plus /> Novo kit
          </Button>
        ) : null}
      </div>
      {kits.length === 0 ? (
        <Card>
          <EmptyState icone={<Boxes />} titulo="Monte seu primeiro kit" descricao="Ex.: “Instalação 12.000 BTUs” com mão de obra, 3 m de tubo, suporte e cabo. No orçamento, o kit entra inteiro com um clique." acoes={podeEditar ? <Button onClick={() => abrir("novo")}><Plus /> Novo kit</Button> : null} />
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {kits.map((k) => (
            <li key={k.id}>
              <Card className="flex h-full flex-col p-4">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-semibold">
                      {k.favorito ? <Star className="size-4 shrink-0 fill-accent text-accent" aria-label="Favorito" /> : null}
                      <span className="truncate">{k.nome}</span>
                    </p>
                    {k.descricao ? <p className="mt-0.5 text-xs text-fg-subtle">{k.descricao}</p> : null}
                  </div>
                  {podeEditar ? (
                    <Button variant="ghost" size="icon-sm" onClick={() => abrir(k)} aria-label={`Editar ${k.nome}`}>
                      <Pencil />
                    </Button>
                  ) : null}
                </div>
                <ul className="mt-3 grid gap-1 text-xs text-fg-muted">
                  {k.itens.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3">
                      <span className="truncate">
                        <span className="tabular text-fg-subtle">{i.quantidade.toLocaleString("pt-BR")}{i.unidade && i.unidade !== "un" ? ` ${i.unidade}` : "×"}</span> {i.nome}
                      </span>
                      <span className="tabular shrink-0">{moeda(i.quantidade * (i.precoUnitario ?? i.precoCadastro))}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
                  <span className="tabular text-xl font-semibold">{moeda(k.total)}</span>
                  {verCusto && k.total ? <Badge tom={(k.total - k.custo) / k.total < 0.3 ? "alerta" : "sucesso"}>margem {(((k.total - k.custo) / k.total) * 100).toFixed(0)}%</Badge> : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <SheetContent
          titulo={editando === "novo" ? "Novo kit" : "Editar kit"}
          descricao="O preço de cada item vem do cadastro; ajuste só se o kit tiver preço especial."
          rodape={
            <>
              {editando && editando !== "novo" ? (
                <Button variant="ghost" className="mr-auto text-danger" onClick={() => excluir(editando, form.nome)}>
                  <Trash2 /> Excluir
                </Button>
              ) : (
                <Button variant="ghost" className="mr-auto" onClick={() => setEditando(null)}>Cancelar</Button>
              )}
              <span className="tabular mr-2 text-sm font-semibold">{moeda(total)}</span>
              <Button onClick={salvar} carregando={pendente}>Salvar</Button>
            </>
          }
        >
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
            <Field label="Nome do kit" htmlFor="kit-nome" obrigatorio>
              <Input id="kit-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Kit instalação 12.000 BTUs" />
            </Field>
            <Field label="Descrição" htmlFor="kit-desc">
              <Textarea id="kit-desc" rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </Field>
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-xs font-medium">Itens</legend>
              {form.itens.map((it, i) => {
                const o = opcao(it.ref);
                return (
                  <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-border p-2.5">
                    <NativeSelect aria-label={`Item ${i + 1}`} value={it.ref} onChange={(e) => setForm({ ...form, itens: form.itens.map((x, j) => (j === i ? { ...x, ref: e.target.value, precoUnitario: null } : x)) })}>
                      <optgroup label="Serviços">{servicos.map((s) => <option key={s.id} value={`s:${s.id}`}>{s.nome}</option>)}</optgroup>
                      <optgroup label="Produtos e peças">{produtos.map((p) => <option key={p.id} value={`p:${p.id}`}>{p.nome}</option>)}</optgroup>
                    </NativeSelect>
                    <Button type="button" variant="ghost" size="icon-sm" className="self-center" aria-label={`Remover item ${i + 1}`} onClick={() => setForm({ ...form, itens: form.itens.filter((_, j) => j !== i) })}>
                      <Trash2 />
                    </Button>
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      <Input aria-label={`Quantidade do item ${i + 1}`} inputMode="decimal" className="tabular" value={String(it.quantidade).replace(".", ",")} onChange={(e) => setForm({ ...form, itens: form.itens.map((x, j) => (j === i ? { ...x, quantidade: Number(e.target.value.replace(",", ".")) || 0 } : x)) })} />
                      <InputMoeda aria-label={`Preço unitário do item ${i + 1}`} valor={it.precoUnitario ?? o?.preco ?? 0} onChange={(v) => setForm({ ...form, itens: form.itens.map((x, j) => (j === i ? { ...x, precoUnitario: v } : x)) })} />
                    </div>
                  </div>
                );
              })}
              <Button type="button" variant="secondary" size="sm" className="justify-self-start" onClick={() => setForm({ ...form, itens: [...form.itens, { ref: produtos[0] ? `p:${produtos[0].id}` : `s:${servicos[0]?.id}`, quantidade: 1, precoUnitario: null }] })}>
                <Plus /> Adicionar item
              </Button>
            </fieldset>
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Salvar</button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

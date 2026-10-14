"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Produto } from "@/server/queries/cadastros";
import { alternarFavorito, criarCategoria, excluirCadastro, salvarProduto, type ProdutoInput } from "@/server/actions/cadastros";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { InputMoeda } from "@/components/ui/input-moeda";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { BarraBusca, FiltroPilulas } from "@/components/lista/barra-busca";
import { SeletorUrl } from "@/components/lista/seletor-url";
import { moeda } from "@/lib/format";
import { cn } from "@/lib/utils";

type Opcao = { id: string; nome: string };
type Form = { nome: string; sku: string; codigoBarras: string; categoriaId: string; fornecedorId: string; unidade: NonNullable<ProdutoInput["unidade"]>; custo: number; preco: number; estoqueMinimo: number; favorito: boolean };
const vazio: Form = { nome: "", sku: "", codigoBarras: "", categoriaId: "", fornecedorId: "", unidade: "un", custo: 0, preco: 0, estoqueMinimo: 0, favorito: false };
const UNIDADES: Record<Form["unidade"], string> = { un: "Unidade", m: "Metro", kg: "Quilo", l: "Litro", cx: "Caixa", par: "Par" };

export function margem(custo: number, preco: number) {
  if (!preco) return null;
  return ((preco - custo) / preco) * 100;
}

export function ListaProdutos({ produtos, categorias: catsIniciais, fornecedores, podeEditar, verCusto, filtrando, abrirNovo }: { produtos: Produto[]; categorias: Opcao[]; fornecedores: Opcao[]; podeEditar: boolean; verCusto: boolean; filtrando: boolean; abrirNovo: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [categorias, setCategorias] = useState(catsIniciais);
  const [editando, setEditando] = useState<string | "novo" | null>(null);
  const [form, setForm] = useState<Form>(vazio);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();

  useEffect(() => setCategorias(catsIniciais), [catsIniciais]);
  useEffect(() => {
    if (abrirNovo && podeEditar) {
      setForm(vazio);
      setEditando("novo");
    }
  }, [abrirNovo, podeEditar]);

  function abrir(p: Produto | "novo") {
    setErros({});
    if (p === "novo") {
      setForm(vazio);
      setEditando("novo");
      return;
    }
    setForm({ nome: p.nome, sku: p.sku ?? "", codigoBarras: p.codigoBarras ?? "", categoriaId: p.categoriaId ?? "", fornecedorId: p.fornecedorId ?? "", unidade: p.unidade as Form["unidade"], custo: p.custo, preco: p.preco, estoqueMinimo: p.estoqueMinimo, favorito: p.favorito });
    setEditando(p.id);
  }

  function fechar() {
    setEditando(null);
    if (abrirNovo) router.replace(pathname, { scroll: false });
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarProduto(editando === "novo" ? null : editando, form);
      if (!r.ok) {
        setErros(r.campos ?? {});
        return void toast.error(r.erro);
      }
      toast.success("Produto salvo", { description: form.nome });
      fechar();
      router.refresh();
    });
  }

  function excluir(p: Produto) {
    iniciar(async () => {
      const r = await excluirCadastro("produto", [p.id]);
      if (!r.ok) return void toast.error(r.erro);
      fechar();
      toast(`“${p.nome}” excluído`, {
        duration: 8000,
        action: { label: "Desfazer", onClick: async () => { await excluirCadastro("produto", [p.id], true); toast.success("Exclusão desfeita"); router.refresh(); } },
      });
      router.refresh();
    });
  }

  const [novaCat, setNovaCat] = useState<string | null>(null);
  async function criarNovaCategoria() {
    if (!novaCat?.trim()) return setNovaCat(null);
    const r = await criarCategoria(novaCat);
    if (!r.ok) return void toast.error(r.erro);
    setCategorias((c) => [...c, { id: r.id, nome: r.nome }].sort((a, b) => a.nome.localeCompare(b.nome)));
    setForm((f) => ({ ...f, categoriaId: r.id }));
    setNovaCat(null);
  }

  const m = margem(form.custo, form.preco);

  return (
    <>
      <div className="mb-4 grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <BarraBusca placeholder="Buscar por nome, SKU ou código de barras…" className="flex-1" />
          <SeletorUrl param="categoria" rotulo="Categoria" opcoes={[{ valor: "", rotulo: "Todas as categorias" }, ...categorias.map((c) => ({ valor: c.id, rotulo: c.nome }))]} className="sm:w-56" />
          {podeEditar ? (
            <Button onClick={() => abrir("novo")} className="shrink-0">
              <Plus /> Novo produto
            </Button>
          ) : null}
        </div>
        <FiltroPilulas param="filtro" opcoes={[{ valor: "", rotulo: "Todos" }, { valor: "favoritos", rotulo: "Favoritos (orçamento rápido)" }, { valor: "sem_preco", rotulo: "Sem preço de venda" }]} />
      </div>

      <Card className="overflow-hidden">
        {produtos.length === 0 ? (
          <EmptyState
            icone={<Package />}
            titulo={filtrando ? "Nenhum produto neste filtro" : "Cadastre suas peças e materiais"}
            descricao={filtrando ? "Tente outro termo ou limpe os filtros." : "Tubos, gás, capacitores, suportes… Com custo e preço cadastrados, o sistema calcula a margem e dá baixa no estoque pela OS."}
            acoes={podeEditar && !filtrando ? <Button onClick={() => abrir("novo")}><Plus /> Novo produto</Button> : null}
          />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-surface-2 text-left text-2xs font-medium uppercase tracking-wider text-fg-subtle">
                <tr>
                  <th className="w-12 py-2.5 pl-4"><span className="sr-only">Favorito</span></th>
                  <th className="py-2.5 pr-3 font-medium">Produto</th>
                  <th className="py-2.5 pr-3 font-medium">Categoria</th>
                  <th className="py-2.5 pr-3 font-medium">Fornecedor</th>
                  {verCusto ? <th className="py-2.5 pr-3 text-right font-medium">Custo</th> : null}
                  <th className="py-2.5 pr-3 text-right font-medium">Preço</th>
                  {verCusto ? <th className="py-2.5 pr-3 text-right font-medium">Margem</th> : null}
                  <th className="w-14 py-2.5 pr-4"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => {
                  const mg = margem(p.custo, p.preco);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                      <td className="py-2.5 pl-4">
                        <button
                          type="button"
                          disabled={!podeEditar}
                          onClick={() => iniciar(async () => { await alternarFavorito(p.id, !p.favorito); router.refresh(); })}
                          className={cn("grid size-9 place-items-center rounded-md text-fg-subtle hover:bg-surface-3 disabled:hover:bg-transparent sm:size-8", p.favorito && "text-accent")}
                          aria-label={p.favorito ? `Remover ${p.nome} dos favoritos` : `Marcar ${p.nome} como favorito`}
                          aria-pressed={p.favorito}
                        >
                          <Star className={cn("size-4", p.favorito && "fill-current")} />
                        </button>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="block font-medium">{p.nome}</span>
                        <span className="block text-xs text-fg-subtle">{[p.sku, p.codigoBarras].filter(Boolean).join(" · ") || "sem código"} · {UNIDADES[p.unidade as Form["unidade"]]?.toLowerCase() ?? p.unidade}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-fg-muted">{p.categoria ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-fg-muted">{p.fornecedor ?? "—"}</td>
                      {verCusto ? <td className="tabular py-2.5 pr-3 text-right text-fg-muted">{moeda(p.custo)}</td> : null}
                      <td className="tabular py-2.5 pr-3 text-right font-medium">{p.preco ? moeda(p.preco) : <span className="font-normal text-fg-subtle">uso interno</span>}</td>
                      {verCusto ? (
                        <td className={cn("tabular py-2.5 pr-3 text-right", mg === null ? "text-fg-subtle" : mg < 30 ? "text-warning" : "text-success")}>{mg === null ? "—" : `${mg.toFixed(0)}%`}</td>
                      ) : null}
                      <td className="py-2.5 pr-4 text-right">
                        {podeEditar ? (
                          <Button variant="ghost" size="icon-sm" onClick={() => abrir(p)} aria-label={`Editar ${p.nome}`}>
                            <Pencil />
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Sheet open={!!editando} onOpenChange={(o) => !o && fechar()}>
        <SheetContent
          titulo={editando === "novo" ? "Novo produto ou peça" : "Editar produto"}
          rodape={
            <>
              {editando && editando !== "novo" ? (
                <Button variant="ghost" className="mr-auto text-danger" onClick={() => { const p = produtos.find((x) => x.id === editando); if (p) excluir(p); }}>
                  <Trash2 /> Excluir
                </Button>
              ) : (
                <Button variant="ghost" className="mr-auto" onClick={fechar}>Cancelar</Button>
              )}
              <Button onClick={salvar} carregando={pendente}>Salvar</Button>
            </>
          }
        >
          <form className="grid grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
            <Field label="Nome" htmlFor="pr-nome" obrigatorio erro={erros.nome} className="col-span-2">
              <Input id="pr-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Field>
            <Field label="SKU / código interno" htmlFor="pr-sku">
              <Input id="pr-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Código de barras" htmlFor="pr-ean" erro={erros.codigoBarras} hint="Funciona com leitor USB">
              <Input id="pr-ean" inputMode="numeric" value={form.codigoBarras} onChange={(e) => setForm({ ...form, codigoBarras: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="Categoria" htmlFor="pr-cat" acao={podeEditar && novaCat === null ? <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => setNovaCat("")}>+ nova</button> : null}>
              {novaCat !== null ? (
                <Input
                  id="pr-cat"
                  autoFocus
                  placeholder="Nome e Enter"
                  value={novaCat}
                  onChange={(e) => setNovaCat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void criarNovaCategoria();
                    }
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      setNovaCat(null);
                    }
                  }}
                  onBlur={() => void criarNovaCategoria()}
                />
              ) : (
                <NativeSelect id="pr-cat" value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
                  <option value="">Sem categoria</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </NativeSelect>
              )}
            </Field>
            <Field label="Fornecedor" htmlFor="pr-forn">
              <NativeSelect id="pr-forn" value={form.fornecedorId} onChange={(e) => setForm({ ...form, fornecedorId: e.target.value })}>
                <option value="">Sem fornecedor</option>
                {fornecedores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Unidade" htmlFor="pr-un">
              <NativeSelect id="pr-un" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value as Form["unidade"] })}>
                {Object.entries(UNIDADES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Estoque mínimo" htmlFor="pr-min" hint="Abaixo disso entra na lista de compras">
              <Input id="pr-min" inputMode="decimal" value={String(form.estoqueMinimo)} onChange={(e) => setForm({ ...form, estoqueMinimo: Number(e.target.value.replace(",", ".")) || 0 })} />
            </Field>
            {verCusto ? (
              <Field label="Custo" htmlFor="pr-custo" erro={erros.custo}>
                <InputMoeda id="pr-custo" valor={form.custo} onChange={(v) => setForm({ ...form, custo: v })} />
              </Field>
            ) : null}
            <Field label="Preço de venda" htmlFor="pr-preco" erro={erros.preco} hint={verCusto && m !== null ? `Margem: ${m.toFixed(1).replace(".", ",")}%` : "0 = material de uso interno"} className={verCusto ? "" : "col-span-2"}>
              <InputMoeda id="pr-preco" valor={form.preco} onChange={(v) => setForm({ ...form, preco: v })} />
            </Field>
            <label htmlFor="pr-fav" className="col-span-2 flex min-h-11 items-center justify-between rounded-md border border-border px-3">
              <span className="text-sm">
                Favorito
                <span className="block text-xs text-fg-subtle">Aparece primeiro no orçamento relâmpago</span>
              </span>
              <Switch id="pr-fav" checked={form.favorito} onCheckedChange={(c) => setForm({ ...form, favorito: c })} />
            </label>
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Salvar</button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Truck } from "lucide-react";
import type { Fornecedor } from "@/server/queries/cadastros";
import { excluirCadastro, salvarFornecedor } from "@/server/actions/cadastros";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { BotaoWhatsApp } from "@/components/whatsapp";
import { telefone } from "@/lib/format";
import { mascaraDocumento, mascaraTelefone } from "@/lib/mascaras";

type Form = { nome: string; documento: string; contato: string; telefone: string; whatsapp: string; email: string; prazoEntregaDias: string; notas: string };
const vazio: Form = { nome: "", documento: "", contato: "", telefone: "", whatsapp: "", email: "", prazoEntregaDias: "", notas: "" };

export function ListaFornecedores({ fornecedores, podeEditar }: { fornecedores: Fornecedor[]; podeEditar: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | "novo" | null>(null);
  const [form, setForm] = useState<Form>(vazio);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();

  function abrir(f: Fornecedor | "novo") {
    setErros({});
    if (f === "novo") {
      setForm(vazio);
      setEditando("novo");
      return;
    }
    setForm({ nome: f.nome, documento: mascaraDocumento(f.documento ?? "", "pj"), contato: f.contato ?? "", telefone: mascaraTelefone(f.telefone ?? ""), whatsapp: mascaraTelefone(f.whatsapp ?? ""), email: f.email ?? "", prazoEntregaDias: f.prazoEntregaDias?.toString() ?? "", notas: f.notas ?? "" });
    setEditando(f.id);
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarFornecedor(editando === "novo" ? null : editando, { ...form, prazoEntregaDias: form.prazoEntregaDias === "" ? null : form.prazoEntregaDias });
      if (!r.ok) {
        setErros(r.campos ?? {});
        return void toast.error(r.erro);
      }
      toast.success("Fornecedor salvo");
      setEditando(null);
      router.refresh();
    });
  }

  function excluir(id: string) {
    iniciar(async () => {
      await excluirCadastro("fornecedor", [id]);
      setEditando(null);
      toast("Fornecedor excluído", { duration: 8000, action: { label: "Desfazer", onClick: async () => { await excluirCadastro("fornecedor", [id], true); router.refresh(); } } });
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">A lista de compras automática é agrupada por fornecedor e enviada pelo WhatsApp.</p>
        {podeEditar ? (
          <Button onClick={() => abrir("novo")} className="shrink-0">
            <Plus /> Novo fornecedor
          </Button>
        ) : null}
      </div>
      <Card className="overflow-hidden">
        {fornecedores.length === 0 ? (
          <EmptyState icone={<Truck />} titulo="Cadastre seus fornecedores" descricao="Distribuidoras de peças e gás. Ligados aos produtos, eles organizam a lista de compras." acoes={podeEditar ? <Button onClick={() => abrir("novo")}><Plus /> Novo fornecedor</Button> : null} />
        ) : (
          <ul className="divide-y divide-border">
            {fornecedores.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-3 text-fg-muted">
                  <Truck className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{f.nome}</p>
                  <p className="truncate text-xs text-fg-subtle">
                    {[f.contato, telefone(f.whatsapp ?? f.telefone), f.prazoEntregaDias !== null ? `entrega em ${f.prazoEntregaDias} dia(s)` : null, `${f.produtos} produto(s)`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <BotaoWhatsApp fone={f.whatsapp} somenteIcone rotulo={`WhatsApp de ${f.nome}`} />
                {podeEditar ? (
                  <Button variant="ghost" size="icon-sm" onClick={() => abrir(f)} aria-label={`Editar ${f.nome}`}>
                    <Pencil />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Sheet open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <SheetContent
          titulo={editando === "novo" ? "Novo fornecedor" : "Editar fornecedor"}
          rodape={
            <>
              {editando && editando !== "novo" ? (
                <Button variant="ghost" className="mr-auto text-danger" onClick={() => excluir(editando)}>
                  <Trash2 /> Excluir
                </Button>
              ) : (
                <Button variant="ghost" className="mr-auto" onClick={() => setEditando(null)}>Cancelar</Button>
              )}
              <Button onClick={salvar} carregando={pendente}>Salvar</Button>
            </>
          }
        >
          <form className="grid grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
            <Field label="Nome" htmlFor="fo-nome" obrigatorio erro={erros.nome} className="col-span-2">
              <Input id="fo-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Field>
            <Field label="CNPJ" htmlFor="fo-doc" className="col-span-2 sm:col-span-1">
              <Input id="fo-doc" inputMode="numeric" value={form.documento} onChange={(e) => setForm({ ...form, documento: mascaraDocumento(e.target.value, "pj") })} />
            </Field>
            <Field label="Vendedor / contato" htmlFor="fo-contato" className="col-span-2 sm:col-span-1">
              <Input id="fo-contato" value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
            </Field>
            <Field label="WhatsApp" htmlFor="fo-whats" erro={erros.whatsapp}>
              <Input id="fo-whats" inputMode="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: mascaraTelefone(e.target.value) })} />
            </Field>
            <Field label="Telefone" htmlFor="fo-tel" erro={erros.telefone}>
              <Input id="fo-tel" inputMode="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: mascaraTelefone(e.target.value) })} />
            </Field>
            <Field label="E-mail" htmlFor="fo-email" erro={erros.email}>
              <Input id="fo-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Prazo de entrega (dias)" htmlFor="fo-prazo">
              <Input id="fo-prazo" inputMode="numeric" value={form.prazoEntregaDias} onChange={(e) => setForm({ ...form, prazoEntregaDias: e.target.value.replace(/\D/g, "") })} />
            </Field>
            <Field label="Notas" htmlFor="fo-notas" className="col-span-2">
              <Textarea id="fo-notas" rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </Field>
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Salvar</button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

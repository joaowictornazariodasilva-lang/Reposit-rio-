"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Minus, Pencil, UserPlus } from "lucide-react";
import { salvarUsuario, type UsuarioInput } from "@/server/actions/configuracoes";
import type { Perfil } from "@/server/db/schema";
import { NOME_PERFIL, pode, type Permissao } from "@/lib/permissions";
import { iniciais, telefone } from "@/lib/format";
import { mascaraTelefone } from "@/lib/mascaras";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, NativeSelect } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type Usuario = { id: string; nome: string; email: string; perfil: Perfil; telefone: string | null; cor: string | null; comissaoPct: number; ativo: boolean };
type Form = { nome: string; email: string; perfil: Perfil; telefone: string; comissaoPct: string; cor: string; senha: string; ativo: boolean };

const RESUMO: { rotulo: string; p: Permissao }[] = [
  { rotulo: "Ver e editar clientes", p: "clientes.editar" },
  { rotulo: "Excluir clientes", p: "clientes.excluir" },
  { rotulo: "Editar serviços e preços", p: "cadastros.editar" },
  { rotulo: "Ver custos e margens", p: "custos.ver" },
  { rotulo: "Financeiro", p: "financeiro.ver" },
  { rotulo: "Relatórios", p: "relatorios.ver" },
  { rotulo: "Importar planilhas", p: "importar" },
  { rotulo: "Gerenciar equipe", p: "equipe.gerenciar" },
];
const PERFIS: Perfil[] = ["admin", "financeiro", "atendimento", "tecnico"];

export function ListaEquipe({ usuarios, eu }: { usuarios: Usuario[]; eu: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState<string | "novo" | null>(null);
  const [f, setF] = useState<Form>({ nome: "", email: "", perfil: "tecnico", telefone: "", comissaoPct: "0", cor: "#0891B2", senha: "", ativo: true });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();

  function abrir(u: Usuario | "novo") {
    setErros({});
    if (u === "novo") {
      setF({ nome: "", email: "", perfil: "tecnico", telefone: "", comissaoPct: "10", cor: "#0891B2", senha: "", ativo: true });
      setEditando("novo");
      return;
    }
    setF({ nome: u.nome, email: u.email, perfil: u.perfil, telefone: mascaraTelefone(u.telefone ?? ""), comissaoPct: String(u.comissaoPct), cor: u.cor ?? "#0891B2", senha: "", ativo: u.ativo });
    setEditando(u.id);
  }

  function salvar() {
    iniciar(async () => {
      const dados: UsuarioInput = { ...f, comissaoPct: f.comissaoPct.replace(",", ".") };
      const r = await salvarUsuario(editando === "novo" ? null : editando, dados);
      if (!r.ok) {
        setErros(r.campos ?? {});
        return void toast.error(r.erro);
      }
      toast.success(editando === "novo" ? "Usuário criado" : "Usuário atualizado", { description: editando === "novo" ? "Envie o e-mail e a senha inicial para a pessoa." : undefined });
      setEditando(null);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="overflow-hidden">
        <CardHeader
          titulo={`${usuarios.filter((u) => u.ativo).length} pessoas com acesso`}
          descricao="Cada perfil vê só o que precisa."
          acao={
            <Button size="sm" onClick={() => abrir("novo")}>
              <UserPlus /> Adicionar
            </Button>
          }
        />
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {usuarios.map((u) => (
            <li key={u.id} className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${u.ativo ? "" : "opacity-50"}`}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-fg" style={{ boxShadow: `inset 0 0 0 2px ${u.cor ?? "#5e6e75"}` }} aria-hidden>
                {iniciais(u.nome)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-medium">
                  {u.nome} {u.id === eu ? <Badge tom="contorno">você</Badge> : null} {!u.ativo ? <Badge>inativo</Badge> : null}
                </p>
                <p className="truncate text-xs text-fg-subtle">
                  {u.email}
                  {u.telefone ? ` · ${telefone(u.telefone)}` : ""}
                  {u.comissaoPct ? ` · comissão ${u.comissaoPct.toLocaleString("pt-BR")}%` : ""}
                </p>
              </div>
              <Badge tom={u.perfil === "admin" ? "primario" : u.perfil === "tecnico" ? "info" : "neutro"}>{NOME_PERFIL[u.perfil]}</Badge>
              <Button variant="ghost" size="icon-sm" onClick={() => abrir(u)} aria-label={`Editar ${u.nome}`}>
                <Pencil />
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader titulo="O que cada perfil pode fazer" />
        <CardBody className="overflow-x-auto pt-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-fg-subtle">
                <th className="py-1.5 text-left font-medium"><span className="sr-only">Permissão</span></th>
                {PERFIS.map((p) => (
                  <th key={p} className="px-1 py-1.5 font-medium">{NOME_PERFIL[p].slice(0, 5)}.</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESUMO.map((r) => (
                <tr key={r.p} className="border-t border-border">
                  <td className="py-2 pr-2 text-fg-muted">{r.rotulo}</td>
                  {PERFIS.map((p) => (
                    <td key={p} className="px-1 py-2 text-center">
                      {pode(p, r.p) ? <Check className="mx-auto size-4 text-success" aria-label="sim" /> : <Minus className="mx-auto size-4 text-fg-subtle" aria-label="não" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-2xs text-fg-subtle">O técnico vê apenas clientes, aparelhos, as próprias OS e a agenda — sem valores de custo nem financeiro.</p>
        </CardBody>
      </Card>

      <Sheet open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <SheetContent
          titulo={editando === "novo" ? "Adicionar pessoa" : "Editar acesso"}
          rodape={
            <>
              <Button variant="ghost" className="mr-auto" onClick={() => setEditando(null)}>Cancelar</Button>
              <Button onClick={salvar} carregando={pendente}>Salvar</Button>
            </>
          }
        >
          <form className="grid grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
            <Field label="Nome" htmlFor="us-nome" obrigatorio erro={erros.nome} className="col-span-2">
              <Input id="us-nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
            </Field>
            <Field label="E-mail de acesso" htmlFor="us-email" obrigatorio erro={erros.email} className="col-span-2">
              <Input id="us-email" type="email" autoComplete="off" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </Field>
            <Field label="Perfil" htmlFor="us-perfil" className="col-span-2 sm:col-span-1">
              <NativeSelect id="us-perfil" value={f.perfil} onChange={(e) => setF({ ...f, perfil: e.target.value as Perfil })}>
                {PERFIS.map((p) => <option key={p} value={p}>{NOME_PERFIL[p]}</option>)}
              </NativeSelect>
            </Field>
            <Field label="WhatsApp" htmlFor="us-tel" className="col-span-2 sm:col-span-1">
              <Input id="us-tel" inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: mascaraTelefone(e.target.value) })} />
            </Field>
            <Field label="Comissão (%)" htmlFor="us-com" hint="Sobre serviços executados/vendidos">
              <Input id="us-com" inputMode="decimal" value={f.comissaoPct} onChange={(e) => setF({ ...f, comissaoPct: e.target.value.replace(/[^\d,.]/g, "") })} />
            </Field>
            <Field label="Cor na agenda" htmlFor="us-cor">
              <Input id="us-cor" type="color" value={f.cor} onChange={(e) => setF({ ...f, cor: e.target.value })} className="p-1" />
            </Field>
            <Field label={editando === "novo" ? "Senha inicial" : "Nova senha"} htmlFor="us-senha" obrigatorio={editando === "novo"} erro={erros.senha} hint={editando === "novo" ? "Mínimo 8 caracteres" : "Deixe vazio para manter a atual"} className="col-span-2">
              <Input id="us-senha" type="password" autoComplete="new-password" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
            </Field>
            {editando !== "novo" ? (
              <label htmlFor="us-ativo" className="col-span-2 flex min-h-11 items-center justify-between rounded-md border border-border px-3">
                <span className="text-sm">Acesso ativo</span>
                <Switch id="us-ativo" checked={f.ativo} onCheckedChange={(c) => setF({ ...f, ativo: c })} disabled={editando === eu} />
              </label>
            ) : null}
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">Salvar</button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

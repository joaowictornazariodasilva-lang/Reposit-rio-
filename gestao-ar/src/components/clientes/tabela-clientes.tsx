"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AirVent, Building2, Download, MoreHorizontal, Tag, Trash2, X } from "lucide-react";
import type { LinhaCliente } from "@/server/queries/clientes";
import { adicionarTag, excluirClientes, restaurarClientes } from "@/server/actions/clientes";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BotaoWhatsApp } from "@/components/whatsapp";
import { dataCurta, documento, iniciais, moeda, relativo, telefone } from "@/lib/format";
import { primeiroNome } from "@/lib/br";
import { cn } from "@/lib/utils";

export function TabelaClientes({ linhas, podeExcluir, podeEditar }: { linhas: LinhaCliente[]; podeExcluir: boolean; podeEditar: boolean }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [tagAberto, setTagAberto] = useState(false);
  const [tag, setTag] = useState("");
  const [pendente, iniciar] = useTransition();

  const todos = linhas.length > 0 && linhas.every((l) => sel.has(l.id));
  const alguns = !todos && linhas.some((l) => sel.has(l.id));
  const alternar = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  function excluir(ids: string[]) {
    iniciar(async () => {
      const r = await excluirClientes(ids);
      if (!r.ok) return void toast.error(r.erro);
      setSel(new Set());
      toast(`${r.quantidade} ${r.quantidade === 1 ? "cliente excluído" : "clientes excluídos"}`, {
        duration: 8000,
        action: {
          label: "Desfazer",
          onClick: async () => {
            const d = await restaurarClientes(ids);
            if (d.ok) toast.success("Exclusão desfeita");
            router.refresh();
          },
        },
      });
      router.refresh();
    });
  }

  function aplicarTag() {
    iniciar(async () => {
      const r = await adicionarTag([...sel], tag);
      if (!r.ok) return void toast.error(r.erro);
      toast.success(`Etiqueta “${tag}” adicionada a ${r.quantidade} cliente(s)`);
      setTagAberto(false);
      setTag("");
      setSel(new Set());
      router.refresh();
    });
  }

  return (
    <div className="relative">
      {/* Barra de ações em massa */}
      {sel.size > 0 ? (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 border-b border-border bg-primary-soft px-4 py-2 text-primary-soft-fg animate-fade-in" role="region" aria-label="Ações em massa">
          <span className="text-sm font-medium">{sel.size} selecionado(s)</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {podeEditar ? (
              <Button size="sm" variant="secondary" onClick={() => setTagAberto(true)}>
                <Tag /> Etiqueta
              </Button>
            ) : null}
            <Button size="sm" variant="secondary" asChild>
              <a href={`/api/exportar/clientes?ids=${[...sel].join(",")}`} download>
                <Download /> Exportar
              </a>
            </Button>
            {podeExcluir ? (
              <Button size="sm" variant="secondary" className="text-danger" onClick={() => excluir([...sel])} disabled={pendente}>
                <Trash2 /> Excluir
              </Button>
            ) : null}
            <Button size="icon-sm" variant="ghost" onClick={() => setSel(new Set())} aria-label="Limpar seleção">
              <X />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Desktop: tabela */}
      <div className="hidden md:block">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-border bg-surface-2 text-left text-2xs font-medium uppercase tracking-wider text-fg-subtle">
            <tr>
              <th className="w-12 py-2.5 pl-4">
                <Checkbox checked={todos ? true : alguns ? "indeterminate" : false} onCheckedChange={(c) => setSel(c ? new Set(linhas.map((l) => l.id)) : new Set())} aria-label="Selecionar todos da página" />
              </th>
              <th className="w-[34%] py-2.5 pr-3 font-medium">Cliente</th>
              <th className="w-[16%] py-2.5 pr-3 font-medium">Contato</th>
              <th className="w-[15%] py-2.5 pr-3 font-medium">Bairro</th>
              <th className="w-[10%] py-2.5 pr-3 text-right font-medium">Aparelhos</th>
              <th className="w-[15%] py-2.5 pr-3 font-medium">Último serviço</th>
              <th className="hidden w-[11%] py-2.5 pr-3 text-right font-medium xl:table-cell">Total</th>
              <th className="w-24 py-2.5 pr-4"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const nome = l.nomeFantasia ?? l.nome;
              const msg = `Olá, ${primeiroNome(l.tipo === "pf" ? l.nome : nome)}! Tudo bem?`;
              return (
                <tr key={l.id} className={cn("group border-b border-border last:border-0 hover:bg-surface-2", sel.has(l.id) && "bg-primary-soft/40")}>
                  <td className="py-3 pl-4">
                    <Checkbox checked={sel.has(l.id)} onCheckedChange={() => alternar(l.id)} aria-label={`Selecionar ${nome}`} />
                  </td>
                  <td className="py-3 pr-3">
                    <Link href={`/clientes/${l.id}`} className="flex items-center gap-3 rounded outline-offset-4">
                      <Avatar nome={nome} pj={l.tipo === "pj"} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-fg group-hover:text-primary">{nome}</span>
                        <span className="block truncate text-xs text-fg-subtle">
                          nº {l.codigo}
                          {l.documento ? ` · ${documento(l.documento)}` : ""}
                        </span>
                      </span>
                    </Link>
                    {l.tags.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1 pl-12">
                        {l.tags.slice(0, 3).map((t) => (
                          <Badge key={t} tom={t === "VIP" ? "acento" : t === "Contrato" ? "primario" : "neutro"}>
                            {t}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="truncate py-3 pr-3 text-fg-muted">{telefone(l.whatsapp ?? l.telefone) || "—"}</td>
                  <td className="py-3 pr-3 text-fg-muted">
                    {l.bairro ?? "—"}
                    {l.cidade && l.cidade !== "Fortaleza" ? <span className="block text-xs text-fg-subtle">{l.cidade}</span> : null}
                  </td>
                  <td className="tabular py-3 pr-3 text-right">{l.qtdEquip || <span className="text-fg-subtle">0</span>}</td>
                  <td className="py-3 pr-3 text-fg-muted">
                    {l.ultimoServico ? (
                      <>
                        {dataCurta(l.ultimoServico)}
                        <span className="block text-xs text-fg-subtle">{relativo(l.ultimoServico)}</span>
                      </>
                    ) : (
                      <span className="text-fg-subtle">Nunca atendido</span>
                    )}
                  </td>
                  <td className="tabular hidden py-3 pr-3 text-right text-fg-muted xl:table-cell">{l.totalGasto ? moeda(l.totalGasto) : "—"}</td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-1">
                      <BotaoWhatsApp fone={l.whatsapp} texto={msg} somenteIcone rotulo={`WhatsApp de ${nome}`} />
                      <MenuLinha id={l.id} nome={nome} podeExcluir={podeExcluir} podeEditar={podeEditar} excluir={() => excluir([l.id])} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Celular: cartões */}
      <ul className="divide-y divide-border md:hidden">
        {linhas.map((l) => {
          const nome = l.nomeFantasia ?? l.nome;
          return (
            <li key={l.id} className={cn("flex items-center gap-3 px-4 py-3", sel.has(l.id) && "bg-primary-soft/40")}>
              <Checkbox checked={sel.has(l.id)} onCheckedChange={() => alternar(l.id)} aria-label={`Selecionar ${nome}`} />
              <Link href={`/clientes/${l.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar nome={nome} pj={l.tipo === "pj"} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{nome}</span>
                  <span className="block truncate text-xs text-fg-subtle">
                    {l.bairro ?? "Sem endereço"} · {l.qtdEquip} {l.qtdEquip === 1 ? "aparelho" : "aparelhos"}
                  </span>
                </span>
              </Link>
              <BotaoWhatsApp fone={l.whatsapp} texto={`Olá, ${primeiroNome(nome)}! Tudo bem?`} somenteIcone rotulo={`WhatsApp de ${nome}`} />
            </li>
          );
        })}
      </ul>

      <Dialog open={tagAberto} onOpenChange={setTagAberto}>
        <DialogContent
          titulo="Adicionar etiqueta"
          descricao={`Aplica a etiqueta aos ${sel.size} cliente(s) selecionado(s).`}
          rodape={
            <>
              <Button variant="ghost" onClick={() => setTagAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={aplicarTag} carregando={pendente} disabled={!tag.trim()}>
                Aplicar
              </Button>
            </>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tag.trim()) aplicarTag();
            }}
          >
            <Input autoFocus value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ex.: VIP, Contrato, Inadimplente" aria-label="Etiqueta" />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuLinha({ id, nome, podeExcluir, podeEditar, excluir }: { id: string; nome: string; podeExcluir: boolean; podeEditar: boolean; excluir: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Mais ações para ${nome}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <Link href={`/clientes/${id}`}>Abrir ficha</Link>
        </DropdownMenuItem>
        {podeEditar ? (
          <DropdownMenuItem asChild>
            <Link href={`/clientes/${id}?novo=equipamento&cliente=${id}`}>
              <AirVent /> Cadastrar aparelho
            </Link>
          </DropdownMenuItem>
        ) : null}
        {podeExcluir ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem perigo onSelect={excluir}>
              <Trash2 /> Excluir
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Avatar({ nome, pj, className }: { nome: string; pj?: boolean; className?: string }) {
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-fg-muted", pj && "rounded-md", className)} aria-hidden>
      {pj ? <Building2 className="size-4" /> : iniciais(nome)}
    </span>
  );
}

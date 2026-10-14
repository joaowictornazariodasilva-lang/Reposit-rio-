"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Dialog as D } from "radix-ui";
import { AirVent, ArrowRight, ClipboardList, CornerDownLeft, Loader2, Package, Search, Users } from "lucide-react";
import type { ResultadoBusca } from "@/server/queries/busca";
import { Kbd } from "@/components/ui/kbd";
import { IconeNav } from "./icone";

export type AcaoPaleta = { id: string; rotulo: string; icone: string; href: string; atalho?: string; palavras?: string };

const ICONE_GRUPO = { Clientes: Users, Equipamentos: AirVent, Produtos: Package, "Ordens de serviço": ClipboardList } as const;

export function CommandPalette({ aberto, setAberto, acoes, navegacao }: { aberto: boolean; setAberto: (v: boolean) => void; acoes: AcaoPaleta[]; navegacao: AcaoPaleta[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const controle = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!aberto) {
      setQ("");
      setResultados([]);
    }
  }, [aberto]);

  useEffect(() => {
    const termo = q.trim();
    if (termo.length < 2) {
      setResultados([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const t = setTimeout(async () => {
      controle.current?.abort();
      const c = new AbortController();
      controle.current = c;
      try {
        const r = await fetch(`/api/busca?q=${encodeURIComponent(termo)}`, { signal: c.signal });
        if (r.ok) setResultados(((await r.json()) as { resultados: ResultadoBusca[] }).resultados);
      } catch {
        /* cancelada */
      } finally {
        if (!c.signal.aborted) setBuscando(false);
      }
    }, 160);
    return () => clearTimeout(t);
  }, [q]);

  function ir(href: string) {
    setAberto(false);
    router.push(href);
  }

  const grupos = resultados.reduce<Record<string, ResultadoBusca[]>>((acc, r) => {
    (acc[r.grupo] ??= []).push(r);
    return acc;
  }, {});

  const item = "flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-fg data-[selected=true]:bg-primary-soft data-[selected=true]:text-primary-soft-fg [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-subtle data-[selected=true]:[&_svg]:text-primary-soft-fg";
  const titulo = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-subtle";

  return (
    <D.Root open={aberto} onOpenChange={setAberto}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fade-in" />
        <D.Content className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-xl outline-none sm:top-[12vh] sm:px-4" aria-describedby={undefined}>
          <D.Title className="sr-only">Busca e ações rápidas</D.Title>
          <Command label="Busca global" shouldFilter={true} loop className="overflow-hidden border-border bg-surface shadow-lg data-[state=open]:animate-pop-in max-sm:min-h-dvh sm:rounded-xl sm:border">
            <div className="flex items-center gap-3 border-b border-border px-4">
              {buscando ? <Loader2 className="size-4 animate-spin text-fg-subtle" /> : <Search className="size-4 text-fg-subtle" />}
              <Command.Input
                value={q}
                onValueChange={setQ}
                placeholder="Buscar cliente, aparelho, produto, nº da OS ou ação…"
                className="h-14 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle sm:text-sm"
              />
              <D.Close className="text-xs text-fg-subtle hover:text-fg" aria-label="Fechar">
                <Kbd>Esc</Kbd>
              </D.Close>
            </div>
            <Command.List className="max-h-[min(60vh,440px)] overflow-y-auto p-2 max-sm:max-h-[calc(100dvh-7rem)]">
              <Command.Empty className="px-3 py-10 text-center text-sm text-fg-muted">
                {buscando ? "Buscando…" : q.trim().length < 2 ? "Digite ao menos 2 letras." : "Nada encontrado. Tente o telefone, CPF/CNPJ ou o nº de série."}
              </Command.Empty>

              {Object.entries(grupos).map(([g, itens]) => {
                const I = ICONE_GRUPO[g as keyof typeof ICONE_GRUPO];
                return (
                  <Command.Group key={g} heading={g} className={titulo}>
                    {itens.map((r) => (
                      <Command.Item key={r.id} value={`${r.grupo}-${r.id}-${q}`} keywords={[q]} onSelect={() => ir(r.href)} className={item}>
                        <I />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{r.titulo}</span>
                          <span className="block truncate text-xs text-fg-subtle">{r.detalhe}</span>
                        </span>
                        <CornerDownLeft className="opacity-0 [[data-selected=true]_&]:opacity-100" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}

              <Command.Group heading="Ações" className={titulo}>
                {acoes.map((a) => (
                  <Command.Item key={a.id} value={`acao ${a.rotulo} ${a.palavras ?? ""}`} onSelect={() => ir(a.href)} className={item}>
                    <IconeNav nome={a.icone} />
                    <span className="flex-1">{a.rotulo}</span>
                    {a.atalho ? <Atalho seq={a.atalho} /> : null}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Ir para" className={titulo}>
                {navegacao.map((a) => (
                  <Command.Item key={a.id} value={`ir ${a.rotulo} ${a.palavras ?? ""}`} onSelect={() => ir(a.href)} className={item}>
                    <IconeNav nome={a.icone} />
                    <span className="flex-1">{a.rotulo}</span>
                    {a.atalho ? <Atalho seq={a.atalho} /> : <ArrowRight className="opacity-0 [[data-selected=true]_&]:opacity-100" />}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
            <div className="hidden items-center gap-4 border-t border-border bg-surface-2 px-4 py-2 text-2xs text-fg-subtle sm:flex">
              <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navegar</span>
              <span className="flex items-center gap-1"><Kbd>Enter</Kbd> abrir</span>
              <span className="ml-auto flex items-center gap-1"><Kbd>?</Kbd> todos os atalhos</span>
            </div>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export function Atalho({ seq }: { seq: string }) {
  return (
    <span className="hidden items-center gap-1 sm:flex">
      {seq.split(" ").map((k, i) => (
        <Kbd key={i}>{k.toUpperCase()}</Kbd>
      ))}
    </span>
  );
}

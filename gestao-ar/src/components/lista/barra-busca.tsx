"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Busca que atualiza a URL (filtros compartilháveis e "voltar" funcionando). */
export function BarraBusca({ placeholder, className, param = "q" }: { placeholder: string; className?: string; param?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [valor, setValor] = useState(params.get(param) ?? "");
  const [pendente, iniciar] = useTransition();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValor(params.get(param) ?? "");
  }, [params, param]);

  useEffect(() => {
    const atual = params.get(param) ?? "";
    if (valor === atual) return;
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (valor) sp.set(param, valor);
      else sp.delete(param);
      sp.delete("pagina");
      iniciar(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }));
    }, 250);
    return () => clearTimeout(t);
  }, [valor, params, param, pathname, router]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
      <Input ref={ref} type="search" value={valor} onChange={(e) => setValor(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="pl-9 pr-9" />
      <span className="absolute right-1 top-1/2 -translate-y-1/2">
        {pendente ? (
          <Loader2 className="mr-2 size-4 animate-spin text-fg-subtle" aria-label="Buscando" />
        ) : valor ? (
          <button
            type="button"
            onClick={() => {
              setValor("");
              ref.current?.focus();
            }}
            className="grid size-9 place-items-center rounded text-fg-subtle hover:text-fg sm:size-7"
            aria-label="Limpar busca"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
}

/** Pílulas de filtro (atalhos de filtros salvos). */
export function FiltroPilulas({ param, opcoes, className }: { param: string; opcoes: { valor: string; rotulo: string; contador?: number }[]; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const atual = params.get(param) ?? "";
  return (
    <div className={cn("-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0", className)} role="group" aria-label="Filtros rápidos">
      {opcoes.map((o) => {
        const ativo = atual === o.valor;
        return (
          <button
            key={o.valor || "todos"}
            type="button"
            aria-pressed={ativo}
            onClick={() => {
              const sp = new URLSearchParams(params.toString());
              if (o.valor) sp.set(param, o.valor);
              else sp.delete(param);
              sp.delete("pagina");
              router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
            }}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg sm:h-8",
              ativo && "border-fg bg-fg text-bg hover:border-fg hover:text-bg",
            )}
          >
            {o.rotulo}
            {o.contador !== undefined ? <span className={cn("tabular rounded-full px-1.5 text-2xs", ativo ? "bg-bg/20" : "bg-surface-3")}>{o.contador}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

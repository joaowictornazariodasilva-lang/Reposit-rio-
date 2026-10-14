"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Plus } from "lucide-react";
import type { ItemNav } from "@/lib/navegacao";
import { cn } from "@/lib/utils";
import { Logo, LogoMarca } from "@/components/brand/logo";
import { Tooltip } from "@/components/ui/tooltip";
import { IconeNav } from "./icone";

export type GrupoNav = { grupo: string; itens: ItemNav[] };

export function ativo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLista({ grupos, recolhido, aoNavegar }: { grupos: GrupoNav[]; recolhido: boolean; aoNavegar?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-5">
      {grupos.map((g) => (
        <div key={g.grupo}>
          <p className={cn("mb-1 px-3 text-2xs font-medium uppercase tracking-wider text-fg-subtle", recolhido && "sr-only")}>{g.grupo}</p>
          <ul className="grid gap-0.5">
            {g.itens.map((item) => {
              const a = ativo(pathname, item.href);
              const link = (
                <Link
                  href={item.href}
                  onClick={aoNavegar}
                  aria-current={a ? "page" : undefined}
                  className={cn(
                    "group relative flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-fg-muted transition-colors duration-150 hover:bg-surface-3 hover:text-fg lg:h-9",
                    a && "bg-primary-soft text-primary-soft-fg hover:bg-primary-soft hover:text-primary-soft-fg",
                    recolhido && "justify-center px-0",
                  )}
                >
                  {a ? <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" aria-hidden /> : null}
                  <IconeNav nome={item.icone} className="size-[18px] shrink-0" />
                  <span className={cn("flex-1 truncate", recolhido && "sr-only")}>{item.rotulo}</span>
                  {item.passo && !recolhido ? (
                    <span className="rounded px-1 text-[10px] font-medium text-fg-subtle ring-1 ring-border" title={`Chega no passo ${item.passo}`}>
                      em breve
                    </span>
                  ) : null}
                </Link>
              );
              return (
                <li key={item.href}>
                  {recolhido ? (
                    <Tooltip conteudo={item.passo ? `${item.rotulo} · em breve` : item.rotulo} lado="right">
                      {link}
                    </Tooltip>
                  ) : (
                    link
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({
  grupos,
  recolhido,
  alternar,
  empresa,
  podeCriarOs,
}: {
  grupos: GrupoNav[];
  recolhido: boolean;
  alternar: () => void;
  empresa: { nome: string; logo: string | null };
  podeCriarOs: boolean;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-out lg:flex",
        recolhido ? "w-[72px]" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center px-4", recolhido && "justify-center px-0")}>
        <Link href="/" className="min-w-0 rounded-md" aria-label={`${empresa.nome} — início`}>
          {recolhido ? (empresa.logo ? <Logo nome="" sub="" logoUrl={empresa.logo} /> : <LogoMarca />) : <Logo nome={empresa.nome} logoUrl={empresa.logo} />}
        </Link>
      </div>

      {podeCriarOs ? (
        <div className={cn("px-3 pb-4", recolhido && "px-3.5")}>
          {recolhido ? (
            <Tooltip conteudo="Nova ordem de serviço" lado="right">
              <Link href="/ordens/nova" className="grid size-11 place-items-center rounded-md bg-accent text-accent-fg shadow-sm transition-colors hover:bg-accent-hover" aria-label="Nova ordem de serviço">
                <Plus className="size-5" />
              </Link>
            </Tooltip>
          ) : (
            <Link href="/ordens/nova" className="flex h-10 items-center justify-center gap-2 rounded-md bg-accent text-sm font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover">
              <Plus className="size-4" /> Nova ordem de serviço
            </Link>
          )}
        </div>
      ) : null}

      <div className={cn("flex-1 overflow-y-auto px-3 pb-4", recolhido && "px-3.5")}>
        <NavLista grupos={grupos} recolhido={recolhido} />
      </div>

      <div className={cn("border-t border-border p-3", recolhido && "flex justify-center")}>
        <button
          type="button"
          onClick={alternar}
          className={cn("flex h-9 w-full items-center gap-2 rounded-md px-3 text-xs font-medium text-fg-subtle hover:bg-surface-3 hover:text-fg", recolhido && "w-11 justify-center px-0")}
          aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
          title="Alternar menu ( [ )"
        >
          {recolhido ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!recolhido && "Recolher menu"}
        </button>
      </div>
    </aside>
  );
}

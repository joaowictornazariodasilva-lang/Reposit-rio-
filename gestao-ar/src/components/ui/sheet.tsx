"use client";

import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Painel lateral (drawer) — usado para criar/editar sem sair da tela. */
export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetClose = D.Close;

export function SheetContent({
  titulo,
  descricao,
  children,
  rodape,
  className,
  lado = "direita",
}: {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  className?: string;
  lado?: "direita" | "esquerda";
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fade-in" />
      <D.Content
        className={cn(
          "fixed inset-y-0 z-50 flex w-full flex-col bg-surface shadow-lg outline-none sm:max-w-lg",
          lado === "direita" ? "right-0 border-l border-border data-[state=open]:animate-slide-in-right" : "left-0 border-r border-border data-[state=open]:animate-slide-in-left",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <D.Title className="text-base font-semibold text-fg">{titulo}</D.Title>
            {descricao ? <D.Description className="mt-0.5 text-xs text-fg-subtle">{descricao}</D.Description> : <D.Description className="sr-only">{titulo}</D.Description>}
          </div>
          <D.Close className="-mr-2 -mt-1 grid size-10 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg" aria-label="Fechar">
            <X className="size-4" />
          </D.Close>
        </header>
        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {rodape ? <footer className="flex items-center justify-end gap-2 border-t border-border bg-surface-2 px-5 py-3">{rodape}</footer> : null}
      </D.Content>
    </D.Portal>
  );
}

"use client";

import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  titulo,
  descricao,
  children,
  rodape,
  className,
}: {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  children?: React.ReactNode;
  rodape?: React.ReactNode;
  className?: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fade-in" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-surface shadow-lg outline-none data-[state=open]:animate-fade-in",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <D.Title className="text-base font-semibold text-fg">{titulo}</D.Title>
            {descricao ? <D.Description className="mt-1 text-sm text-fg-muted">{descricao}</D.Description> : <D.Description className="sr-only">{titulo}</D.Description>}
          </div>
          <D.Close className="-mr-2 -mt-2 grid size-10 place-items-center rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg" aria-label="Fechar">
            <X className="size-4" />
          </D.Close>
        </header>
        {children ? <div className="relative min-h-0 overflow-y-auto px-5 py-4">{children}</div> : null}
        {rodape ? <footer className="flex justify-end gap-2 px-5 pb-5 pt-1">{rodape}</footer> : null}
      </D.Content>
    </D.Portal>
  );
}

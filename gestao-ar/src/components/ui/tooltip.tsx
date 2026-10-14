"use client";

import { Tooltip as T } from "radix-ui";

export const TooltipProvider = T.Provider;

export function Tooltip({ conteudo, children, lado = "top" }: { conteudo: React.ReactNode; children: React.ReactNode; lado?: "top" | "right" | "bottom" | "left" }) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={lado} sideOffset={6} className="z-50 rounded-md bg-fg px-2 py-1 text-2xs font-medium text-bg shadow-md data-[state=delayed-open]:animate-fade-in">
          {conteudo}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}

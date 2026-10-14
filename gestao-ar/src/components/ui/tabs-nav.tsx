"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Abas que são rotas (compartilháveis, voltar funciona). */
export function TabsNav({ abas, className }: { abas: { href: string; rotulo: string; contador?: number; exato?: boolean }[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Seções" className={cn("-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}>
      <ul className="flex min-w-max gap-1 border-b border-border">
        {abas.map((a) => {
          const ativa = a.exato ? pathname === a.href : pathname === a.href || pathname.startsWith(`${a.href}/`);
          return (
            <li key={a.href}>
              <Link
                href={a.href}
                aria-current={ativa ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-2 px-3 text-sm font-medium text-fg-muted transition-colors hover:text-fg",
                  ativa && "text-fg after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-primary",
                )}
              >
                {a.rotulo}
                {a.contador !== undefined ? <span className="tabular rounded-full bg-surface-3 px-1.5 text-2xs text-fg-muted">{a.contador}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

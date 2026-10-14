import { cn } from "@/lib/utils";

/**
 * Marca: três linhas de fluxo de ar saindo de uma aleta — leitura imediata de
 * "climatização" sem floco de neve clichê.
 */
export function LogoMarca({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path d="M8 10.5h11.5a3 3 0 1 0-3-3" className="stroke-primary-fg" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M8 16h16a3 3 0 1 1-3 3" className="stroke-primary-fg" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M8 21.5h7" className="stroke-accent" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ nome = "Brisa", sub = "Gestão", className, logoUrl }: { nome?: string; sub?: string; className?: string; logoUrl?: string | null }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-8 rounded-[9px] object-contain" />
      ) : (
        <LogoMarca />
      )}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold tracking-tight text-fg">{nome}</span>
        <span className="text-2xs text-fg-subtle">{sub}</span>
      </span>
    </span>
  );
}

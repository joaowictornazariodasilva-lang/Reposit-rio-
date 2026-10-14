import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { numero } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Paginacao({ pagina, paginas, total, porPagina, href }: { pagina: number; paginas: number; total: number; porPagina: number; href: (p: number) => string }) {
  if (total === 0) return null;
  const de = (pagina - 1) * porPagina + 1;
  const ate = Math.min(total, pagina * porPagina);
  return (
    <nav className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-fg-muted" aria-label="Paginação">
      <span className="tabular">
        {numero(de)}–{numero(ate)} de {numero(total)}
      </span>
      {paginas > 1 ? (
        <div className="flex items-center gap-1">
          <Link aria-label="Página anterior" aria-disabled={pagina <= 1} tabIndex={pagina <= 1 ? -1 : undefined} href={href(Math.max(1, pagina - 1))} className={cn(buttonVariants({ variant: "secondary", size: "icon-sm" }), pagina <= 1 && "pointer-events-none opacity-40")}>
            <ChevronLeft />
          </Link>
          <span className="tabular px-2">
            {pagina} / {paginas}
          </span>
          <Link aria-label="Próxima página" aria-disabled={pagina >= paginas} tabIndex={pagina >= paginas ? -1 : undefined} href={href(Math.min(paginas, pagina + 1))} className={cn(buttonVariants({ variant: "secondary", size: "icon-sm" }), pagina >= paginas && "pointer-events-none opacity-40")}>
            <ChevronRight />
          </Link>
        </div>
      ) : null}
    </nav>
  );
}

export function hrefComParams(base: string, params: Record<string, string | undefined>, extra: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...extra })) if (v !== undefined && v !== "" && !(k === "pagina" && String(v) === "1")) sp.set(k, String(v));
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

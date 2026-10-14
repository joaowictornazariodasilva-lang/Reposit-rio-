import type { SituacaoLimpeza } from "@/lib/dominio";
import { dataCurta } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Assinatura visual do produto: régua de "temperatura" do ciclo de limpeza.
 * Começa fria (recém-limpo) e esquenta até a data da próxima limpeza.
 */
export function Termostato({ situacao, proxima, ultima }: { situacao: SituacaoLimpeza; proxima: string | null; ultima: string | Date | null }) {
  const ciclo = 182;
  const pct = situacao.dias === null ? 0 : Math.min(100, Math.max(0, ((ciclo - situacao.dias) / ciclo) * 100));
  const titulo =
    situacao.estado === "vencida" ? "Limpeza atrasada" : situacao.estado === "proxima" ? "Limpeza chegando" : situacao.estado === "em_dia" ? "Limpeza em dia" : "Sem histórico de limpeza";
  return (
    <div>
      <p className="text-2xs font-medium uppercase tracking-wider text-fg-subtle">Ciclo de limpeza</p>
      <p className={cn("mt-1 text-lg font-semibold", situacao.estado === "vencida" ? "text-accent" : situacao.estado === "proxima" ? "text-warning" : "text-fg")}>{titulo}</p>
      <div className="relative mt-4 h-2.5 rounded-full bg-gradient-to-r from-[#38bdd0] via-[#f5c26b] to-[#e8590c]" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label="Progresso do ciclo de limpeza de 6 meses">
        <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-fg shadow-md" style={{ left: `${pct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-2xs text-fg-subtle">
        <span>Última: {ultima ? dataCurta(ultima) : "—"}</span>
        <span>Próxima: {proxima ? dataCurta(proxima) : "—"}</span>
      </div>
      <p className="mt-3 text-xs text-fg-muted">{situacao.rotulo}. Recomendamos limpeza a cada 6 meses (uso residencial) ou 3 meses (comercial).</p>
    </div>
  );
}

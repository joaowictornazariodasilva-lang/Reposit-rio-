import Link from "next/link";
import { RotateCcw } from "lucide-react";
import type { CategoriaServico, StatusOs } from "@/server/db/schema";
import { Badge } from "@/components/ui/badge";
import { STATUS_OS } from "@/lib/dominio";
import { dataCurta, moeda } from "@/lib/format";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  numero: number;
  status: StatusOs;
  servico: string | null;
  categoria: CategoriaServico | null;
  abertaEm: Date;
  agendadaPara: Date | null;
  concluidaEm: Date | null;
  valorTotal: number;
  ehRetorno: boolean;
  tecnico: string | null;
  descricao?: string | null;
  aparelho?: string | null;
  href?: string;
};

const COR_CATEGORIA: Partial<Record<CategoriaServico, string>> = {
  instalacao: "bg-primary",
  higienizacao: "bg-[#38bdd0]",
  preventiva: "bg-[#38bdd0]",
  pmoc: "bg-[#38bdd0]",
  corretiva: "bg-accent",
  carga_gas: "bg-warning",
};

export function LinhaDoTempo({ itens, mostrarValor }: { itens: Item[]; mostrarValor: boolean }) {
  return (
    <ol className="relative grid gap-0">
      {itens.map((o, i) => {
        const data = o.concluidaEm ?? o.agendadaPara ?? o.abertaEm;
        const st = STATUS_OS[o.status];
        const conteudo = (
          <>
            <span className="text-2xs text-fg-subtle tabular">{dataCurta(data)}</span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-medium">{o.servico ?? "Serviço"}</span>
              <span className="text-xs text-fg-subtle">OS nº {o.numero}</span>
              {o.ehRetorno ? (
                <Badge tom="alerta">
                  <RotateCcw /> Retorno em garantia
                </Badge>
              ) : null}
              {o.status !== "faturada" && o.status !== "concluida" ? <Badge tom={st.tom}>{st.rotulo}</Badge> : null}
            </span>
            <span className="text-xs text-fg-muted">
              {[o.aparelho, o.tecnico ? `Técnico: ${o.tecnico}` : null, o.descricao].filter(Boolean).join(" · ")}
            </span>
          </>
        );
        return (
          <li key={o.id} id={`os-${o.numero}`} className="relative grid grid-cols-[20px_1fr_auto] gap-x-3 pb-4 last:pb-0 target:rounded-md target:bg-primary-soft/50">
            <span className="relative flex justify-center" aria-hidden>
              <span className={cn("mt-1.5 size-2.5 rounded-full ring-4 ring-surface", (o.categoria && COR_CATEGORIA[o.categoria]) ?? "bg-fg-subtle")} />
              {i < itens.length - 1 ? <span className="absolute top-4 bottom-[-6px] w-px bg-border" /> : null}
            </span>
            {o.href ? (
              <Link href={o.href} className="grid min-w-0 gap-0.5 rounded hover:text-primary">
                {conteudo}
              </Link>
            ) : (
              <div className="grid min-w-0 gap-0.5">{conteudo}</div>
            )}
            {mostrarValor ? <span className="tabular text-sm text-fg-muted">{o.valorTotal ? moeda(o.valorTotal) : "—"}</span> : <span />}
          </li>
        );
      })}
    </ol>
  );
}

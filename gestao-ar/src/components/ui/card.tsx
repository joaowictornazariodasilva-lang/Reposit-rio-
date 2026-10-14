import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("relative rounded-lg border border-border bg-surface shadow-xs", className)} {...props} />;
}

export function CardHeader({ className, titulo, descricao, acao, icone, id }: { className?: string; titulo: React.ReactNode; descricao?: React.ReactNode; acao?: React.ReactNode; icone?: React.ReactNode; id?: string }) {
  return (
    <header className={cn("flex items-start justify-between gap-3 px-4 pt-4 sm:px-5", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icone ? <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-soft-fg [&_svg]:size-4">{icone}</span> : null}
        <div className="min-w-0">
          <h2 id={id} className="text-sm font-semibold text-fg">{titulo}</h2>
          {descricao ? <p className="mt-0.5 text-xs text-fg-subtle">{descricao}</p> : null}
        </div>
      </div>
      {acao ? <div className="shrink-0">{acao}</div> : null}
    </header>
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />;
}

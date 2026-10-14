import { cn } from "@/lib/utils";

/** Nenhuma tela vazia sem orientação: sempre diz o que fazer em seguida. */
export function EmptyState({
  icone,
  titulo,
  descricao,
  acoes,
  className,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao: React.ReactNode;
  acoes?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="relative mb-5">
        <div className="absolute -inset-3 rounded-full bg-primary-soft/60 blur-md" aria-hidden />
        <div className="relative grid size-14 place-items-center rounded-xl border border-border bg-surface text-primary shadow-sm [&_svg]:size-6">{icone}</div>
      </div>
      <h3 className="text-base font-semibold text-fg">{titulo}</h3>
      <p className="mt-1.5 max-w-md text-sm text-fg-muted">{descricao}</p>
      {acoes ? <div className="mt-5 flex flex-wrap justify-center gap-2">{acoes}</div> : null}
    </div>
  );
}

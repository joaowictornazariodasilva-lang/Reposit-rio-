import { cn } from "@/lib/utils";

export function PageHeader({
  titulo,
  descricao,
  acoes,
  voltar,
  className,
  children,
}: {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  acoes?: React.ReactNode;
  voltar?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-5 sm:mb-6", className)}>
      {voltar ? <div className="mb-2">{voltar}</div> : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{titulo}</h1>
          {descricao ? <p className="mt-1 text-sm text-fg-muted">{descricao}</p> : null}
        </div>
        {acoes ? <div className="flex flex-wrap items-center gap-2">{acoes}</div> : null}
      </div>
      {children}
    </div>
  );
}

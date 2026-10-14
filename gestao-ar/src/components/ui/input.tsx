import { cn } from "@/lib/utils";

export const campoBase =
  "w-full rounded-md border border-border bg-surface px-3 text-sm text-fg shadow-xs transition-[border-color,box-shadow] duration-150 placeholder:text-fg-subtle hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(campoBase, "h-11 sm:h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(campoBase, "min-h-20 py-2 leading-relaxed", className)} {...props} />;
}

/** Select nativo estilizado — melhor no celular e acessível por padrão. */
export function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        campoBase,
        "h-11 appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9 sm:h-9",
        "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235e6e75' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-xs font-medium text-fg", className)} {...props} />;
}

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  erro?: string | null;
  obrigatorio?: boolean;
  className?: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
};

export function Field({ label, htmlFor, hint, erro, obrigatorio, className, acao, children }: FieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>
          {label}
          {obrigatorio ? (
            <span className="text-danger" aria-hidden>
              {" "}*
            </span>
          ) : null}
        </Label>
        {acao}
      </div>
      {children}
      {erro ? (
        <p id={`${htmlFor}-erro`} className="text-xs text-danger" role="alert">
          {erro}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-dica`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

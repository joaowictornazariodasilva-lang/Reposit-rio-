import { MessageCircle } from "lucide-react";
import { linkWhatsApp } from "@/lib/br";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Abre o WhatsApp com a mensagem pronta (wa.me). Sem número → botão desabilitado com explicação. */
export function BotaoWhatsApp({
  fone,
  texto,
  rotulo = "Enviar WhatsApp",
  somenteIcone,
  className,
  variante = "ghost",
}: {
  fone: string | null | undefined;
  texto?: string;
  rotulo?: string;
  somenteIcone?: boolean;
  className?: string;
  variante?: "ghost" | "secondary" | "soft";
}) {
  const href = linkWhatsApp(fone, texto);
  const classes = cn(
    buttonVariants({ variant: variante, size: somenteIcone ? "icon-sm" : "sm" }),
    somenteIcone && variante === "ghost" && "text-success hover:text-success",
    !href && "pointer-events-none opacity-40",
    className,
  );
  if (!href)
    return (
      <span className={classes} aria-disabled="true" title="Sem WhatsApp cadastrado">
        <MessageCircle />
        {somenteIcone ? <span className="sr-only">Sem WhatsApp cadastrado</span> : "WhatsApp"}
      </span>
    );
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes} aria-label={somenteIcone ? rotulo : undefined} title={rotulo}>
      <MessageCircle />
      {somenteIcone ? null : "WhatsApp"}
    </a>
  );
}

import Link from "next/link";
import { ArrowRight, Check, Construction } from "lucide-react";
import { MODULOS_FUTUROS } from "@/lib/navegacao";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

/** Módulo dos próximos passos: explica o que vem e aponta o que já dá para fazer. */
export function EmBreve({ slug }: { slug: string }) {
  const m = MODULOS_FUTUROS[slug]!;
  return (
    <>
      <PageHeader titulo={m.titulo} descricao={m.resumo} />
      <Card className="overflow-hidden">
        <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_280px]">
          <div>
            <Badge tom="primario">
              <Construction /> Chega no passo {m.passo} do plano
            </Badge>
            <h2 className="mt-4 text-lg font-semibold">O que esta tela vai fazer</h2>
            <ul className="mt-3 grid gap-2.5">
              {m.itens.map((i) => (
                <li key={i} className="flex gap-2.5 text-sm text-fg-muted">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-surface-2 p-5">
            <p className="text-sm font-medium">Enquanto isso, prepare a base:</p>
            <p className="mt-1 text-xs text-fg-subtle">Clientes, aparelhos e serviços cadastrados agora entram direto neste módulo.</p>
            <div className="mt-4 grid gap-2">
              <Link href="/clientes" className={buttonVariants({ variant: "secondary", size: "sm" }) + " justify-between"}>
                Clientes <ArrowRight />
              </Link>
              <Link href="/equipamentos" className={buttonVariants({ variant: "secondary", size: "sm" }) + " justify-between"}>
                Equipamentos <ArrowRight />
              </Link>
              <Link href="/cadastros/servicos" className={buttonVariants({ variant: "secondary", size: "sm" }) + " justify-between"}>
                Serviços e preços <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

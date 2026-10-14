"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { marcarOnboarding } from "@/server/actions/configuracoes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Passos = { empresa: boolean; logo: boolean; servicos: boolean; equipe: boolean; clientes: boolean };

const PASSOS: { k: keyof Passos; titulo: string; desc: string; href: string }[] = [
  { k: "empresa", titulo: "Dados da empresa", desc: "Nome, CNPJ e WhatsApp nos orçamentos", href: "/configuracoes" },
  { k: "logo", titulo: "Sua logo", desc: "Aparece nos PDFs e no menu", href: "/configuracoes" },
  { k: "servicos", titulo: "Serviços e preços", desc: "Limpeza, instalação, carga de gás…", href: "/cadastros/servicos" },
  { k: "equipe", titulo: "Equipe", desc: "Técnicos e atendimento com acesso próprio", href: "/configuracoes/equipe" },
  { k: "clientes", titulo: "Importar clientes", desc: "Traga a planilha que você já usa", href: "/importar?tipo=clientes" },
];

export function Onboarding({ passos }: { passos: Passos }) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const feitos = PASSOS.filter((p) => passos[p.k]).length;
  return (
    <Card className="mb-5 overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold">Deixe o sistema com a cara da sua empresa</h2>
          <p className="mt-0.5 text-xs text-fg-subtle">{feitos} de 5 passos · leva uns 10 minutos</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Ocultar guia de primeiros passos" onClick={() => iniciar(async () => { await marcarOnboarding("oculto"); router.refresh(); })}>
          <X />
        </Button>
      </div>
      <div className="mx-4 mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3 sm:mx-5" role="progressbar" aria-valuemin={0} aria-valuemax={5} aria-valuenow={feitos} aria-label="Progresso da configuração">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(feitos / 5) * 100}%` }} />
      </div>
      <ol className="mt-4 grid border-t border-border sm:grid-cols-5">
        {PASSOS.map((p, i) => {
          const ok = passos[p.k];
          return (
            <li key={p.k} className={cn("border-border max-sm:border-b max-sm:last:border-b-0 sm:border-r sm:last:border-r-0", ok && "max-sm:hidden")}>
              <Link href={p.href} className="flex h-full items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:flex-col sm:gap-2">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-2xs font-semibold", ok ? "border-primary bg-primary text-primary-fg" : "border-border-strong text-fg-muted")}>
                  {ok ? <Check className="size-3.5" strokeWidth={3} aria-label="concluído" /> : i + 1}
                </span>
                <span>
                  <span className={cn("block text-sm font-medium", ok && "text-fg-muted line-through decoration-fg-subtle/50")}>{p.titulo}</span>
                  <span className="block text-xs text-fg-subtle">{p.desc}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

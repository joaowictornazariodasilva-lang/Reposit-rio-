"use client";

import { useActionState, useRef } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { entrar, type EstadoLogin } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const DEMO = [
  { email: "dono@brisaclima.demo", rotulo: "Dono (admin)" },
  { email: "financeiro@brisaclima.demo", rotulo: "Financeiro" },
  { email: "atendimento@brisaclima.demo", rotulo: "Atendimento" },
  { email: "marcos@brisaclima.demo", rotulo: "Técnico" },
];

export function FormLogin({ de, demo }: { de?: string; demo: boolean }) {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(entrar, undefined);
  const [ver, setVer] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  function preencher(email: string) {
    const f = form.current;
    if (!f) return;
    (f.elements.namedItem("email") as HTMLInputElement).value = email;
    (f.elements.namedItem("senha") as HTMLInputElement).value = "brisa2026";
    f.requestSubmit();
  }

  return (
    <>
      <form ref={form} action={acao} className="mt-8 grid gap-4" noValidate>
        {de ? <input type="hidden" name="de" value={de} /> : null}
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="username" inputMode="email" required defaultValue={estado?.email} aria-invalid={!!estado?.erro} aria-describedby={estado?.erro ? "login-erro" : undefined} />
        </Field>
        <Field label="Senha" htmlFor="senha">
          <div className="relative">
            <Input id="senha" name="senha" type={ver ? "text" : "password"} autoComplete="current-password" required className="pr-11" aria-invalid={!!estado?.erro} />
            <button type="button" onClick={() => setVer((v) => !v)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-fg-subtle hover:text-fg" aria-label={ver ? "Ocultar senha" : "Mostrar senha"} aria-pressed={ver}>
              {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        {estado?.erro ? (
          <p id="login-erro" role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {estado.erro}
          </p>
        ) : null}
        <Button type="submit" size="lg" carregando={pendente} className="mt-1">
          Entrar <ArrowRight />
        </Button>
      </form>

      {demo ? (
        <div className="mt-10 rounded-lg border border-dashed border-border-strong p-4">
          <p className="text-xs font-medium text-fg">Demonstração — entrar como:</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO.map((d) => (
              <Button key={d.email} type="button" variant="secondary" size="sm" onClick={() => preencher(d.email)} disabled={pendente}>
                {d.rotulo}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-2xs text-fg-subtle">Senha de todos: brisa2026. Cada perfil vê um menu diferente.</p>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { mascaraCep } from "@/lib/mascaras";
import { soDigitos } from "@/lib/format";

export type EnderecoForm = {
  nome?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  referencia: string;
};

export const enderecoVazio: EnderecoForm = { nome: "", cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", referencia: "" };

/** Endereço com busca automática pelo CEP: digitou 8 dígitos, preencheu. */
export function CamposEndereco({
  valor,
  onChange,
  erros,
  prefixo,
  comNome,
}: {
  valor: EnderecoForm;
  onChange: (v: EnderecoForm) => void;
  erros?: Record<string, string>;
  prefixo: string;
  comNome?: boolean;
}) {
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const id = (c: string) => `${prefixo}-${c}`;
  const set = (c: keyof EnderecoForm) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...valor, [c]: e.target.value });
  const err = (c: string) => erros?.[c] ?? erros?.[`local.${c}`];

  async function aoMudarCep(e: React.ChangeEvent<HTMLInputElement>) {
    const cep = mascaraCep(e.target.value);
    onChange({ ...valor, cep });
    setAviso(null);
    if (soDigitos(cep).length !== 8) return;
    setBuscando(true);
    try {
      const r = await fetch(`/api/consulta/cep/${soDigitos(cep)}`);
      if (r.ok) {
        const d = (await r.json()) as { logradouro: string; bairro: string; cidade: string; uf: string };
        onChange({ ...valor, cep, logradouro: d.logradouro || valor.logradouro, bairro: d.bairro || valor.bairro, cidade: d.cidade, uf: d.uf });
        setTimeout(() => document.getElementById(id("numero"))?.focus(), 0);
      } else setAviso("CEP não encontrado — preencha o endereço manualmente.");
    } catch {
      setAviso("Sem conexão para buscar o CEP — preencha manualmente.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="grid grid-cols-6 gap-3">
      {comNome ? (
        <Field label="Nome do local" htmlFor={id("nome")} className="col-span-6" erro={err("nome")} hint="Ex.: Casa, Apartamento da praia, Matriz, Filial Cocó">
          <Input id={id("nome")} value={valor.nome ?? ""} onChange={set("nome")} />
        </Field>
      ) : null}
      <Field label="CEP" htmlFor={id("cep")} className="col-span-3 sm:col-span-2" erro={err("cep") ?? aviso} hint={buscando ? undefined : "Preenche o endereço"}>
        <div className="relative">
          <Input id={id("cep")} value={valor.cep} onChange={aoMudarCep} inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" />
          <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-fg-subtle">
            {buscando ? <Loader2 className="size-4 animate-spin" aria-label="Buscando CEP" /> : <MapPin className="size-4" aria-hidden />}
          </span>
        </div>
      </Field>
      <Field label="Rua / avenida" htmlFor={id("logradouro")} className="col-span-6 sm:col-span-4" erro={err("logradouro")}>
        <Input id={id("logradouro")} value={valor.logradouro} onChange={set("logradouro")} autoComplete="address-line1" />
      </Field>
      <Field label="Número" htmlFor={id("numero")} className="col-span-3 sm:col-span-2" erro={err("numero")}>
        <Input id={id("numero")} value={valor.numero} onChange={set("numero")} />
      </Field>
      <Field label="Complemento" htmlFor={id("complemento")} className="col-span-6 sm:col-span-4">
        <Input id={id("complemento")} value={valor.complemento} onChange={set("complemento")} placeholder="Apto, bloco, sala…" />
      </Field>
      <Field label="Bairro" htmlFor={id("bairro")} className="col-span-6 sm:col-span-3">
        <Input id={id("bairro")} value={valor.bairro} onChange={set("bairro")} />
      </Field>
      <Field label="Cidade" htmlFor={id("cidade")} className="col-span-4 sm:col-span-2">
        <Input id={id("cidade")} value={valor.cidade} onChange={set("cidade")} autoComplete="address-level2" />
      </Field>
      <Field label="UF" htmlFor={id("uf")} className="col-span-2 sm:col-span-1" erro={err("uf")}>
        <Input id={id("uf")} value={valor.uf} onChange={(e) => onChange({ ...valor, uf: e.target.value.toUpperCase().slice(0, 2) })} autoComplete="address-level1" />
      </Field>
      <Field label="Ponto de referência" htmlFor={id("referencia")} className="col-span-6">
        <Input id={id("referencia")} value={valor.referencia} onChange={set("referencia")} placeholder="Ex.: portão azul, interfone 302" />
      </Field>
    </div>
  );
}

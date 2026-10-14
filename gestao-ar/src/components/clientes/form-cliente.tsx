"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Loader2, Search, User } from "lucide-react";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ORIGENS } from "@/lib/dominio";
import { mascaraDocumento, mascaraTelefone } from "@/lib/mascaras";
import { soDigitos } from "@/lib/format";
import { cnpjValido } from "@/lib/br";
import { cn } from "@/lib/utils";
import { CamposEndereco, enderecoVazio, type EnderecoForm } from "./campos-endereco";

export type ClienteForm = {
  tipo: "pf" | "pj";
  nome: string;
  nomeFantasia: string;
  documento: string;
  inscricaoEstadual: string;
  email: string;
  whatsapp: string;
  telefone: string;
  origem: string;
  tags: string;
  notas: string;
  local: EnderecoForm;
  contato: { nome: string; cargo: string; whatsapp: string };
};

export const clienteVazio: ClienteForm = {
  tipo: "pf",
  nome: "",
  nomeFantasia: "",
  documento: "",
  inscricaoEstadual: "",
  email: "",
  whatsapp: "",
  telefone: "",
  origem: "",
  tags: "",
  notas: "",
  local: enderecoVazio,
  contato: { nome: "", cargo: "", whatsapp: "" },
};

export function FormCliente({
  valor,
  onChange,
  erros,
  comEndereco = true,
}: {
  valor: ClienteForm;
  onChange: (v: ClienteForm) => void;
  erros: Record<string, string>;
  comEndereco?: boolean;
}) {
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [cnpjInfo, setCnpjInfo] = useState<{ ok: boolean; texto: string } | null>(null);
  const set = <K extends keyof ClienteForm>(k: K, v: ClienteForm[K]) => onChange({ ...valor, [k]: v });
  const pj = valor.tipo === "pj";

  async function buscarCnpj(doc = valor.documento) {
    const d = soDigitos(doc);
    if (!cnpjValido(d)) {
      setCnpjInfo({ ok: false, texto: "CNPJ inválido — confira os dígitos." });
      return;
    }
    setBuscandoCnpj(true);
    setCnpjInfo(null);
    try {
      const r = await fetch(`/api/consulta/cnpj/${d}`);
      if (!r.ok) {
        setCnpjInfo({ ok: false, texto: "Não encontramos este CNPJ na Receita. Preencha manualmente." });
        return;
      }
      const c = (await r.json()) as {
        razaoSocial: string;
        nomeFantasia: string | null;
        email: string | null;
        telefone: string | null;
        situacao: string | null;
        endereco: EnderecoForm & { numero: string | null; complemento: string | null };
      };
      onChange({
        ...valor,
        documento: mascaraDocumento(d, "pj"),
        nome: c.razaoSocial,
        nomeFantasia: c.nomeFantasia ?? valor.nomeFantasia,
        email: valor.email || c.email || "",
        telefone: valor.telefone || (c.telefone ? mascaraTelefone(c.telefone) : ""),
        local: {
          ...valor.local,
          nome: valor.local.nome || "Matriz",
          cep: c.endereco.cep ? c.endereco.cep.replace(/(\d{5})(\d{3})/, "$1-$2") : valor.local.cep,
          logradouro: c.endereco.logradouro,
          numero: c.endereco.numero ?? "",
          complemento: c.endereco.complemento ?? "",
          bairro: c.endereco.bairro,
          cidade: c.endereco.cidade,
          uf: c.endereco.uf,
        },
      });
      setCnpjInfo({ ok: true, texto: `Dados preenchidos pela Receita${c.situacao ? ` · situação ${c.situacao.toLowerCase()}` : ""}.` });
    } catch {
      setCnpjInfo({ ok: false, texto: "Sem conexão para consultar — preencha manualmente." });
    } finally {
      setBuscandoCnpj(false);
    }
  }

  return (
    <div className="grid gap-6">
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-fg">Tipo de cliente</legend>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-3 p-1" role="radiogroup">
          {(
            [
              ["pf", "Pessoa física", User],
              ["pj", "Empresa / condomínio", Building2],
            ] as const
          ).map(([t, rot, I]) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={valor.tipo === t}
              onClick={() => onChange({ ...valor, tipo: t, documento: mascaraDocumento(valor.documento, t) })}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-md text-sm font-medium text-fg-muted transition-colors sm:h-9",
                valor.tipo === t && "bg-surface text-fg shadow-sm",
              )}
            >
              <I className="size-4" /> {rot}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={pj ? "CNPJ" : "CPF"}
          htmlFor="cli-documento"
          className="col-span-2"
          erro={erros.documento}
          hint={pj ? (cnpjInfo ? undefined : "Digite o CNPJ e buscamos razão social e endereço.") : "Opcional — ajuda a evitar cadastro duplicado."}
        >
          <div className="flex gap-2">
            <Input
              id="cli-documento"
              value={valor.documento}
              inputMode="numeric"
              placeholder={pj ? "00.000.000/0000-00" : "000.000.000-00"}
              aria-invalid={!!erros.documento}
              onChange={(e) => {
                const m = mascaraDocumento(e.target.value, valor.tipo);
                set("documento", m);
                setCnpjInfo(null);
                if (pj && soDigitos(m).length === 14 && soDigitos(valor.documento).length !== 14) void buscarCnpj(m);
              }}
            />
            {pj ? (
              <button
                type="button"
                onClick={() => void buscarCnpj()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-surface text-fg-muted hover:bg-surface-2 hover:text-fg sm:h-9 sm:w-9"
                aria-label="Buscar CNPJ na Receita"
                title="Buscar CNPJ"
              >
                {buscandoCnpj ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              </button>
            ) : null}
          </div>
          {cnpjInfo ? (
            <p className={cn("flex items-center gap-1.5 text-xs", cnpjInfo.ok ? "text-success" : "text-warning")} role="status">
              {cnpjInfo.ok ? <CheckCircle2 className="size-3.5" /> : null}
              {cnpjInfo.texto}
            </p>
          ) : null}
        </Field>

        <Field label={pj ? "Razão social" : "Nome completo"} htmlFor="cli-nome" obrigatorio className="col-span-2" erro={erros.nome}>
          <Input id="cli-nome" value={valor.nome} onChange={(e) => set("nome", e.target.value)} autoComplete="off" aria-invalid={!!erros.nome} required />
        </Field>
        {pj ? (
          <Field label="Nome fantasia" htmlFor="cli-fantasia" className="col-span-2" hint="É o nome que aparece nas listas.">
            <Input id="cli-fantasia" value={valor.nomeFantasia} onChange={(e) => set("nomeFantasia", e.target.value)} />
          </Field>
        ) : null}
        <Field label="WhatsApp" htmlFor="cli-whatsapp" erro={erros.whatsapp} className="col-span-2 sm:col-span-1">
          <Input id="cli-whatsapp" value={valor.whatsapp} onChange={(e) => set("whatsapp", mascaraTelefone(e.target.value))} inputMode="tel" placeholder="(85) 90000-0000" aria-invalid={!!erros.whatsapp} />
        </Field>
        <Field label="Telefone fixo" htmlFor="cli-telefone" erro={erros.telefone} className="col-span-2 sm:col-span-1">
          <Input id="cli-telefone" value={valor.telefone} onChange={(e) => set("telefone", mascaraTelefone(e.target.value))} inputMode="tel" aria-invalid={!!erros.telefone} />
        </Field>
        <Field label="E-mail" htmlFor="cli-email" erro={erros.email} className="col-span-2">
          <Input id="cli-email" type="email" value={valor.email} onChange={(e) => set("email", e.target.value)} inputMode="email" aria-invalid={!!erros.email} />
        </Field>
      </div>

      {comEndereco ? (
        <section aria-labelledby="sec-endereco" className="grid gap-3">
          <h3 id="sec-endereco" className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            Endereço do atendimento
          </h3>
          <CamposEndereco prefixo="cli-local" valor={valor.local} onChange={(local) => set("local", local)} erros={erros} />
        </section>
      ) : null}

      {pj && comEndereco ? (
        <section aria-labelledby="sec-contato" className="grid gap-3">
          <h3 id="sec-contato" className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            Contato principal
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome" htmlFor="cli-contato-nome" className="col-span-2 sm:col-span-1">
              <Input id="cli-contato-nome" value={valor.contato.nome} onChange={(e) => set("contato", { ...valor.contato, nome: e.target.value })} />
            </Field>
            <Field label="Cargo" htmlFor="cli-contato-cargo" className="col-span-2 sm:col-span-1">
              <Input id="cli-contato-cargo" value={valor.contato.cargo} onChange={(e) => set("contato", { ...valor.contato, cargo: e.target.value })} placeholder="Síndico, gerente…" />
            </Field>
            <Field label="WhatsApp do contato" htmlFor="cli-contato-whats" className="col-span-2" erro={erros["contato.whatsapp"]}>
              <Input id="cli-contato-whats" value={valor.contato.whatsapp} onChange={(e) => set("contato", { ...valor.contato, whatsapp: mascaraTelefone(e.target.value) })} inputMode="tel" />
            </Field>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="sec-extra" className="grid gap-3">
        <h3 id="sec-extra" className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
          Organização
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Como conheceu a empresa" htmlFor="cli-origem" className="col-span-2 sm:col-span-1">
            <NativeSelect id="cli-origem" value={valor.origem} onChange={(e) => set("origem", e.target.value)}>
              <option value="">Selecione…</option>
              {ORIGENS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Etiquetas" htmlFor="cli-tags" className="col-span-2 sm:col-span-1" hint="Separe por vírgula">
            <Input id="cli-tags" value={valor.tags} onChange={(e) => set("tags", e.target.value)} placeholder="VIP, Contrato" />
          </Field>
          {valor.tags.trim() ? (
            <div className="col-span-2 -mt-1 flex flex-wrap gap-1">
              {valor.tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((t) => (
                  <Badge key={t} tom="primario">
                    {t}
                  </Badge>
                ))}
            </div>
          ) : null}
          <Field label="Notas internas" htmlFor="cli-notas" className="col-span-2" hint="Só a equipe vê. Ex.: tem cachorro, prefere manhã.">
            <Textarea id="cli-notas" value={valor.notas} onChange={(e) => set("notas", e.target.value)} rows={3} />
          </Field>
        </div>
      </section>
    </div>
  );
}

/** Converte o formulário para o formato da ação do servidor. */
export function paraEnvio(v: ClienteForm) {
  return {
    tipo: v.tipo,
    nome: v.nome,
    nomeFantasia: v.tipo === "pj" ? v.nomeFantasia : null,
    documento: v.documento,
    inscricaoEstadual: v.inscricaoEstadual,
    email: v.email,
    whatsapp: v.whatsapp,
    telefone: v.telefone,
    origem: v.origem,
    tags: v.tags,
    notas: v.notas,
  };
}

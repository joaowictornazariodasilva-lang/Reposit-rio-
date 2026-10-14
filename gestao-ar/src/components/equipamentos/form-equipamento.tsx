"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Search, X } from "lucide-react";
import { locaisDoCliente } from "@/server/actions/clientes";
import { salvarEquipamento, type EquipamentoInput } from "@/server/actions/equipamentos";
import type { ResultadoBusca } from "@/server/queries/busca";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BTUS_COMUNS, GASES, MARCAS_COMUNS, TIPOS_EQUIPAMENTO } from "@/lib/dominio";
import { numero } from "@/lib/format";
import { cn } from "@/lib/utils";

export type EquipamentoForm = {
  clienteId: string;
  clienteNome: string;
  localId: string;
  tipo: string;
  marca: string;
  modelo: string;
  btus: string;
  gas: string;
  tensao: string;
  inverter: boolean;
  numeroSerie: string;
  ambiente: string;
  dataInstalacao: string;
  garantiaAte: string;
  instaladoPorNos: boolean;
  observacoes: string;
};

export const equipamentoVazio: EquipamentoForm = {
  clienteId: "",
  clienteNome: "",
  localId: "",
  tipo: "split",
  marca: "",
  modelo: "",
  btus: "12000",
  gas: "R-410A",
  tensao: "220 V",
  inverter: true,
  numeroSerie: "",
  ambiente: "",
  dataInstalacao: "",
  garantiaAte: "",
  instaladoPorNos: false,
  observacoes: "",
};

type Local = { id: string; nome: string; bairro: string | null; logradouro: string | null; numero: string | null };

function somarMeses(iso: string, meses: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

export function FormEquipamento({
  inicial,
  equipamentoId,
  aoSalvar,
  aoCancelar,
  travarCliente,
}: {
  inicial: EquipamentoForm;
  equipamentoId?: string;
  aoSalvar: (id: string) => void;
  aoCancelar: () => void;
  travarCliente?: boolean;
}) {
  const [v, setV] = useState<EquipamentoForm>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [locais, setLocais] = useState<Local[] | null>(null);
  const [pendente, iniciar] = useTransition();
  const set = <K extends keyof EquipamentoForm>(k: K, val: EquipamentoForm[K]) => setV((x) => ({ ...x, [k]: val }));

  useEffect(() => {
    if (!v.clienteId) {
      setLocais(null);
      return;
    }
    let vivo = true;
    void locaisDoCliente(v.clienteId).then((ls) => {
      if (!vivo) return;
      setLocais(ls);
      setV((x) => (x.localId && ls.some((l) => l.id === x.localId) ? x : { ...x, localId: ls[0]?.id ?? "" }));
    });
    return () => {
      vivo = false;
    };
  }, [v.clienteId]);

  function salvar() {
    iniciar(async () => {
      const dados: EquipamentoInput = {
        clienteId: v.clienteId,
        localId: v.localId,
        tipo: v.tipo as EquipamentoInput["tipo"],
        marca: v.marca,
        modelo: v.modelo,
        btus: v.btus.replace(/\D/g, ""),
        gas: v.gas,
        tensao: v.tensao,
        inverter: v.inverter,
        numeroSerie: v.numeroSerie,
        ambiente: v.ambiente,
        dataInstalacao: v.dataInstalacao,
        garantiaAte: v.garantiaAte,
        instaladoPorNos: v.instaladoPorNos,
        observacoes: v.observacoes,
      };
      const r = await salvarEquipamento(equipamentoId ?? null, dados);
      if (!r.ok) {
        setErros(r.campos ?? {});
        toast.error(r.erro);
        return;
      }
      toast.success(equipamentoId ? "Equipamento atualizado" : "Equipamento cadastrado", { description: `${v.marca} ${numero(Number(v.btus))} BTUs${v.ambiente ? ` · ${v.ambiente}` : ""}` });
      aoSalvar(r.id);
    });
  }

  return (
    <form
      id="form-equipamento"
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
      className="grid gap-6"
    >
      <div className="grid grid-cols-2 gap-3">
        {travarCliente ? (
          <div className="col-span-2 rounded-md bg-surface-2 px-3 py-2 text-sm">
            <span className="text-fg-subtle">Cliente: </span>
            <span className="font-medium">{v.clienteNome}</span>
          </div>
        ) : (
          <SeletorCliente
            className="col-span-2"
            valor={v.clienteId ? { id: v.clienteId, nome: v.clienteNome } : null}
            onChange={(c) => setV((x) => ({ ...x, clienteId: c?.id ?? "", clienteNome: c?.nome ?? "", localId: "" }))}
            erro={erros.clienteId}
          />
        )}
        {v.clienteId ? (
          <Field label="Local" htmlFor="eq-local" className="col-span-2" erro={erros.localId} hint={locais && locais.length === 0 ? "Este cliente ainda não tem endereço — cadastre na ficha do cliente." : undefined}>
            <NativeSelect id="eq-local" value={v.localId} onChange={(e) => set("localId", e.target.value)} disabled={!locais}>
              {locais === null ? <option>Carregando…</option> : null}
              {locais?.length === 0 ? <option value="">Sem local</option> : null}
              {locais?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                  {l.logradouro ? ` — ${l.logradouro}${l.numero ? `, ${l.numero}` : ""}${l.bairro ? ` · ${l.bairro}` : ""}` : ""}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        <Field label="Ambiente" htmlFor="eq-ambiente" className="col-span-2" hint="Onde está instalado: Quarto do casal, Recepção, Sala 2…">
          <Input id="eq-ambiente" value={v.ambiente} onChange={(e) => set("ambiente", e.target.value)} list="ambientes" />
          <datalist id="ambientes">
            {["Sala", "Quarto do casal", "Quarto 2", "Suíte", "Escritório", "Recepção", "Sala de reunião", "Consultório 1", "CPD"].map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </Field>
      </div>

      <section className="grid gap-3" aria-labelledby="eq-sec-aparelho">
        <h3 id="eq-sec-aparelho" className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
          Aparelho
        </h3>
        <fieldset>
          <legend className="mb-2 text-xs font-medium">Tipo <span className="text-danger" aria-hidden>*</span></legend>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(TIPOS_EQUIPAMENTO).map(([k, rot]) => (
              <button
                key={k}
                type="button"
                aria-pressed={v.tipo === k}
                onClick={() => set("tipo", k)}
                className={cn(
                  "h-10 rounded-full border border-border px-3.5 text-xs font-medium text-fg-muted transition-colors hover:border-border-strong sm:h-8",
                  v.tipo === k && "border-primary bg-primary-soft text-primary-soft-fg",
                )}
              >
                {rot}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marca" htmlFor="eq-marca" obrigatorio erro={erros.marca}>
            <Input id="eq-marca" value={v.marca} onChange={(e) => set("marca", e.target.value)} list="marcas" aria-invalid={!!erros.marca} />
            <datalist id="marcas">
              {MARCAS_COMUNS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>
          <Field label="Capacidade (BTUs)" htmlFor="eq-btus" obrigatorio erro={erros.btus}>
            <Input id="eq-btus" value={v.btus} onChange={(e) => set("btus", e.target.value.replace(/\D/g, ""))} inputMode="numeric" list="btus" aria-invalid={!!erros.btus} />
            <datalist id="btus">
              {BTUS_COMUNS.map((b) => (
                <option key={b} value={b}>
                  {numero(b)} BTUs
                </option>
              ))}
            </datalist>
          </Field>
          <Field label="Modelo" htmlFor="eq-modelo" className="col-span-2">
            <Input id="eq-modelo" value={v.modelo} onChange={(e) => set("modelo", e.target.value)} placeholder="Ex.: Dual Inverter S3-Q12JA31A" />
          </Field>
          <Field label="Gás" htmlFor="eq-gas">
            <NativeSelect id="eq-gas" value={v.gas} onChange={(e) => set("gas", e.target.value)}>
              <option value="">Não sei</option>
              {GASES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Tensão" htmlFor="eq-tensao">
            <NativeSelect id="eq-tensao" value={v.tensao} onChange={(e) => set("tensao", e.target.value)}>
              <option>220 V</option>
              <option>127 V</option>
              <option>380 V (trifásico)</option>
            </NativeSelect>
          </Field>
          <Field label="Nº de série" htmlFor="eq-serie" className="col-span-2 sm:col-span-1">
            <Input id="eq-serie" value={v.numeroSerie} onChange={(e) => set("numeroSerie", e.target.value.toUpperCase())} autoCapitalize="characters" />
          </Field>
          <label htmlFor="eq-inverter" className="col-span-2 flex min-h-11 items-center justify-between gap-3 rounded-md border border-border px-3 sm:col-span-1 sm:self-end sm:min-h-9">
            <span className="text-sm">Inverter</span>
            <Switch id="eq-inverter" checked={v.inverter} onCheckedChange={(c) => set("inverter", c)} />
          </label>
        </div>
      </section>

      <section className="grid gap-3" aria-labelledby="eq-sec-garantia">
        <h3 id="eq-sec-garantia" className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
          Instalação e garantia
        </h3>
        <label htmlFor="eq-nosso" className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border px-3">
          <span className="text-sm">
            Instalado pela nossa equipe
            <span className="block text-xs text-fg-subtle">Retornos dentro da garantia entram no indicador de retornos.</span>
          </span>
          <Switch id="eq-nosso" checked={v.instaladoPorNos} onCheckedChange={(c) => set("instaladoPorNos", c)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data de instalação" htmlFor="eq-instalacao" erro={erros.dataInstalacao}>
            <Input
              id="eq-instalacao"
              type="date"
              value={v.dataInstalacao}
              onChange={(e) => {
                const d = e.target.value;
                setV((x) => ({ ...x, dataInstalacao: d, garantiaAte: x.garantiaAte || !d ? x.garantiaAte : somarMeses(d, 12) }));
              }}
            />
          </Field>
          <Field label="Garantia até" htmlFor="eq-garantia" erro={erros.garantiaAte} hint={v.dataInstalacao ? "Sugerimos 12 meses" : undefined}>
            <Input id="eq-garantia" type="date" value={v.garantiaAte} onChange={(e) => set("garantiaAte", e.target.value)} aria-invalid={!!erros.garantiaAte} />
          </Field>
          <Field label="Observações" htmlFor="eq-obs" className="col-span-2">
            <Textarea id="eq-obs" value={v.observacoes} onChange={(e) => set("observacoes", e.target.value)} rows={2} placeholder="Ex.: condensadora no telhado, precisa de escada de 6 m" />
          </Field>
        </div>
      </section>

      <div className="sticky -bottom-5 -mx-5 -mb-5 flex justify-end gap-2 border-t border-border bg-surface-2 px-5 py-3">
        <Button type="button" variant="ghost" onClick={aoCancelar} className="mr-auto">
          Cancelar
        </Button>
        <Button type="submit" carregando={pendente}>
          {equipamentoId ? "Salvar alterações" : "Cadastrar equipamento"}
        </Button>
      </div>
    </form>
  );
}

function SeletorCliente({ valor, onChange, erro, className }: { valor: { id: string; nome: string } | null; onChange: (c: { id: string; nome: string } | null) => void; erro?: string; className?: string }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<ResultadoBusca[]>([]);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (q.trim().length < 2) {
      setRes([]);
      return;
    }
    setCarregando(true);
    const t = setTimeout(async () => {
      const r = await fetch(`/api/busca?so=clientes&q=${encodeURIComponent(q)}`);
      if (r.ok) setRes(((await r.json()) as { resultados: ResultadoBusca[] }).resultados);
      setCarregando(false);
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  if (valor)
    return (
      <div className={cn("grid gap-1.5", className)}>
        <span className="text-xs font-medium">Cliente</span>
        <div className="flex h-11 items-center gap-2 rounded-md border border-primary bg-primary-soft px-3 text-sm text-primary-soft-fg sm:h-9">
          <Check className="size-4" />
          <span className="flex-1 truncate font-medium">{valor.nome}</span>
          <button type="button" onClick={() => onChange(null)} className="-mr-1 grid size-8 place-items-center rounded hover:bg-surface/60" aria-label="Trocar cliente">
            <X className="size-4" />
          </button>
        </div>
      </div>
    );

  return (
    <Field label="Cliente" htmlFor="eq-cliente" obrigatorio erro={erro} className={className}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
        <Input id="eq-cliente" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, telefone ou CPF/CNPJ" className="pl-9" autoComplete="off" role="combobox" aria-expanded={res.length > 0} aria-controls="eq-cliente-lista" aria-invalid={!!erro} />
        {carregando ? <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-fg-subtle" /> : null}
      </div>
      {q.trim().length >= 2 ? (
        <ul id="eq-cliente-lista" role="listbox" className="max-h-56 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-md">
          {res.map((r) => (
            <li key={r.id} role="option" aria-selected={false}>
              <button type="button" onClick={() => onChange({ id: r.id, nome: r.titulo })} className="flex min-h-11 w-full flex-col items-start justify-center rounded px-2.5 text-left hover:bg-surface-3">
                <span className="text-sm font-medium">{r.titulo}</span>
                <span className="text-xs text-fg-subtle">{r.detalhe}</span>
              </button>
            </li>
          ))}
          {!carregando && res.length === 0 ? (
            <li className="px-2.5 py-3 text-sm text-fg-muted">
              Nenhum cliente encontrado.{" "}
              <button type="button" className="font-medium text-primary underline-offset-2 hover:underline" onClick={() => router.push(`?novo=cliente`)}>
                Cadastrar novo cliente
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </Field>
  );
}

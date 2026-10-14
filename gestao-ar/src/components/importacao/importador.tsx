"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, Package, Upload, Users } from "lucide-react";
import { importarLinhas, type ResumoImportacao } from "@/server/actions/importacao";
import { CAMPOS, mapearColunas, modeloCsv, validarLinha, type Entidade } from "@/lib/importacao";
import { baixarArquivo } from "@/lib/csv";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { numero } from "@/lib/format";
import { cn } from "@/lib/utils";

type Planilha = { nome: string; cabecalhos: string[]; linhas: string[][] };

const LOTE = 500;

async function lerArquivo(arq: File): Promise<Planilha> {
  if (/\.(xlsx|xlsm)$/i.test(arq.name)) {
    const { readSheet } = await import("read-excel-file/browser");
    const dados = (await readSheet(arq)) as unknown[][];
    const [cab = [], ...resto] = dados;
    return { nome: arq.name, cabecalhos: cab.map((c) => String(c ?? "")), linhas: resto.map((l) => l.map((c) => (c instanceof Date ? c.toISOString().slice(0, 10) : c === null || c === undefined ? "" : String(c)))) };
  }
  if (/\.xls$/i.test(arq.name)) throw new Error("Arquivos .xls antigos não são suportados. No Excel, use “Salvar como” → .xlsx ou CSV.");
  const Papa = (await import("papaparse")).default;
  // Tenta UTF-8; se aparecerem caracteres quebrados, relê como Windows-1252 (Excel brasileiro).
  let texto = await arq.text();
  if (texto.includes("�")) texto = new TextDecoder("windows-1252").decode(await arq.arrayBuffer());
  const r = Papa.parse<string[]>(texto.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
  const [cab = [], ...resto] = r.data;
  return { nome: arq.name, cabecalhos: cab, linhas: resto };
}

export function Importador({ inicial, podeProdutos }: { inicial: Entidade; podeProdutos: boolean }) {
  const [entidade, setEntidade] = useState<Entidade>(inicial);
  const [planilha, setPlanilha] = useState<Planilha | null>(null);
  const [mapa, setMapa] = useState<Record<string, number>>({});
  const [edicoes, setEdicoes] = useState<Record<string, string>>({}); // "linha:campo" → valor
  const [pular, setPular] = useState<Set<number>>(new Set());
  const [soErros, setSoErros] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [resultado, setResultado] = useState<ResumoImportacao | null>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [, iniciar] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function abrirArquivo(arq: File | undefined) {
    if (!arq) return;
    if (arq.size > 10 * 1024 * 1024) return void toast.error("Arquivo maior que 10 MB. Divida a planilha em partes.");
    try {
      const p = await lerArquivo(arq);
      if (!p.linhas.length) return void toast.error("A planilha está vazia ou só tem o cabeçalho.");
      setPlanilha(p);
      setMapa(mapearColunas(entidade, p.cabecalhos));
      setEdicoes({});
      setPular(new Set());
      setResultado(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    }
  }

  const campos = CAMPOS[entidade];
  const valoresBrutos = (i: number) => {
    const l = planilha!.linhas[i]!;
    const o: Record<string, unknown> = {};
    for (const c of campos) {
      const k = `${i}:${c.chave}`;
      o[c.chave] = k in edicoes ? edicoes[k] : mapa[c.chave]! >= 0 ? (l[mapa[c.chave]!] ?? "") : "";
    }
    return o;
  };

  const validadas = useMemo(() => {
    if (!planilha) return [];
    return planilha.linhas.map((_, i) => ({ i, bruto: valoresBrutos(i), ...validarLinha(entidade, valoresBrutos(i)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planilha, mapa, edicoes, entidade]);

  const comErro = validadas.filter((v) => !pular.has(v.i) && Object.keys(v.erros).length);
  const prontas = validadas.filter((v) => !pular.has(v.i) && !Object.keys(v.erros).length);
  const visiveis = (soErros ? comErro : validadas).slice(0, 200);
  const colunasVisiveis = campos.filter((c) => c.obrigatorio || mapa[c.chave]! >= 0);
  const faltaObrigatorio = campos.some((c) => c.obrigatorio && mapa[c.chave]! < 0);

  function importar() {
    iniciar(async () => {
      const total: ResumoImportacao = { importados: 0, ignorados: [] };
      const enviar = prontas.map((v) => ({ linha: v.i + 2, valores: v.bruto }));
      setProgresso(0);
      for (let i = 0; i < enviar.length; i += LOTE) {
        const r = await importarLinhas(entidade, enviar.slice(i, i + LOTE));
        if (!r.ok) {
          setProgresso(null);
          return void toast.error(r.erro);
        }
        total.importados += r.importados;
        total.ignorados.push(...r.ignorados);
        setProgresso(Math.min(100, Math.round(((i + LOTE) / enviar.length) * 100)));
      }
      setProgresso(null);
      setResultado(total);
      toast.success(`${numero(total.importados)} ${entidade} importados`);
    });
  }

  if (resultado)
    return (
      <Card>
        <CardBody className="flex flex-col items-center py-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-success-soft text-success">
            <CheckCircle2 className="size-7" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">{numero(resultado.importados)} {entidade === "clientes" ? "clientes importados" : "produtos importados"}</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {resultado.ignorados.length ? `${resultado.ignorados.length} linha(s) ficaram de fora — veja abaixo.` : "Nenhuma linha ficou de fora."}
          </p>
          {resultado.ignorados.length ? (
            <ul className="mt-4 max-h-60 w-full max-w-lg overflow-y-auto rounded-md border border-border text-left text-sm">
              {resultado.ignorados.map((g) => (
                <li key={`${g.linha}-${g.motivo}`} className="flex gap-3 border-b border-border px-3 py-2 last:border-0">
                  <span className="tabular w-16 shrink-0 text-fg-subtle">linha {g.linha}</span>
                  <span>{g.motivo}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href={entidade === "clientes" ? "/clientes?ordem=recentes" : "/cadastros/produtos"} className={buttonVariants()}>
              Ver {entidade}
            </Link>
            <Button variant="secondary" onClick={() => { setPlanilha(null); setResultado(null); }}>
              Importar outra planilha
            </Button>
          </div>
        </CardBody>
      </Card>
    );

  if (!planilha)
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardBody className="grid gap-5">
            <fieldset>
              <legend className="mb-2 text-xs font-medium">O que você vai importar?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["clientes", "Clientes", "Nome, CPF/CNPJ, WhatsApp e endereço", Users],
                    ["produtos", "Produtos e peças", "SKU, código de barras, custo e preço", Package],
                  ] as const
                ).map(([k, t, d, I]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={entidade === k}
                    disabled={k === "produtos" && !podeProdutos}
                    onClick={() => setEntidade(k)}
                    className={cn("flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-border-strong disabled:opacity-50", entidade === k && "border-primary bg-primary-soft/50 ring-1 ring-primary")}
                  >
                    <I className="mt-0.5 size-5 text-primary" />
                    <span>
                      <span className="block font-medium">{t}</span>
                      <span className="block text-xs text-fg-subtle">{d}</span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div
              onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
              onDragLeave={() => setArrastando(false)}
              onDrop={(e) => { e.preventDefault(); setArrastando(false); void abrirArquivo(e.dataTransfer.files[0]); }}
              className={cn("flex flex-col items-center rounded-xl border-2 border-dashed border-border-strong px-6 py-12 text-center transition-colors", arrastando && "border-primary bg-primary-soft/40")}
            >
              <FileSpreadsheet className="size-10 text-primary" />
              <p className="mt-3 font-medium">Arraste a planilha aqui</p>
              <p className="mt-1 text-sm text-fg-muted">Excel (.xlsx) ou CSV, até 10 MB</p>
              <Button className="mt-4" onClick={() => input.current?.click()}>
                <Upload /> Escolher arquivo
              </Button>
              <input ref={input} type="file" accept=".xlsx,.xlsm,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" aria-label="Escolher planilha" onChange={(e) => { void abrirArquivo(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader titulo="Como funciona" />
          <CardBody className="grid gap-4 pt-3 text-sm text-fg-muted">
            <ol className="grid list-decimal gap-2 pl-4">
              <li>Envie a planilha que você já usa — reconhecemos as colunas pelo nome.</li>
              <li>Confira a prévia: erros ficam em destaque e você corrige ali mesmo.</li>
              <li>Importe. Duplicados (mesmo CPF/CNPJ ou SKU) são pulados.</li>
            </ol>
            <Button variant="secondary" onClick={() => baixarArquivo(`modelo-${entidade}.csv`, modeloCsv(entidade))}>
              <Download /> Baixar planilha modelo
            </Button>
          </CardBody>
        </Card>
      </div>
    );

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          titulo={planilha.nome}
          descricao={`${numero(planilha.linhas.length)} linhas · ${entidade === "clientes" ? "clientes" : "produtos"}`}
          icone={<FileSpreadsheet />}
          acao={
            <Button variant="ghost" size="sm" onClick={() => setPlanilha(null)}>
              <ArrowLeft /> Trocar arquivo
            </Button>
          }
        />
        <CardBody>
          <p className="mb-3 text-xs font-medium">Colunas reconhecidas — ajuste se algo estiver errado:</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {campos.map((c) => (
              <label key={c.chave} className="grid gap-1 text-xs">
                <span className="flex items-center gap-1 text-fg-muted">
                  {c.rotulo}
                  {c.obrigatorio ? <span className="text-danger">*</span> : null}
                </span>
                <NativeSelect value={String(mapa[c.chave] ?? -1)} onChange={(e) => setMapa({ ...mapa, [c.chave]: Number(e.target.value) })} aria-invalid={c.obrigatorio && mapa[c.chave]! < 0}>
                  <option value="-1">— não importar —</option>
                  {planilha.cabecalhos.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `Coluna ${i + 1}`}
                    </option>
                  ))}
                </NativeSelect>
              </label>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <Badge tom="sucesso">
            <CheckCircle2 /> {numero(prontas.length)} prontas
          </Badge>
          {comErro.length ? (
            <Badge tom="alerta">
              <AlertTriangle /> {numero(comErro.length)} com erro
            </Badge>
          ) : null}
          {pular.size ? <Badge>{pular.size} puladas</Badge> : null}
          <label className="ml-auto flex items-center gap-2 text-xs">
            Mostrar só linhas com erro
            <Switch checked={soErros} onCheckedChange={setSoErros} />
          </label>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="sticky top-0 z-10 bg-surface-2 text-left text-2xs font-medium uppercase tracking-wider text-fg-subtle">
              <tr>
                <th className="w-14 px-3 py-2">Linha</th>
                {colunasVisiveis.map((c) => (
                  <th key={c.chave} className="px-2 py-2 font-medium">{c.rotulo}</th>
                ))}
                <th className="w-20 px-3 py-2 text-right">Importar</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((v) => {
                const ignorada = pular.has(v.i);
                return (
                  <tr key={v.i} className={cn("border-t border-border", ignorada && "opacity-40")}>
                    <td className="tabular px-3 py-1.5 text-fg-subtle">{v.i + 2}</td>
                    {colunasVisiveis.map((c) => {
                      const erro = v.erros[c.chave];
                      return (
                        <td key={c.chave} className="px-1 py-1">
                          <input
                            aria-label={`Linha ${v.i + 2}, ${c.rotulo}`}
                            title={erro}
                            value={String(v.bruto[c.chave] ?? "")}
                            onChange={(e) => setEdicoes({ ...edicoes, [`${v.i}:${c.chave}`]: e.target.value })}
                            className={cn("h-8 w-full min-w-24 rounded border border-transparent bg-transparent px-1.5 hover:border-border focus:border-primary focus:bg-surface focus:outline-none", erro && "border-warning/60 bg-warning-soft text-warning")}
                          />
                          {erro ? <span className="block px-1.5 text-[11px] text-warning">{erro}</span> : null}
                        </td>
                      );
                    })}
                    <td className="px-3 py-1.5 text-right">
                      <Switch
                        checked={!ignorada}
                        aria-label={`Importar linha ${v.i + 2}`}
                        onCheckedChange={(c) =>
                          setPular((s) => {
                            const n = new Set(s);
                            if (c) n.delete(v.i);
                            else n.add(v.i);
                            return n;
                          })
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(soErros ? comErro : validadas).length > 200 ? <p className="px-4 py-3 text-xs text-fg-subtle">Mostrando as primeiras 200 linhas na prévia — todas as {numero(prontas.length)} prontas serão importadas.</p> : null}
          {soErros && !comErro.length ? <p className="px-4 py-8 text-center text-sm text-fg-muted">Nenhuma linha com erro.</p> : null}
        </div>
        <div className="flex flex-col gap-3 border-t border-border bg-surface-2 px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-xs text-fg-muted">
            {faltaObrigatorio ? "Escolha a coluna do nome para continuar." : comErro.length ? `Corrija ou desmarque as ${comErro.length} linha(s) com erro — ou importe só as prontas.` : "Tudo certo para importar."}
          </p>
          {progresso !== null ? <span className="tabular text-xs text-fg-muted">Importando… {progresso}%</span> : null}
          <Button onClick={importar} carregando={progresso !== null} disabled={faltaObrigatorio || !prontas.length}>
            Importar {numero(prontas.length)} {entidade === "clientes" ? "clientes" : "produtos"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

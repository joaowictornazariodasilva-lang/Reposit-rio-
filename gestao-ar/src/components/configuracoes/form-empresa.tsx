"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { salvarEmpresa } from "@/server/actions/configuracoes";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { LogoMarca } from "@/components/brand/logo";
import { mascaraDocumento, mascaraTelefone } from "@/lib/mascaras";

type Empresa = { nome: string; razaoSocial: string | null; cnpj: string | null; telefone: string | null; whatsapp: string | null; email: string | null; endereco: string | null; cidade: string | null; uf: string | null; logo: string | null };

export function FormEmpresa({ empresa }: { empresa: Empresa }) {
  const router = useRouter();
  const [f, setF] = useState({
    nome: empresa.nome,
    razaoSocial: empresa.razaoSocial ?? "",
    cnpj: mascaraDocumento(empresa.cnpj ?? "", "pj"),
    telefone: mascaraTelefone(empresa.telefone ?? ""),
    whatsapp: mascaraTelefone(empresa.whatsapp ?? ""),
    email: empresa.email ?? "",
    endereco: empresa.endereco ?? "",
    cidade: empresa.cidade ?? "",
    uf: empresa.uf ?? "",
    logo: empresa.logo,
  });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();
  const arquivo = useRef<HTMLInputElement>(null);

  function escolherLogo(file?: File) {
    if (!file) return;
    if (file.size > 200 * 1024) return void toast.error("A logo deve ter até 200 KB. Exporte em PNG menor ou SVG.");
    const r = new FileReader();
    r.onload = () => setF((x) => ({ ...x, logo: String(r.result) }));
    r.readAsDataURL(file);
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarEmpresa(f);
      if (!r.ok) {
        setErros(r.campos ?? {});
        return void toast.error(r.erro);
      }
      toast.success("Dados da empresa salvos", { description: "Aparecem no menu, nos PDFs e nas mensagens." });
      router.refresh();
    });
  }

  return (
    <form
      className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
    >
      <Card>
        <CardHeader titulo="Dados da empresa" descricao="Usados em orçamentos, laudos PMOC e mensagens de WhatsApp ({empresa})." />
        <CardBody className="grid grid-cols-2 gap-4">
          <Field label="Nome da empresa (como o cliente conhece)" htmlFor="em-nome" obrigatorio erro={erros.nome} className="col-span-2">
            <Input id="em-nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </Field>
          <Field label="Razão social" htmlFor="em-razao" className="col-span-2 sm:col-span-1">
            <Input id="em-razao" value={f.razaoSocial} onChange={(e) => setF({ ...f, razaoSocial: e.target.value })} />
          </Field>
          <Field label="CNPJ" htmlFor="em-cnpj" erro={erros.cnpj} className="col-span-2 sm:col-span-1">
            <Input id="em-cnpj" inputMode="numeric" value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: mascaraDocumento(e.target.value, "pj") })} />
          </Field>
          <Field label="WhatsApp" htmlFor="em-whats">
            <Input id="em-whats" inputMode="tel" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: mascaraTelefone(e.target.value) })} />
          </Field>
          <Field label="Telefone" htmlFor="em-tel">
            <Input id="em-tel" inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: mascaraTelefone(e.target.value) })} />
          </Field>
          <Field label="E-mail" htmlFor="em-email" erro={erros.email} className="col-span-2">
            <Input id="em-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
          <Field label="Endereço" htmlFor="em-end" className="col-span-2">
            <Input id="em-end" value={f.endereco} onChange={(e) => setF({ ...f, endereco: e.target.value })} />
          </Field>
          <Field label="Cidade" htmlFor="em-cidade">
            <Input id="em-cidade" value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} />
          </Field>
          <Field label="UF" htmlFor="em-uf">
            <Input id="em-uf" value={f.uf} maxLength={2} onChange={(e) => setF({ ...f, uf: e.target.value.toUpperCase() })} />
          </Field>
        </CardBody>
      </Card>
      <div className="grid min-w-0 grid-cols-1 content-start gap-5">
        <Card>
          <CardHeader titulo="Logo" descricao="PNG, JPG ou SVG até 200 KB" />
          <CardBody className="flex flex-col items-center gap-4">
            <div className="grid size-28 place-items-center rounded-xl border border-border bg-surface-2 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {f.logo ? <img src={f.logo} alt="Logo da empresa" className="max-h-full max-w-full object-contain" /> : <LogoMarca className="size-14" />}
            </div>
            {erros.logo ? <p className="text-xs text-danger">{erros.logo}</p> : null}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => arquivo.current?.click()}>
                <ImagePlus /> {f.logo ? "Trocar" : "Enviar logo"}
              </Button>
              {f.logo ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setF({ ...f, logo: null })}>
                  <Trash2 /> Remover
                </Button>
              ) : null}
            </div>
            <input ref={arquivo} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" aria-label="Arquivo da logo" onChange={(e) => escolherLogo(e.target.files?.[0])} />
          </CardBody>
        </Card>
        <Button type="submit" size="lg" carregando={pendente}>
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}

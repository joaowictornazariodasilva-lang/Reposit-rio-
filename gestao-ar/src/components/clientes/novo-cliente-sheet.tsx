"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History } from "lucide-react";
import { criarCliente } from "@/server/actions/clientes";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useRascunho } from "@/hooks/use-rascunho";
import { clienteVazio, FormCliente, paraEnvio } from "./form-cliente";

export function NovoClienteSheet({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const router = useRouter();
  const { valor, setValor, restaurado, limpar } = useRascunho("novo-cliente", clienteVazio, aberto);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();

  function salvar(depois: "abrir" | "equipamento") {
    iniciar(async () => {
      const r = await criarCliente({
        ...paraEnvio(valor),
        local: { ...valor.local, nome: valor.local.nome || undefined },
        contato: valor.tipo === "pj" && valor.contato.nome ? valor.contato : undefined,
      });
      if (!r.ok) {
        setErros(r.campos ?? {});
        toast.error(r.erro);
        const primeiro = Object.keys(r.campos ?? {})[0];
        if (primeiro) document.getElementById(`cli-${primeiro.replace("local.", "local-")}`)?.focus();
        return;
      }
      setErros({});
      limpar();
      toast.success("Cliente cadastrado", { description: valor.nomeFantasia || valor.nome });
      router.push(depois === "equipamento" ? `/clientes/${r.id}?novo=equipamento&cliente=${r.id}` : `/clientes/${r.id}`);
    });
  }

  return (
    <Sheet open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <SheetContent
        titulo="Novo cliente"
        descricao="Só o nome é obrigatório. O resto você completa depois."
        rodape={
          <>
            <Button variant="ghost" onClick={aoFechar} className="mr-auto">
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => salvar("equipamento")} disabled={pendente}>
              Salvar e cadastrar aparelho
            </Button>
            <Button onClick={() => salvar("abrir")} carregando={pendente}>
              Salvar
            </Button>
          </>
        }
      >
        {restaurado ? (
          <div className="mb-5 flex items-center gap-2 rounded-md bg-info-soft px-3 py-2 text-xs text-info" role="status">
            <History className="size-4 shrink-0" />
            <span className="flex-1">Rascunho restaurado — continue de onde parou.</span>
            <button type="button" className="font-medium underline underline-offset-2" onClick={limpar}>
              Começar do zero
            </button>
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvar("abrir");
          }}
        >
          <FormCliente valor={valor} onChange={setValor} erros={erros} />
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
            Salvar
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

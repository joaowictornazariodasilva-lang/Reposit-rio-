"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { atualizarCliente } from "@/server/actions/clientes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { mascaraDocumento, mascaraTelefone } from "@/lib/mascaras";
import { clienteVazio, FormCliente, paraEnvio, type ClienteForm } from "./form-cliente";

type Cliente = {
  id: string;
  tipo: "pf" | "pj";
  nome: string;
  nomeFantasia: string | null;
  documento: string | null;
  inscricaoEstadual: string | null;
  email: string | null;
  whatsapp: string | null;
  telefone: string | null;
  origem: string | null;
  tags: string[];
  notas: string | null;
};

function paraForm(c: Cliente): ClienteForm {
  return {
    ...clienteVazio,
    tipo: c.tipo,
    nome: c.nome,
    nomeFantasia: c.nomeFantasia ?? "",
    documento: mascaraDocumento(c.documento ?? "", c.tipo),
    inscricaoEstadual: c.inscricaoEstadual ?? "",
    email: c.email ?? "",
    whatsapp: mascaraTelefone(c.whatsapp ?? ""),
    telefone: mascaraTelefone(c.telefone ?? ""),
    origem: c.origem ?? "",
    tags: c.tags.join(", "),
    notas: c.notas ?? "",
  };
}

export function EditarCliente({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState<ClienteForm>(() => paraForm(cliente));
  const [erros, setErros] = useState<Record<string, string>>({});
  const [pendente, iniciar] = useTransition();

  function salvar() {
    iniciar(async () => {
      const r = await atualizarCliente(cliente.id, paraEnvio(valor));
      if (!r.ok) {
        setErros(r.campos ?? {});
        return void toast.error(r.erro);
      }
      toast.success("Cliente atualizado");
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <Sheet
      open={aberto}
      onOpenChange={(o) => {
        setAberto(o);
        if (o) {
          setValor(paraForm(cliente));
          setErros({});
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm">
          <Pencil /> Editar
        </Button>
      </SheetTrigger>
      <SheetContent
        titulo="Editar cliente"
        descricao="Endereços e contatos ficam nos cartões ao lado da ficha."
        rodape={
          <>
            <Button variant="ghost" onClick={() => setAberto(false)} className="mr-auto">
              Cancelar
            </Button>
            <Button onClick={salvar} carregando={pendente}>
              Salvar alterações
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvar();
          }}
        >
          <FormCliente valor={valor} onChange={setValor} erros={erros} comEndereco={false} />
          <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
            Salvar
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { nomeDoCliente } from "@/server/actions/clientes";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { equipamentoVazio, FormEquipamento, type EquipamentoForm } from "./form-equipamento";

export function NovoEquipamentoSheet({ aberto, clienteId, aoFechar }: { aberto: boolean; clienteId: string | null; aoFechar: () => void }) {
  const router = useRouter();
  const [inicial, setInicial] = useState<EquipamentoForm | null>(null);

  useEffect(() => {
    if (!aberto) {
      setInicial(null);
      return;
    }
    if (!clienteId) {
      setInicial(equipamentoVazio);
      return;
    }
    let vivo = true;
    void nomeDoCliente(clienteId).then((nome) => {
      if (vivo) setInicial({ ...equipamentoVazio, clienteId: nome ? clienteId : "", clienteNome: nome ?? "" });
    });
    return () => {
      vivo = false;
    };
  }, [aberto, clienteId]);

  return (
    <Sheet open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <SheetContent titulo="Novo equipamento" descricao="Ficha do aparelho: o histórico de serviços fica ligado a ela.">
        {inicial ? (
          <FormEquipamento
            key={inicial.clienteId}
            inicial={inicial}
            travarCliente={!!inicial.clienteId && !!clienteId}
            aoCancelar={aoFechar}
            aoSalvar={(id) => router.push(`/equipamentos/${id}`)}
          />
        ) : (
          <div className="grid h-40 place-items-center text-fg-subtle">
            <Loader2 className="size-5 animate-spin" aria-label="Carregando" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

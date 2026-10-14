"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { excluirEquipamento } from "@/server/actions/equipamentos";
import type { LinhaEquipamento } from "@/server/queries/clientes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormEquipamento } from "./form-equipamento";

export function AcoesEquipamento({ equipamento: e }: { equipamento: LinhaEquipamento }) {
  const router = useRouter();
  const [editar, setEditar] = useState(false);
  const [, iniciar] = useTransition();

  function excluir() {
    iniciar(async () => {
      const r = await excluirEquipamento(e.id);
      if (!r.ok) return void toast.error(r.erro);
      toast("Equipamento excluído", {
        duration: 8000,
        action: {
          label: "Desfazer",
          onClick: async () => {
            await excluirEquipamento(e.id, true);
            toast.success("Exclusão desfeita");
            router.push(`/equipamentos/${e.id}`);
          },
        },
      });
      router.push(`/clientes/${e.clienteId}`);
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setEditar(true)}>
        <Pencil /> Editar
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon-sm" aria-label="Mais ações">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem perigo onSelect={excluir}>
            <Trash2 /> Excluir equipamento
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet open={editar} onOpenChange={setEditar}>
        <SheetContent titulo="Editar equipamento">
          <FormEquipamento
            equipamentoId={e.id}
            travarCliente
            inicial={{
              clienteId: e.clienteId,
              clienteNome: e.cliente,
              localId: e.localId ?? "",
              tipo: e.tipo,
              marca: e.marca,
              modelo: e.modelo ?? "",
              btus: String(e.btus),
              gas: e.gas ?? "",
              tensao: e.tensao ?? "220 V",
              inverter: e.inverter,
              numeroSerie: e.numeroSerie ?? "",
              ambiente: e.ambiente ?? "",
              dataInstalacao: e.dataInstalacao ?? "",
              garantiaAte: e.garantiaAte ?? "",
              instaladoPorNos: e.instaladoPorNos,
              observacoes: e.observacoes ?? "",
            }}
            aoCancelar={() => setEditar(false)}
            aoSalvar={() => {
              setEditar(false);
              router.refresh();
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

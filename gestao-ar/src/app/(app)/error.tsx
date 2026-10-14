"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState
      icone={<TriangleAlert />}
      titulo="Algo deu errado ao carregar esta tela"
      descricao="Seus dados estão seguros. Tente de novo; se continuar, recarregue a página."
      acoes={<Button onClick={reset}><RefreshCw /> Tentar de novo</Button>}
    />
  );
}

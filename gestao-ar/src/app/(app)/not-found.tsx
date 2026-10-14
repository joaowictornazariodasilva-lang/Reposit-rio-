import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function NaoEncontrado() {
  return (
    <EmptyState
      icone={<SearchX />}
      titulo="Página não encontrada"
      descricao="O endereço pode estar errado ou o registro foi excluído. Use a busca (Ctrl+K) para encontrar o que procura."
      acoes={<Link href="/" className={buttonVariants()}>Voltar ao início</Link>}
    />
  );
}

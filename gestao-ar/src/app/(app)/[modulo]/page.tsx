import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirSessao } from "@/server/auth/session";
import { MODULOS_FUTUROS, NAV } from "@/lib/navegacao";
import { EmBreve } from "@/components/em-breve";

export async function generateMetadata({ params }: { params: Promise<{ modulo: string }> }): Promise<Metadata> {
  return { title: MODULOS_FUTUROS[(await params).modulo]?.titulo ?? "Não encontrado" };
}

export default async function ModuloFuturo({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo } = await params;
  if (!Object.hasOwn(MODULOS_FUTUROS, modulo)) notFound();
  const item = NAV.flatMap((g) => g.itens).find((i) => i.href === `/${modulo}`);
  await exigirSessao(item?.permissao);
  return <EmBreve slug={modulo} />;
}

import type { Metadata } from "next";
import { exigirSessao } from "@/server/auth/session";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Nova OS" };

export default async function NovaOs() {
  await exigirSessao("os.ver");
  return <EmBreve slug="ordens" />;
}

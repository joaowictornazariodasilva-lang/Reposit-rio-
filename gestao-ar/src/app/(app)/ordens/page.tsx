import type { Metadata } from "next";
import { exigirSessao } from "@/server/auth/session";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Ordens de serviço" };

export default async function Ordens() {
  await exigirSessao("os.ver");
  return <EmBreve slug="ordens" />;
}

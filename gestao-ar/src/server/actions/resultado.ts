import { z } from "zod";
import { AcessoNegado } from "@/server/auth/session";

export type Resultado<T = { id: string }> = ({ ok: true } & T) | { ok: false; erro: string; campos?: Record<string, string> };

export function errosDeCampo(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = i.path.join(".");
    out[k] ??= i.message;
  }
  return out;
}

export function falha(e: unknown): { ok: false; erro: string } {
  if (e instanceof AcessoNegado) return { ok: false, erro: e.message };
  console.error(e);
  return { ok: false, erro: "Não foi possível salvar agora. Tente de novo em instantes." };
}

/** Texto opcional: vazio vira null. */
export const opcional = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

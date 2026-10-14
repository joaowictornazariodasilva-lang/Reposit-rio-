/** Formatação pt-BR, fuso America/Fortaleza. Usado no servidor e no navegador. */

export const FUSO = "America/Fortaleza";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const inteiro = new Intl.NumberFormat("pt-BR");

export function moeda(v: number | null | undefined): string {
  return brl.format(v ?? 0);
}

export function numero(v: number | null | undefined): string {
  return inteiro.format(v ?? 0);
}

export function btus(v: number): string {
  return `${inteiro.format(v)} BTUs`;
}

/** Datas "puras" (aaaa-mm-dd) não devem sofrer conversão de fuso. */
export function dataCurta(v: string | Date | null | undefined): string {
  if (!v) return "—";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [a, m, d] = v.split("-");
    return `${d}/${m}/${a}`;
  }
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(v),
  );
}

export function dataHora(v: string | Date | null | undefined): string {
  if (!v) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(v));
}

/** Data de hoje em Fortaleza no formato aaaa-mm-dd. */
export function hojeISO(agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

export function dataExtenso(agora = new Date()): string {
  const s = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long", day: "numeric", month: "long" }).format(agora);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function saudacao(agora = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: FUSO, hour: "numeric", hourCycle: "h23" }).format(agora));
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** "há 3 meses", "em 12 dias" — para prazos de limpeza e garantia. */
export function relativo(v: string | Date, agora = new Date()): string {
  const alvo = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00-03:00`) : new Date(v);
  const dias = Math.round((alvo.getTime() - agora.getTime()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const abs = Math.abs(dias);
  if (abs < 31) return rtf.format(dias, "day");
  if (abs < 365) return rtf.format(Math.round(dias / 30), "month");
  return rtf.format(Math.round(dias / 365), "year");
}

export const soDigitos = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

export function documento(v: string | null | undefined): string {
  const d = soDigitos(v);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return v ?? "";
}

export function telefone(v: string | null | undefined): string {
  const d = soDigitos(v).replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return v ?? "";
}

export function cep(v: string | null | undefined): string {
  const d = soDigitos(v);
  return d.length === 8 ? d.replace(/(\d{5})(\d{3})/, "$1-$2") : (v ?? "");
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((p) => p.length > 2 || /^[A-Z]/.test(p));
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? (partes.at(-1)?.[0] ?? "") : "")).toUpperCase();
}

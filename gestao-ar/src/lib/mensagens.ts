import { preencherModelo, primeiroNome } from "./br";
import { MENSAGEM_LIMPEZA_PADRAO, situacaoLimpeza } from "./dominio";
import { btus } from "./format";

/** Mensagem de convite para limpeza com as variáveis preenchidas. */
export function mensagemLimpeza(
  e: { marca: string; btus: number; ambiente: string | null; proximaLimpeza: string | null; ultimaLimpeza: string | Date | null },
  cliente: string,
  empresa: string,
  hoje: string,
  modelo = MENSAGEM_LIMPEZA_PADRAO,
) {
  const s = situacaoLimpeza(e.proximaLimpeza, hoje);
  const meses = e.ultimaLimpeza ? Math.max(1, Math.round((Date.parse(`${hoje}T12:00:00Z`) - new Date(e.ultimaLimpeza).getTime()) / (30 * 86_400_000))) : s.dias !== null ? 6 - Math.round(s.dias / 30) : 6;
  return preencherModelo(modelo, {
    cliente: primeiroNome(cliente),
    empresa,
    aparelho: `${e.marca} ${btus(e.btus)}`,
    ambiente: e.ambiente ?? "seu ambiente",
    meses,
  });
}

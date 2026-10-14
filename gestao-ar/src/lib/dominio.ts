import type { CategoriaServico, StatusOs, TipoEquipamento } from "@/server/db/schema";

export const TIPOS_EQUIPAMENTO: Record<TipoEquipamento, string> = {
  split: "Split hi-wall",
  cassete: "Cassete",
  piso_teto: "Piso-teto",
  vrf: "VRF / VRV",
  janela: "Janela",
  multi_split: "Multi-split",
  portatil: "Portátil",
  duto: "Dutado",
};

export const CATEGORIAS_SERVICO: Record<CategoriaServico, string> = {
  instalacao: "Instalação",
  desinstalacao: "Desinstalação",
  preventiva: "Manutenção preventiva",
  corretiva: "Manutenção corretiva",
  higienizacao: "Limpeza / higienização",
  carga_gas: "Carga de gás",
  visita_tecnica: "Visita técnica",
  pmoc: "PMOC",
  venda_equipamento: "Venda de equipamento",
  outro: "Outro",
};

/** Serviços que "zeram o relógio" da limpeza do aparelho. */
export const CATEGORIAS_LIMPEZA: CategoriaServico[] = ["preventiva", "higienizacao", "pmoc", "instalacao"];

export const STATUS_OS: Record<StatusOs, { rotulo: string; tom: "neutro" | "info" | "alerta" | "sucesso" | "perigo" | "primario" }> = {
  aberta: { rotulo: "Aberta", tom: "neutro" },
  agendada: { rotulo: "Agendada", tom: "info" },
  em_deslocamento: { rotulo: "Em deslocamento", tom: "primario" },
  em_execucao: { rotulo: "Em execução", tom: "primario" },
  aguardando_peca: { rotulo: "Aguardando peça", tom: "alerta" },
  aguardando_aprovacao: { rotulo: "Aguardando aprovação", tom: "alerta" },
  concluida: { rotulo: "Concluída", tom: "sucesso" },
  faturada: { rotulo: "Faturada / paga", tom: "sucesso" },
  cancelada: { rotulo: "Cancelada", tom: "perigo" },
};

export const GASES = ["R-410A", "R-32", "R-22", "R-134a", "R-407C"] as const;
export const BTUS_COMUNS = [7000, 9000, 12000, 18000, 22000, 24000, 30000, 36000, 48000, 57000, 60000] as const;
export const MARCAS_COMUNS = ["LG", "Samsung", "Midea", "Gree", "Elgin", "Daikin", "Fujitsu", "Springer", "Carrier", "Consul", "Electrolux", "Philco", "Komeco", "Agratto", "TCL", "Hitachi"];
export const ORIGENS = ["Indicação", "Instagram", "Google", "WhatsApp", "Já era cliente", "Fachada / passou na frente", "Outro"];

/** Meses padrão entre limpezas quando o tipo de serviço não define. */
export const MESES_LIMPEZA_PADRAO = 6;

export type SituacaoLimpeza = { estado: "vencida" | "proxima" | "em_dia" | "sem_dados"; rotulo: string; dias: number | null };

/** "Termostato" do aparelho: frio = em dia, quente = pede ação. */
export function situacaoLimpeza(proxima: string | null, hoje: string): SituacaoLimpeza {
  if (!proxima) return { estado: "sem_dados", rotulo: "Sem registro de limpeza", dias: null };
  const dias = Math.round((Date.parse(`${proxima}T12:00:00Z`) - Date.parse(`${hoje}T12:00:00Z`)) / 86_400_000);
  const meses = Math.floor(-dias / 30);
  if (dias < 0) return { estado: "vencida", rotulo: meses >= 1 ? `Limpeza atrasada há ${meses} ${meses === 1 ? "mês" : "meses"}` : `Limpeza atrasada há ${-dias} ${dias === -1 ? "dia" : "dias"}`, dias };
  if (dias <= 30) return { estado: "proxima", rotulo: dias === 0 ? "Limpeza vence hoje" : `Limpeza em ${dias} dias`, dias };
  return { estado: "em_dia", rotulo: "Limpeza em dia", dias };
}

export function situacaoGarantia(garantiaAte: string | null, hoje: string): { ativa: boolean; rotulo: string; vencendo: boolean } | null {
  if (!garantiaAte) return null;
  const dias = Math.round((Date.parse(`${garantiaAte}T12:00:00Z`) - Date.parse(`${hoje}T12:00:00Z`)) / 86_400_000);
  if (dias < 0) return { ativa: false, rotulo: "Fora da garantia", vencendo: false };
  return { ativa: true, rotulo: dias <= 30 ? `Garantia vence em ${dias} dias` : "Em garantia", vencendo: dias <= 30 };
}

export const MENSAGEM_LIMPEZA_PADRAO =
  "Olá, {cliente}! Aqui é da {empresa}. O ar-condicionado {aparelho} ({ambiente}) está há {meses} meses sem limpeza. Que tal agendar? Temos horários nesta semana.";

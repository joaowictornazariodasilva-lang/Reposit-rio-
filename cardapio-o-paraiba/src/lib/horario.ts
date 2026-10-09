import type { Expediente } from '../data/restaurante';

export type Situacao =
  | { aberto: true; fechaEm: string; fechandoLogo: boolean }
  | { aberto: false; abreEm: string; quando: 'hoje' | 'amanhã' | string };

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const AVISO_FECHAMENTO_MIN = 45;

function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Dia da semana e minuto do dia no fuso do restaurante, independente do fuso do aparelho. */
export function agoraNoFuso(data: Date, timeZone: string): { dia: number; minuto: number } {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(valor('weekday'));
  return { dia, minuto: Number(valor('hour')) * 60 + Number(valor('minute')) };
}

/** "08:00" → "8h", "15:30" → "15h30". */
export function horaLegivel(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

export function situacao(data: Date, expediente: readonly Expediente[], timeZone: string): Situacao {
  const { dia, minuto } = agoraNoFuso(data, timeZone);

  const hoje = expediente.find((e) => e.dia === dia);
  if (hoje && minuto >= minutos(hoje.abre) && minuto < minutos(hoje.fecha)) {
    return {
      aberto: true,
      fechaEm: horaLegivel(hoje.fecha),
      fechandoLogo: minutos(hoje.fecha) - minuto <= AVISO_FECHAMENTO_MIN,
    };
  }
  if (hoje && minuto < minutos(hoje.abre)) {
    return { aberto: false, abreEm: horaLegivel(hoje.abre), quando: 'hoje' };
  }
  for (let i = 1; i <= 7; i++) {
    const proximo = expediente.find((e) => e.dia === (dia + i) % 7);
    if (proximo) {
      return { aberto: false, abreEm: horaLegivel(proximo.abre), quando: i === 1 ? 'amanhã' : DIAS[proximo.dia] };
    }
  }
  return { aberto: false, abreEm: '', quando: '' };
}

export function textoSituacao(s: Situacao): string {
  if (s.aberto) return s.fechandoLogo ? `Fecha às ${s.fechaEm} — corra!` : `Aberto agora · até ${s.fechaEm}`;
  if (!s.abreEm) return 'Fechado';
  return `Fechado · abre ${s.quando} às ${s.abreEm}`;
}

/** Agrupa dias com o mesmo horário: "Todos os dias, 8h às 15h". */
export function resumoExpediente(expediente: readonly Expediente[]): string {
  const horarios = new Set(expediente.map((e) => `${e.abre}-${e.fecha}`));
  if (expediente.length === 7 && horarios.size === 1) {
    const { abre, fecha } = expediente[0];
    return `Todos os dias, ${horaLegivel(abre)} às ${horaLegivel(fecha)}`;
  }
  return expediente
    .map((e) => `${DIAS[e.dia]}: ${horaLegivel(e.abre)} às ${horaLegivel(e.fecha)}`)
    .join(' · ');
}

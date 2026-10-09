import { describe, expect, it } from 'vitest';
import { horaLegivel, resumoExpediente, situacao, textoSituacao } from './horario';
import type { Expediente } from '../data/restaurante';

const TZ = 'America/Fortaleza';
const todoDia: Expediente[] = [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia, abre: '08:00', fecha: '15:00' }));
// Fortaleza é UTC−3 o ano todo: 11:00Z = 08:00 local.
const em = (isoUtc: string) => new Date(isoUtc);

describe('situacao', () => {
  it('aberto no meio do expediente', () => {
    const s = situacao(em('2026-10-09T15:00:00Z'), todoDia, TZ); // 12h local, sexta
    expect(s).toEqual({ aberto: true, fechaEm: '15h', fechandoLogo: false });
  });

  it('abre exatamente às 8h e fecha exatamente às 15h', () => {
    expect(situacao(em('2026-10-09T11:00:00Z'), todoDia, TZ).aberto).toBe(true);
    expect(situacao(em('2026-10-09T18:00:00Z'), todoDia, TZ).aberto).toBe(false);
  });

  it('avisa quando faltam 45 minutos ou menos', () => {
    const s = situacao(em('2026-10-09T17:20:00Z'), todoDia, TZ); // 14h20 local
    expect(s).toMatchObject({ aberto: true, fechandoLogo: true });
    expect(textoSituacao(s)).toBe('Fecha às 15h — corra!');
  });

  it('antes de abrir: abre hoje', () => {
    const s = situacao(em('2026-10-09T09:30:00Z'), todoDia, TZ); // 6h30 local
    expect(textoSituacao(s)).toBe('Fechado · abre hoje às 8h');
  });

  it('depois de fechar: abre amanhã', () => {
    const s = situacao(em('2026-10-09T22:00:00Z'), todoDia, TZ); // 19h local
    expect(textoSituacao(s)).toBe('Fechado · abre amanhã às 8h');
  });

  it('usa o fuso do restaurante, não o UTC: 01h UTC de sábado ainda é sexta 22h em Fortaleza', () => {
    const soSabado: Expediente[] = [{ dia: 6, abre: '08:00', fecha: '15:00' }];
    const s = situacao(em('2026-10-10T01:00:00Z'), soSabado, TZ);
    expect(textoSituacao(s)).toBe('Fechado · abre amanhã às 8h');
  });

  it('pula dias sem expediente', () => {
    const semDomingo = todoDia.filter((e) => e.dia !== 0);
    const s = situacao(em('2026-10-10T19:00:00Z'), semDomingo, TZ); // sábado 16h
    expect(textoSituacao(s)).toBe('Fechado · abre segunda às 8h');
  });
});

describe('formatação', () => {
  it('horaLegivel', () => {
    expect(horaLegivel('08:00')).toBe('8h');
    expect(horaLegivel('15:30')).toBe('15h30');
  });

  it('resume expediente igual todos os dias', () => {
    expect(resumoExpediente(todoDia)).toBe('Todos os dias, 8h às 15h');
  });
});

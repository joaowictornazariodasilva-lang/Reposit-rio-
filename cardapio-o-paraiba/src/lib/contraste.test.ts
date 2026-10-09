import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contraste } from './contraste';

const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
const token = (nome: string): string => {
  const m = css.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${nome} não encontrado`);
  return m[1];
};

// [texto, fundo] — todos os pares usados na interface.
const pares: [string, string][] = [
  ...['ink', 'ink-soft', 'ink-muted', 'urucum', 'anil', 'mandacaru'].flatMap((t) =>
    ['paper', 'paper-raised', 'paper-deep'].map((f) => [t, f] as [string, string]),
  ),
  ['paper-raised', 'urucum'], // botão primário
  ['paper-raised', 'urucum-deep'], // botão primário em hover
  ['paper', 'ink'], // faixa de categoria, botão ativo da barra
  ['ink-on-dark-muted', 'ink'], // resumo da categoria
  ['ink', 'sol'], // cartões "O que pedir", etiqueta "mais pedido", contador da barra
  ['paper-raised', 'mandacaru'], // botão do WhatsApp
  ['paper-raised', 'mandacaru-deep'], // botão do WhatsApp em hover
];

describe('contraste dos tokens (WCAG AA, texto normal ≥ 4,5:1)', () => {
  it.each(pares)('%s sobre %s', (texto, fundo) => {
    expect(contraste(token(texto), token(fundo))).toBeGreaterThanOrEqual(4.5);
  });

  it('o urucum não é usado sobre o sol (não passa)', () => {
    expect(contraste(token('urucum'), token('sol'))).toBeLessThan(4.5);
  });
});

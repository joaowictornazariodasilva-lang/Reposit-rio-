import { describe, expect, it } from 'vitest';
import { cardapio, destaques } from './cardapio';

const itens = cardapio.flatMap((c) => c.itens);

describe('dados do cardápio', () => {
  it('ids únicos (viram âncoras na página)', () => {
    const ids = [...cardapio.map((c) => c.id), ...itens.map((i) => `item-${i.id}`)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('preços inteiros em centavos e positivos', () => {
    for (const i of itens) {
      if (i.preco !== null) expect(Number.isInteger(i.preco) && i.preco > 0, i.id).toBe(true);
    }
  });

  it('destaques existem e são itens verificados', () => {
    for (const id of destaques) {
      const item = itens.find((i) => i.id === id);
      expect(item, id).toBeDefined();
      expect(item?.verificado, id).toBe(true);
    }
  });

  it('preços publicados na matéria continuam como estão', () => {
    const preco = (id: string) => itens.find((i) => i.id === id)?.preco;
    expect(preco('panelada')).toBe(3500);
    expect(preco('sarrabulho')).toBe(3500);
    expect(preco('carne-de-sol-acebolada')).toBe(3800);
    expect(preco('pudim')).toBe(700);
  });
});

import { describe, expect, it } from 'vitest';
import { formatarPreco, precoCurto } from './preco';

describe('preço', () => {
  it('formata em reais', () => {
    expect(formatarPreco(3500).replace(/\s/g, ' ')).toBe('R$ 35,00');
    expect(formatarPreco(750).replace(/\s/g, ' ')).toBe('R$ 7,50');
  });

  it('versão curta omite centavos zerados', () => {
    expect(precoCurto(3500)).toBe('35');
    expect(precoCurto(3550)).toBe('35,50');
    expect(precoCurto(305)).toBe('3,05');
  });
});

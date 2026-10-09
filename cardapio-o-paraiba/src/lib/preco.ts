const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 3500 → "R$ 35,00" (o Intl usa espaço não separável entre "R$" e o valor). */
export function formatarPreco(centavos: number): string {
  return brl.format(centavos / 100);
}

/** Versão curta para cartões: 3500 → "35", 3550 → "35,50". */
export function precoCurto(centavos: number): string {
  const reais = Math.floor(centavos / 100);
  const resto = centavos % 100;
  return resto === 0 ? String(reais) : `${reais},${String(resto).padStart(2, '0')}`;
}

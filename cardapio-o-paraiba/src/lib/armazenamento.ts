/**
 * localStorage tolerante: em aba anônima, armazenamento bloqueado ou pré-visualização
 * o acesso pode lançar erro — nesse caso o app segue funcionando sem lembrar nada.
 */
export function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto === null ? padrao : (JSON.parse(bruto) as T);
  } catch {
    return padrao;
  }
}

export function gravar(chave: string, valor: unknown): void {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* sem armazenamento: ignora */
  }
}

export interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
}

/** Public ViaCEP lookup (no key). Returns null when the CEP doesn't exist. */
export async function lookupCep(cep: string, signal?: AbortSignal): Promise<CepResult | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
  if (data.erro) return null;
  return {
    street: data.logradouro ?? '',
    neighborhood: data.bairro ?? '',
    city: data.localidade ? `${data.localidade}${data.uf ? ` · ${data.uf}` : ''}` : '',
  };
}

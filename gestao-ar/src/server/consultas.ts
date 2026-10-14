import "server-only";
import { soDigitos } from "@/lib/format";
import { cnpjValido } from "@/lib/br";

/*
 * Preenchimento automático por CEP e CNPJ. Consulta no servidor (sem CORS e sem
 * expor nada no navegador), com fonte reserva e cache de 1 dia.
 */

export type Endereco = { cep: string; logradouro: string; bairro: string; cidade: string; uf: string };
export type DadosCnpj = {
  razaoSocial: string;
  nomeFantasia: string | null;
  email: string | null;
  telefone: string | null;
  situacao: string | null;
  endereco: Endereco & { numero: string | null; complemento: string | null };
};

async function getJson(url: string): Promise<unknown | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { accept: "application/json", "user-agent": "BrisaGestao/1.0 (consulta de CEP/CNPJ)" }, next: { revalidate: 86_400 } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

const titulo = (s: string | null | undefined) =>
  (s ?? "")
    .toLowerCase()
    .replace(/(^|\s|\/|-)(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/\b(De|Da|Do|Das|Dos|E)\b/g, (m) => m.toLowerCase())
    .trim();

export async function consultarCep(cepEntrada: string): Promise<Endereco | null> {
  const cep = soDigitos(cepEntrada);
  if (cep.length !== 8) return null;
  const a = (await getJson(`https://brasilapi.com.br/api/cep/v2/${cep}`)) as { street?: string; neighborhood?: string; city?: string; state?: string } | null;
  if (a?.city) return { cep, logradouro: a.street ?? "", bairro: a.neighborhood ?? "", cidade: a.city, uf: a.state ?? "" };
  const b = (await getJson(`https://viacep.com.br/ws/${cep}/json/`)) as { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean } | null;
  if (b && !b.erro && b.localidade) return { cep, logradouro: b.logradouro ?? "", bairro: b.bairro ?? "", cidade: b.localidade, uf: b.uf ?? "" };
  return null;
}

export async function consultarCnpj(cnpjEntrada: string): Promise<DadosCnpj | null> {
  const cnpj = soDigitos(cnpjEntrada);
  if (!cnpjValido(cnpj)) return null;
  const d = (await getJson(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)) as Record<string, unknown> | null;
  if (!d || typeof d.razao_social !== "string") return consultarCnpjWs(cnpj);
  const s = (k: string) => (typeof d[k] === "string" && d[k] ? (d[k] as string) : null);
  const tel = soDigitos(s("ddd_telefone_1"));
  return {
    razaoSocial: titulo(s("razao_social")),
    nomeFantasia: s("nome_fantasia") ? titulo(s("nome_fantasia")) : null,
    email: s("email")?.toLowerCase() ?? null,
    telefone: tel.length >= 10 ? tel : null,
    situacao: s("descricao_situacao_cadastral"),
    endereco: {
      cep: soDigitos(s("cep")),
      logradouro: titulo([s("descricao_tipo_de_logradouro"), s("logradouro")].filter(Boolean).join(" ")),
      numero: s("numero"),
      complemento: s("complemento") ? titulo(s("complemento")) : null,
      bairro: titulo(s("bairro")),
      cidade: titulo(s("municipio")),
      uf: s("uf") ?? "",
    },
  };
}

/** Fonte reserva: CNPJ.ws (pública, 3 consultas/min). */
async function consultarCnpjWs(cnpj: string): Promise<DadosCnpj | null> {
  type Ws = {
    razao_social?: string;
    estabelecimento?: {
      nome_fantasia?: string | null;
      email?: string | null;
      ddd1?: string | null;
      telefone1?: string | null;
      situacao_cadastral?: string | null;
      cep?: string | null;
      tipo_logradouro?: string | null;
      logradouro?: string | null;
      numero?: string | null;
      complemento?: string | null;
      bairro?: string | null;
      cidade?: { nome?: string } | null;
      estado?: { sigla?: string } | null;
    };
  };
  const d = (await getJson(`https://publica.cnpj.ws/cnpj/${cnpj}`)) as Ws | null;
  if (!d?.razao_social) return null;
  const e = d.estabelecimento ?? {};
  const tel = soDigitos(`${e.ddd1 ?? ""}${e.telefone1 ?? ""}`);
  return {
    razaoSocial: titulo(d.razao_social),
    nomeFantasia: e.nome_fantasia ? titulo(e.nome_fantasia) : null,
    email: e.email?.toLowerCase() ?? null,
    telefone: tel.length >= 10 ? tel : null,
    situacao: e.situacao_cadastral ?? null,
    endereco: {
      cep: soDigitos(e.cep),
      logradouro: titulo([e.tipo_logradouro, e.logradouro].filter(Boolean).join(" ")),
      numero: e.numero ?? null,
      complemento: e.complemento ? titulo(e.complemento) : null,
      bairro: titulo(e.bairro),
      cidade: titulo(e.cidade?.nome),
      uf: e.estado?.sigla ?? "",
    },
  };
}

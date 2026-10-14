import { documentoValido } from "./br";
import { soDigitos } from "./format";

/*
 * Importação de planilhas — regras puras (rodam no navegador para a
 * pré-visualização e de novo no servidor, que é quem decide).
 */

export type Entidade = "clientes" | "produtos";

export type Campo = { chave: string; rotulo: string; obrigatorio?: boolean; sinonimos: string[]; exemplo: string };

export const CAMPOS: Record<Entidade, Campo[]> = {
  clientes: [
    { chave: "nome", rotulo: "Nome / razão social", obrigatorio: true, sinonimos: ["nome", "cliente", "razao social", "nome completo", "nome do cliente", "razao"], exemplo: "Maria da Silva" },
    { chave: "nomeFantasia", rotulo: "Nome fantasia", sinonimos: ["fantasia", "nome fantasia", "apelido"], exemplo: "" },
    { chave: "documento", rotulo: "CPF/CNPJ", sinonimos: ["cpf", "cnpj", "cpf/cnpj", "cpf cnpj", "documento", "doc"], exemplo: "123.456.789-09" },
    { chave: "whatsapp", rotulo: "WhatsApp / celular", sinonimos: ["whatsapp", "whats", "celular", "cel", "zap", "telefone celular", "fone"], exemplo: "(85) 99999-1234" },
    { chave: "telefone", rotulo: "Telefone fixo", sinonimos: ["telefone", "tel", "fixo", "telefone fixo"], exemplo: "" },
    { chave: "email", rotulo: "E-mail", sinonimos: ["email", "e-mail", "e mail", "correio"], exemplo: "maria@email.com" },
    { chave: "cep", rotulo: "CEP", sinonimos: ["cep", "codigo postal"], exemplo: "60160-230" },
    { chave: "logradouro", rotulo: "Endereço (rua)", sinonimos: ["endereco", "logradouro", "rua", "avenida", "end"], exemplo: "Av. Dom Luís" },
    { chave: "numero", rotulo: "Número", sinonimos: ["numero", "nº", "n", "num", "no"], exemplo: "500" },
    { chave: "complemento", rotulo: "Complemento", sinonimos: ["complemento", "compl", "apto", "apartamento"], exemplo: "Apto 1201" },
    { chave: "bairro", rotulo: "Bairro", sinonimos: ["bairro"], exemplo: "Meireles" },
    { chave: "cidade", rotulo: "Cidade", sinonimos: ["cidade", "municipio"], exemplo: "Fortaleza" },
    { chave: "uf", rotulo: "UF", sinonimos: ["uf", "estado"], exemplo: "CE" },
    { chave: "tags", rotulo: "Etiquetas", sinonimos: ["tags", "etiquetas", "grupo", "categoria", "segmento"], exemplo: "VIP" },
    { chave: "notas", rotulo: "Observações", sinonimos: ["obs", "observacao", "observacoes", "notas", "anotacoes"], exemplo: "" },
  ],
  produtos: [
    { chave: "nome", rotulo: "Nome", obrigatorio: true, sinonimos: ["nome", "produto", "descricao", "item", "peca"], exemplo: "Capacitor 35+5 µF" },
    { chave: "sku", rotulo: "SKU / código", sinonimos: ["sku", "codigo", "cod", "referencia", "ref", "codigo interno"], exemplo: "CAP-355" },
    { chave: "codigoBarras", rotulo: "Código de barras", sinonimos: ["codigo de barras", "ean", "gtin", "barras", "cod barras"], exemplo: "7891234567895" },
    { chave: "categoria", rotulo: "Categoria", sinonimos: ["categoria", "grupo", "familia"], exemplo: "Peças de reposição" },
    { chave: "fornecedor", rotulo: "Fornecedor", sinonimos: ["fornecedor", "distribuidor", "marca"], exemplo: "Dufrio" },
    { chave: "unidade", rotulo: "Unidade", sinonimos: ["unidade", "un", "und", "medida"], exemplo: "un" },
    { chave: "custo", rotulo: "Custo (R$)", sinonimos: ["custo", "preco de custo", "valor de custo", "compra"], exemplo: "28,00" },
    { chave: "preco", rotulo: "Preço de venda (R$)", sinonimos: ["preco", "preco de venda", "valor", "venda", "valor de venda"], exemplo: "75,00" },
    { chave: "estoqueMinimo", rotulo: "Estoque mínimo", sinonimos: ["estoque minimo", "minimo", "min"], exemplo: "5" },
  ],
};

export const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9/º ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Mapeia cabeçalhos da planilha → campos do sistema (índice da coluna ou -1). */
export function mapearColunas(entidade: Entidade, cabecalhos: string[]): Record<string, number> {
  const norm = cabecalhos.map((h) => normalizar(String(h ?? "")));
  const usados = new Set<number>();
  const out: Record<string, number> = {};
  for (const c of CAMPOS[entidade]) {
    let idx = norm.findIndex((h, i) => !usados.has(i) && [c.rotulo, ...c.sinonimos].some((s) => h === normalizar(s)));
    if (idx < 0) idx = norm.findIndex((h, i) => !usados.has(i) && h.length > 2 && c.sinonimos.some((s) => normalizar(s).length > 3 && h.includes(normalizar(s))));
    out[c.chave] = idx;
    if (idx >= 0) usados.add(idx);
  }
  return out;
}

/** "R$ 1.234,56" → 1234.56 · "55.5" → 55.5 · "" → null */
export function lerNumero(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v ?? "").replace(/R\$|\s/g, "");
  if (!s) return null;
  const t = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const texto = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export type LinhaImportada = { dados: Record<string, string | number | string[] | null>; erros: Record<string, string> };

export function validarLinha(entidade: Entidade, bruto: Record<string, unknown>): LinhaImportada {
  const erros: Record<string, string> = {};
  const dados: LinhaImportada["dados"] = {};
  if (entidade === "clientes") {
    const nome = texto(bruto.nome);
    if (nome.length < 2) erros.nome = "Nome obrigatório";
    dados.nome = nome;
    dados.nomeFantasia = texto(bruto.nomeFantasia) || null;
    const doc = soDigitos(texto(bruto.documento));
    if (doc && !documentoValido(doc)) erros.documento = "CPF/CNPJ inválido";
    dados.documento = doc || null;
    dados.tipo = doc.length === 14 ? "pj" : "pf";
    for (const k of ["whatsapp", "telefone"] as const) {
      let d = soDigitos(texto(bruto[k]));
      if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
      if (d && (d.length < 10 || d.length > 11)) erros[k] = "Telefone com DDD";
      dados[k] = d || null;
    }
    const email = texto(bruto.email).toLowerCase();
    if (email && !emailOk(email)) erros.email = "E-mail inválido";
    dados.email = email || null;
    const cep = soDigitos(texto(bruto.cep));
    if (cep && cep.length !== 8) erros.cep = "CEP com 8 dígitos";
    dados.cep = cep || null;
    for (const k of ["logradouro", "numero", "complemento", "bairro", "cidade", "notas"] as const) dados[k] = texto(bruto[k]) || null;
    const uf = texto(bruto.uf).toUpperCase();
    if (uf && !/^[A-Z]{2}$/.test(uf)) erros.uf = "UF com 2 letras";
    dados.uf = uf || null;
    dados.tags = texto(bruto.tags)
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12);
  } else {
    const nome = texto(bruto.nome);
    if (nome.length < 2) erros.nome = "Nome obrigatório";
    dados.nome = nome;
    dados.sku = texto(bruto.sku).toUpperCase() || null;
    const ean = soDigitos(texto(bruto.codigoBarras));
    if (ean && (ean.length < 8 || ean.length > 14)) erros.codigoBarras = "8 a 14 dígitos";
    dados.codigoBarras = ean || null;
    dados.categoria = texto(bruto.categoria) || null;
    dados.fornecedor = texto(bruto.fornecedor) || null;
    const un = normalizar(texto(bruto.unidade));
    const mapaUn: Record<string, string> = { un: "un", und: "un", unidade: "un", pc: "un", peca: "un", m: "m", metro: "m", metros: "m", kg: "kg", quilo: "kg", l: "l", litro: "l", cx: "cx", caixa: "cx", par: "par" };
    if (un && !mapaUn[un]) erros.unidade = "Use un, m, kg, l, cx ou par";
    dados.unidade = mapaUn[un] ?? "un";
    for (const k of ["custo", "preco", "estoqueMinimo"] as const) {
      const n = lerNumero(bruto[k]);
      if (texto(bruto[k]) && n === null) erros[k] = "Número inválido";
      else if (n !== null && n < 0) erros[k] = "Não pode ser negativo";
      dados[k] = n ?? 0;
    }
  }
  return { dados, erros };
}

/** Modelo de planilha (CSV com ; para abrir certo no Excel brasileiro). */
export function modeloCsv(entidade: Entidade): string {
  const c = CAMPOS[entidade];
  return `﻿${c.map((x) => x.rotulo).join(";")}\r\n${c.map((x) => x.exemplo).join(";")}\r\n`;
}

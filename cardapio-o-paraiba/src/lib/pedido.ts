import { formatarPreco } from './preco';

/** Uma linha do carrinho: id do item no cardápio + quantidade. */
export type LinhaPedido = { id: string; quantidade: number };

/** Item resolvido para exibição/mensagem (nome e preço vêm do cardápio, nunca do armazenamento). */
export type ItemPedido = { id: string; nome: string; preco: number; quantidade: number };

export type Modalidade = 'salao' | 'retirada' | 'entrega';
export type Pagamento = 'pix' | 'cartao' | 'dinheiro';

export const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  salao: 'Comer no salão',
  retirada: 'Retirar no balcão',
  entrega: 'Entrega',
};

export const ROTULO_PAGAMENTO: Record<Pagamento, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
};

export type DadosCliente = {
  nome: string;
  telefone: string;
  modalidade: Modalidade;
  mesa: string;
  endereco: string;
  pagamento: Pagamento;
  troco: string;
  observacao: string;
};

export const DADOS_VAZIOS: DadosCliente = {
  nome: '',
  telefone: '',
  modalidade: 'retirada',
  mesa: '',
  endereco: '',
  pagamento: 'pix',
  troco: '',
  observacao: '',
};

export const QUANTIDADE_MAXIMA = 20;

/* ───────────── Carrinho (reducer puro) ───────────── */

export type Acao =
  | { tipo: 'adicionar'; id: string }
  | { tipo: 'remover'; id: string }
  | { tipo: 'definir'; id: string; quantidade: number }
  | { tipo: 'limpar' };

export function carrinhoReducer(linhas: LinhaPedido[], acao: Acao): LinhaPedido[] {
  switch (acao.tipo) {
    case 'adicionar': {
      const atual = linhas.find((l) => l.id === acao.id);
      if (!atual) return [...linhas, { id: acao.id, quantidade: 1 }];
      return carrinhoReducer(linhas, { tipo: 'definir', id: acao.id, quantidade: atual.quantidade + 1 });
    }
    case 'remover': {
      const atual = linhas.find((l) => l.id === acao.id);
      if (!atual) return linhas;
      return carrinhoReducer(linhas, { tipo: 'definir', id: acao.id, quantidade: atual.quantidade - 1 });
    }
    case 'definir': {
      const quantidade = Math.min(QUANTIDADE_MAXIMA, Math.max(0, Math.floor(acao.quantidade)));
      if (quantidade === 0) return linhas.filter((l) => l.id !== acao.id);
      if (!linhas.some((l) => l.id === acao.id)) return [...linhas, { id: acao.id, quantidade }];
      return linhas.map((l) => (l.id === acao.id ? { ...l, quantidade } : l));
    }
    case 'limpar':
      return [];
  }
}

/**
 * Cruza o carrinho com o cardápio atual. Descarta ids que não existem mais ou
 * itens sem preço/não pedíveis — o carrinho salvo no aparelho pode estar velho.
 */
export function resolverItens(
  linhas: LinhaPedido[],
  catalogo: ReadonlyMap<string, { nome: string; preco: number | null; pedivel?: boolean }>,
): ItemPedido[] {
  const itens: ItemPedido[] = [];
  for (const l of linhas) {
    const item = catalogo.get(l.id);
    if (!item || item.preco === null || item.pedivel === false) continue;
    const quantidade = Math.min(QUANTIDADE_MAXIMA, Math.max(0, Math.floor(l.quantidade)));
    if (quantidade > 0) itens.push({ id: l.id, nome: item.nome, preco: item.preco, quantidade });
  }
  return itens;
}

export function totalItens(itens: ItemPedido[]): { quantidade: number; centavos: number } {
  return itens.reduce(
    (acc, i) => ({ quantidade: acc.quantidade + i.quantidade, centavos: acc.centavos + i.preco * i.quantidade }),
    { quantidade: 0, centavos: 0 },
  );
}

/* ───────────── Telefone ───────────── */

/** Só dígitos, sem DDI 55 na frente. */
export function digitosTelefone(texto: string): string {
  let d = texto.replace(/\D/g, '');
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  return d.slice(0, 11);
}

/** Celular (11 dígitos, começa com 9 depois do DDD) ou fixo (10 dígitos). DDD 11–99. */
export function telefoneValido(texto: string): boolean {
  const d = digitosTelefone(texto);
  if (!/^[1-9][1-9]/.test(d)) return false;
  return (d.length === 11 && d[2] === '9') || (d.length === 10 && /[2-5]/.test(d[2]));
}

/** Máscara progressiva enquanto digita: "85987" → "(85) 987". */
export function mascararTelefone(texto: string): string {
  const d = digitosTelefone(texto);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  const corte = d.length === 11 ? 5 : 4;
  if (resto.length <= corte) return `(${ddd}) ${resto}`;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

/* ───────────── Validação ───────────── */

export type Erros = Partial<Record<keyof DadosCliente | 'itens', string>>;

export function validarPedido(itens: ItemPedido[], dados: DadosCliente): Erros {
  const erros: Erros = {};
  if (itens.length === 0) erros.itens = 'Adicione pelo menos um prato ao pedido.';
  if (dados.nome.trim().length < 2) erros.nome = 'Escreva seu nome para a casa saber de quem é o pedido.';
  if (!telefoneValido(dados.telefone)) erros.telefone = 'Informe um telefone com DDD, por exemplo (85) 98765-4321.';
  if (dados.modalidade === 'entrega' && dados.endereco.trim().length < 8)
    erros.endereco = 'Informe rua, número e bairro para a entrega.';
  if (dados.pagamento === 'dinheiro' && dados.troco.trim() && !/^\d+([,.]\d{1,2})?$/.test(dados.troco.trim()))
    erros.troco = 'Escreva só o valor, por exemplo 100 ou 50,00.';
  return erros;
}

/* ───────────── Mensagem do WhatsApp ───────────── */

function trocoEmCentavos(texto: string): number | null {
  const t = texto.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

/** Texto enviado ao WhatsApp do restaurante. Usa *negrito* do próprio WhatsApp. */
export function montarMensagem(nomeCasa: string, itens: ItemPedido[], dados: DadosCliente): string {
  const nbsp = (s: string) => s.replace(/ /g, ' ');
  const { centavos } = totalItens(itens);
  const linhas: string[] = [];

  linhas.push(`*Novo pedido — ${nomeCasa}*`, '');
  linhas.push(`*Cliente:* ${dados.nome.trim()}`);
  linhas.push(`*Telefone:* ${mascararTelefone(dados.telefone)}`);
  linhas.push(`*Como:* ${ROTULO_MODALIDADE[dados.modalidade]}`);
  if (dados.modalidade === 'salao' && dados.mesa.trim()) linhas.push(`*Mesa:* ${dados.mesa.trim()}`);
  if (dados.modalidade === 'entrega') linhas.push(`*Endereço:* ${dados.endereco.trim()}`);
  linhas.push('', '*Itens*');
  for (const i of itens) {
    linhas.push(`${i.quantidade}x ${i.nome} — ${nbsp(formatarPreco(i.preco * i.quantidade))}`);
  }
  linhas.push('', `*Total:* ${nbsp(formatarPreco(centavos))}`);
  if (dados.modalidade === 'entrega') linhas.push('_Taxa de entrega a combinar._');

  let pagamento = ROTULO_PAGAMENTO[dados.pagamento];
  const troco = dados.pagamento === 'dinheiro' ? trocoEmCentavos(dados.troco) : null;
  if (troco !== null) pagamento += ` (troco para ${nbsp(formatarPreco(troco))})`;
  linhas.push(`*Pagamento:* ${pagamento}`);

  if (dados.observacao.trim()) linhas.push(`*Observações:* ${dados.observacao.trim()}`);
  linhas.push('', '_Pedido feito pelo cardápio digital._');
  return linhas.join('\n');
}

export function linkWhatsApp(numero: string, texto: string): string {
  return `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
}

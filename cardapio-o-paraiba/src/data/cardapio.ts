/**
 * Cardápio. Preços em centavos (evita erro de ponto flutuante).
 *
 * `verificado: true`  → item e preço publicados na matéria do Sabores da Cidade (set/2026).
 * `verificado: false` → item típico da casa/região com preço ESTIMADO para a prévia;
 *                       confirmar com o restaurante e então trocar para `true`.
 */

export type Etiqueta = 'mais-pedido' | 'serve-2' | 'da-casa';

export type Item = {
  id: string;
  nome: string;
  descricao: string;
  /** Centavos. `null` = preço sob consulta. */
  preco: number | null;
  /** Texto curto antes do preço, ex.: "a partir de". */
  prefixoPreco?: string;
  etiquetas?: Etiqueta[];
  verificado: boolean;
  /** `false` = aparece no cardápio mas não entra no carrinho (ex.: self-service, montado no salão). */
  pedivel?: boolean;
};

export type Categoria = {
  id: string;
  nome: string;
  resumo?: string;
  itens: Item[];
};

export const cardapio: Categoria[] = [
  {
    id: 'pratos-da-casa',
    nome: 'Pratos da casa',
    resumo: 'Servidos com acompanhamentos. Acompanhamento pode repetir.',
    itens: [
      {
        id: 'panelada',
        nome: 'Panelada',
        descricao:
          'Bucho e tripa cozidos devagar no tempero da casa. Vem com arroz, cuscuz, cheiro-verde e limão — monte do seu jeito.',
        preco: 3500,
        etiquetas: ['mais-pedido', 'da-casa'],
        verificado: true,
      },
      {
        id: 'sarrabulho',
        nome: 'Sarrabulho',
        descricao: 'Miúdos de porco bem temperados. Acompanha arroz, macarrão, feijão e salada.',
        preco: 3500,
        etiquetas: ['da-casa'],
        verificado: true,
      },
      {
        id: 'carne-de-sol-acebolada',
        nome: 'Carne de sol acebolada',
        descricao: 'Carne de sol com cebola dourada na hora. Acompanha arroz, macarrão, feijão e salada.',
        preco: 3800,
        etiquetas: ['mais-pedido'],
        verificado: true,
      },
      {
        id: 'galinha-caipira',
        nome: 'Galinha caipira',
        descricao: 'Galinha caipira cozida no caldo grosso. Acompanha arroz, feijão e pirão.',
        preco: 3800,
        verificado: false,
      },
      {
        id: 'bisteca',
        nome: 'Bisteca de porco',
        descricao: 'Bisteca frita na hora. Acompanha arroz, macarrão, feijão e salada.',
        preco: 3200,
        verificado: false,
      },
    ],
  },
  {
    id: 'self-service',
    nome: 'Self-service',
    resumo: 'Comida do dia na panela, você monta o prato.',
    itens: [
      {
        id: 'self-service-livre',
        nome: 'Prato no self-service',
        descricao: 'Arroz, feijão, macarrão, saladas e as carnes do dia. Alguns pratos especiais saem por um pouco mais.',
        preco: 3500,
        prefixoPreco: 'a partir de',
        verificado: true,
        pedivel: false,
      },
    ],
  },
  {
    id: 'acompanhamentos',
    nome: 'Acompanhamentos extras',
    itens: [
      { id: 'baiao', nome: 'Baião de dois', descricao: 'Porção com queijo coalho.', preco: 1200, verificado: false },
      { id: 'cuscuz', nome: 'Cuscuz', descricao: 'Porção de cuscuz de milho.', preco: 600, verificado: false },
      { id: 'farofa', nome: 'Farofa de manteiga', descricao: 'Porção.', preco: 600, verificado: false },
      { id: 'pirao', nome: 'Pirão', descricao: 'Porção.', preco: 600, verificado: false },
    ],
  },
  {
    id: 'bebidas',
    nome: 'Bebidas',
    itens: [
      { id: 'suco', nome: 'Suco da fruta', descricao: 'Copo. Pergunte os sabores do dia.', preco: 700, verificado: false },
      { id: 'cajuina', nome: 'Cajuína', descricao: 'Garrafa 290 ml.', preco: 700, verificado: false },
      { id: 'refri-lata', nome: 'Refrigerante lata', descricao: '350 ml.', preco: 600, verificado: false },
      { id: 'refri-litro', nome: 'Refrigerante 1 litro', descricao: 'Para a mesa.', preco: 1000, etiquetas: ['serve-2'], verificado: false },
      { id: 'agua', nome: 'Água mineral', descricao: '500 ml, com ou sem gás.', preco: 300, verificado: false },
    ],
  },
  {
    id: 'sobremesas',
    nome: 'Sobremesa',
    itens: [
      {
        id: 'pudim',
        nome: 'Pudim',
        descricao: 'A fatia. Feito na casa.',
        preco: 700,
        etiquetas: ['da-casa'],
        verificado: true,
      },
    ],
  },
];

/** Os três pratos recomendados em "O que pedir" (mesma ordem da matéria). */
export const destaques = ['panelada', 'sarrabulho', 'carne-de-sol-acebolada'];

/** Regras da casa que aparecem junto do self-service. */
export const regrasDaCasa = [
  { titulo: 'Repetir é liberado', texto: 'Acompanhamento pode repetir à vontade.' },
  { titulo: 'Desperdício: R$ 5', texto: 'Se sobrar comida no prato, é cobrada uma taxa de R$ 5.' },
];

/** Índice id → item, usado pelo carrinho para buscar nome e preço sempre do cardápio atual. */
export const catalogo: ReadonlyMap<string, Item> = new Map(
  cardapio.flatMap((c) => c.itens.map((i) => [i.id, i] as const)),
);

import { describe, expect, it } from 'vitest';
import {
  DADOS_VAZIOS,
  QUANTIDADE_MAXIMA,
  carrinhoReducer,
  linkWhatsApp,
  mascararTelefone,
  montarMensagem,
  resolverItens,
  telefoneValido,
  totalItens,
  validarPedido,
  type DadosCliente,
} from './pedido';

const catalogo = new Map([
  ['panelada', { nome: 'Panelada', preco: 3500 }],
  ['pudim', { nome: 'Pudim', preco: 700 }],
  ['self', { nome: 'Self-service', preco: 3500, pedivel: false }],
  ['consulta', { nome: 'Prato do dia', preco: null }],
]);

describe('carrinho', () => {
  it('adiciona, soma e remove', () => {
    let c = carrinhoReducer([], { tipo: 'adicionar', id: 'panelada' });
    c = carrinhoReducer(c, { tipo: 'adicionar', id: 'panelada' });
    c = carrinhoReducer(c, { tipo: 'adicionar', id: 'pudim' });
    expect(c).toEqual([
      { id: 'panelada', quantidade: 2 },
      { id: 'pudim', quantidade: 1 },
    ]);
    c = carrinhoReducer(c, { tipo: 'remover', id: 'pudim' });
    expect(c).toEqual([{ id: 'panelada', quantidade: 2 }]);
  });

  it('limita a quantidade e nunca fica negativa', () => {
    const c = carrinhoReducer([], { tipo: 'definir', id: 'panelada', quantidade: 999 });
    expect(c[0].quantidade).toBe(QUANTIDADE_MAXIMA);
    expect(carrinhoReducer(c, { tipo: 'definir', id: 'panelada', quantidade: -3 })).toEqual([]);
    expect(carrinhoReducer([], { tipo: 'remover', id: 'nada' })).toEqual([]);
  });

  it('resolve contra o cardápio atual e ignora itens velhos ou não pedíveis', () => {
    const itens = resolverItens(
      [
        { id: 'panelada', quantidade: 2 },
        { id: 'sumiu', quantidade: 1 },
        { id: 'self', quantidade: 1 },
        { id: 'consulta', quantidade: 1 },
      ],
      catalogo,
    );
    expect(itens).toEqual([{ id: 'panelada', nome: 'Panelada', preco: 3500, quantidade: 2 }]);
    expect(totalItens(itens)).toEqual({ quantidade: 2, centavos: 7000 });
  });
});

describe('telefone', () => {
  it.each([
    ['(85) 98705-4152', true],
    ['85987054152', true],
    ['+55 85 98705-4152', true],
    ['(85) 3231-0306', true],
    ['8598705415', false], // celular sem um dígito vira fixo começando com 9: inválido
    ['(85) 8705-4152', false],
    ['98705-4152', false], // sem DDD
    ['', false],
  ])('%s → %s', (tel, ok) => {
    expect(telefoneValido(tel)).toBe(ok);
  });

  it('máscara progressiva', () => {
    expect(mascararTelefone('8')).toBe('(8');
    expect(mascararTelefone('85987')).toBe('(85) 987');
    expect(mascararTelefone('859870541')).toBe('(85) 9870-541');
    expect(mascararTelefone('85987054152')).toBe('(85) 98705-4152');
    expect(mascararTelefone('5585987054152')).toBe('(85) 98705-4152');
  });
});

const joao: DadosCliente = { ...DADOS_VAZIOS, nome: 'João', telefone: '85999990000' };
const itens = resolverItens(
  [
    { id: 'panelada', quantidade: 2 },
    { id: 'pudim', quantidade: 1 },
  ],
  catalogo,
);

describe('validação', () => {
  it('pedido completo passa', () => {
    expect(validarPedido(itens, joao)).toEqual({});
  });

  it('aponta nome, telefone e itens', () => {
    const erros = validarPedido([], DADOS_VAZIOS);
    expect(Object.keys(erros).sort()).toEqual(['itens', 'nome', 'telefone']);
  });

  it('entrega exige endereço; troco só aceita valor', () => {
    expect(validarPedido(itens, { ...joao, modalidade: 'entrega' }).endereco).toBeDefined();
    expect(validarPedido(itens, { ...joao, pagamento: 'dinheiro', troco: 'cem' }).troco).toBeDefined();
    expect(validarPedido(itens, { ...joao, pagamento: 'dinheiro', troco: '100,00' })).toEqual({});
  });
});

describe('mensagem do WhatsApp', () => {
  it('lista cliente, itens, total e pagamento', () => {
    const msg = montarMensagem('O Paraíba', itens, {
      ...joao,
      pagamento: 'dinheiro',
      troco: '100',
      observacao: 'Panelada sem pimenta',
    });
    expect(msg).toBe(
      [
        '*Novo pedido — O Paraíba*',
        '',
        '*Cliente:* João',
        '*Telefone:* (85) 99999-0000',
        '*Como:* Retirar no balcão',
        '',
        '*Itens*',
        '2x Panelada — R$ 70,00',
        '1x Pudim — R$ 7,00',
        '',
        '*Total:* R$ 77,00',
        '*Pagamento:* Dinheiro (troco para R$ 100,00)',
        '*Observações:* Panelada sem pimenta',
        '',
        '_Pedido feito pelo cardápio digital._',
      ].join('\n'),
    );
  });

  it('entrega inclui endereço e aviso da taxa; salão inclui mesa', () => {
    const entrega = montarMensagem('O Paraíba', itens, { ...joao, modalidade: 'entrega', endereco: 'Rua A, 10 - Aerolândia' });
    expect(entrega).toContain('*Endereço:* Rua A, 10 - Aerolândia');
    expect(entrega).toContain('Taxa de entrega a combinar');
    const salao = montarMensagem('O Paraíba', itens, { ...joao, modalidade: 'salao', mesa: '7' });
    expect(salao).toContain('*Mesa:* 7');
  });

  it('gera link wa.me com o texto codificado', () => {
    const link = linkWhatsApp('55 (85) 98705-4152', 'Olá & tchau\n2x');
    expect(link).toBe('https://wa.me/5585987054152?text=Ol%C3%A1%20%26%20tchau%0A2x');
  });
});

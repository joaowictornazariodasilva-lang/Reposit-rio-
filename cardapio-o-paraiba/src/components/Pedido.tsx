import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { catalogo } from '../data/cardapio';
import type { Item } from '../data/cardapio';
import { MODO_PREVIA, restaurante } from '../data/restaurante';
import { ler, gravar } from '../lib/armazenamento';
import { situacao, textoSituacao } from '../lib/horario';
import {
  DADOS_VAZIOS,
  QUANTIDADE_MAXIMA,
  ROTULO_MODALIDADE,
  ROTULO_PAGAMENTO,
  carrinhoReducer,
  linkWhatsApp,
  mascararTelefone,
  montarMensagem,
  resolverItens,
  totalItens,
  validarPedido,
  type DadosCliente,
  type Erros,
  type ItemPedido,
  type LinhaPedido,
  type Modalidade,
  type Pagamento,
} from '../lib/pedido';
import { formatarPreco } from '../lib/preco';

const CHAVE_CARRINHO = 'oparaiba:carrinho';
const CHAVE_CLIENTE = 'oparaiba:cliente';

/* ───────────── Estado ───────────── */

type Contexto = {
  itens: ItemPedido[];
  total: { quantidade: number; centavos: number };
  quantidadeDe: (id: string) => number;
  adicionar: (id: string) => void;
  remover: (id: string) => void;
  limpar: () => void;
  dados: DadosCliente;
  setDados: (d: DadosCliente) => void;
  painelAberto: boolean;
  abrirPainel: () => void;
  fecharPainel: () => void;
};

const PedidoContexto = createContext<Contexto | null>(null);

export function usePedido(): Contexto {
  const ctx = useContext(PedidoContexto);
  if (!ctx) throw new Error('usePedido fora de <PedidoProvider>');
  return ctx;
}

/** Só o que vale lembrar para o próximo pedido (observação e troco são de cada pedido). */
function dadosParaGuardar({ nome, telefone, modalidade, endereco, pagamento }: DadosCliente) {
  return { nome, telefone, modalidade, endereco, pagamento };
}

export function PedidoProvider({ children }: { children: ReactNode }) {
  const [linhas, despachar] = useReducer(carrinhoReducer, undefined, () => {
    const salvo = ler<unknown>(CHAVE_CARRINHO, []);
    return Array.isArray(salvo) ? (salvo as LinhaPedido[]) : [];
  });
  const [dados, setDadosEstado] = useState<DadosCliente>(() => {
    const salvo = ler<Partial<DadosCliente>>(CHAVE_CLIENTE, {});
    const dados = { ...DADOS_VAZIOS, ...salvo };
    // A casa pode ter tirado uma modalidade depois que o cliente a usou.
    if (!(restaurante.modalidades as readonly string[]).includes(dados.modalidade)) {
      dados.modalidade = restaurante.modalidades[0];
    }
    return dados;
  });
  const [painelAberto, setPainelAberto] = useState(false);
  const [anuncio, setAnuncio] = useState('');

  const itens = useMemo(() => resolverItens(linhas, catalogo), [linhas]);
  const total = useMemo(() => totalItens(itens), [itens]);

  useEffect(() => gravar(CHAVE_CARRINHO, linhas), [linhas]);

  const setDados = useCallback((d: DadosCliente) => {
    setDadosEstado(d);
    gravar(CHAVE_CLIENTE, dadosParaGuardar(d));
  }, []);

  const quantidadeDe = useCallback((id: string) => itens.find((i) => i.id === id)?.quantidade ?? 0, [itens]);

  const adicionar = useCallback(
    (id: string) => {
      const atual = linhas.find((l) => l.id === id)?.quantidade ?? 0;
      despachar({ tipo: 'adicionar', id });
      const nome = catalogo.get(id)?.nome ?? '';
      setAnuncio(atual >= QUANTIDADE_MAXIMA ? `Máximo de ${QUANTIDADE_MAXIMA} por item.` : `${nome}: ${atual + 1} no pedido.`);
    },
    [linhas],
  );

  const remover = useCallback(
    (id: string) => {
      const atual = linhas.find((l) => l.id === id)?.quantidade ?? 0;
      despachar({ tipo: 'remover', id });
      const nome = catalogo.get(id)?.nome ?? '';
      setAnuncio(atual <= 1 ? `${nome} saiu do pedido.` : `${nome}: ${atual - 1} no pedido.`);
    },
    [linhas],
  );

  const limpar = useCallback(() => {
    despachar({ tipo: 'limpar' });
    setAnuncio('Pedido esvaziado.');
  }, []);

  const valor: Contexto = {
    itens,
    total,
    quantidadeDe,
    adicionar,
    remover,
    limpar,
    dados,
    setDados,
    painelAberto,
    abrirPainel: () => setPainelAberto(true),
    fecharPainel: () => setPainelAberto(false),
  };

  return (
    <PedidoContexto.Provider value={valor}>
      {children}
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
    </PedidoContexto.Provider>
  );
}

/* ───────────── Ícones (traço de tinta, sem emoji) ───────────── */

function IconeMais() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IconeMenos() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M2 8h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IconeSacola() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path d="M4 8h16l-1.4 12.2a1 1 0 0 1-1 .8H6.4a1 1 0 0 1-1-.8z" fill="currentColor" />
      <path d="M8.5 10V6.5a3.5 3.5 0 0 1 7 0V10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconeWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"
      />
    </svg>
  );
}

/* ───────────── Adicionar / quantidade ───────────── */

/**
 * Botão "Adicionar" que vira um seletor − 1 + depois do primeiro toque.
 * O foco acompanha a troca para quem usa teclado ou leitor de tela.
 */
export function ControleQuantidade({ item, variante = 'lista' }: { item: Item; variante?: 'lista' | 'destaque' | 'painel' }) {
  const { quantidadeDe, adicionar, remover } = usePedido();
  const quantidade = quantidadeDe(item.id);
  const maisRef = useRef<HTMLButtonElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const focoPendente = useRef<'mais' | 'add' | null>(null);

  useEffect(() => {
    if (focoPendente.current === 'mais') maisRef.current?.focus();
    if (focoPendente.current === 'add') addRef.current?.focus();
    focoPendente.current = null;
  }, [quantidade]);

  if (item.pedivel === false || item.preco === null) {
    return variante === 'painel' ? null : <span className="so-no-salao">Monte no salão</span>;
  }

  if (quantidade === 0) {
    return (
      <button
        ref={addRef}
        type="button"
        className={`adicionar adicionar--${variante}`}
        onClick={() => {
          focoPendente.current = 'mais';
          adicionar(item.id);
        }}
        aria-label={`Adicionar ${item.nome} ao pedido`}
      >
        <IconeMais />
        <span aria-hidden="true">Adicionar</span>
      </button>
    );
  }

  return (
    <div className={`quantidade quantidade--${variante}`} role="group" aria-label={`Quantidade de ${item.nome}`}>
      <button
        type="button"
        className="quantidade__botao"
        onClick={() => {
          if (quantidade === 1 && variante !== 'painel') focoPendente.current = 'add';
          remover(item.id);
        }}
        aria-label={quantidade === 1 ? `Tirar ${item.nome} do pedido` : `Diminuir ${item.nome}`}
      >
        <IconeMenos />
      </button>
      <span className="quantidade__valor" aria-hidden="true">
        {quantidade}
      </span>
      <span className="sr-only">{quantidade} no pedido</span>
      <button
        ref={maisRef}
        type="button"
        className="quantidade__botao"
        onClick={() => adicionar(item.id)}
        disabled={quantidade >= QUANTIDADE_MAXIMA}
        aria-label={`Aumentar ${item.nome}`}
      >
        <IconeMais />
      </button>
    </div>
  );
}

/* ───────────── Barra inferior ───────────── */

export function BarraPedido() {
  const { total, abrirPainel, painelAberto } = usePedido();
  if (total.quantidade === 0 || painelAberto) return null;
  return (
    <div className="barra-pedido">
      <button type="button" className="barra-pedido__botao" onClick={abrirPainel}>
        <span className="barra-pedido__icone">
          <IconeSacola />
          <span className="barra-pedido__contagem" aria-hidden="true">
            {total.quantidade}
          </span>
        </span>
        <span className="barra-pedido__texto">
          Ver pedido
          <span className="sr-only">
            , {total.quantidade} {total.quantidade === 1 ? 'item' : 'itens'}
          </span>
        </span>
        <span className="barra-pedido__total">{formatarPreco(total.centavos)}</span>
      </button>
    </div>
  );
}

/* ───────────── Painel (carrinho + dados + envio) ───────────── */

type Etapa = 'itens' | 'dados' | 'enviado';

export function PainelPedido() {
  const { itens, total, painelAberto, fecharPainel, limpar, dados, setDados } = usePedido();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [etapa, setEtapa] = useState<Etapa>('itens');
  const [erros, setErros] = useState<Erros>({});

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (painelAberto && !d.open) {
      setEtapa('itens');
      setErros({});
      d.showModal();
    }
    if (!painelAberto && d.open) d.close();
  }, [painelAberto]);

  // Ao trocar de etapa, o foco vai para o título novo e a rolagem volta ao topo.
  useEffect(() => {
    if (!painelAberto) return;
    dialogRef.current?.querySelector('.painel__corpo')?.scrollTo(0, 0);
    tituloRef.current?.focus();
  }, [etapa, painelAberto]);

  // Um item saiu da lista: o botão que tinha o foco sumiu, então o foco vai para o título.
  const qtdAnterior = useRef(itens.length);
  useEffect(() => {
    if (painelAberto && itens.length < qtdAnterior.current && itens.length > 0) tituloRef.current?.focus();
    qtdAnterior.current = itens.length;
  }, [itens.length, painelAberto]);

  // Esvaziou o carrinho com o painel aberto na lista: volta ao cardápio.
  useEffect(() => {
    if (painelAberto && etapa !== 'enviado' && itens.length === 0) fecharPainel();
  }, [itens.length, etapa, painelAberto, fecharPainel]);

  const mensagem = useMemo(() => montarMensagem(restaurante.nome, itens, dados), [itens, dados]);
  const href = linkWhatsApp(restaurante.whatsapp, mensagem);
  const agora = situacao(new Date(), restaurante.expediente, restaurante.timeZone);
  const temEstimado = MODO_PREVIA && itens.some((i) => catalogo.get(i.id)?.verificado === false);

  function atualizar<K extends keyof DadosCliente>(campo: K, valor: DadosCliente[K]) {
    setDados({ ...dados, [campo]: valor });
    if (erros[campo]) setErros({ ...erros, [campo]: undefined });
  }

  function enviar(evento: React.MouseEvent<HTMLAnchorElement>) {
    const encontrados = validarPedido(itens, dados);
    if (Object.keys(encontrados).length > 0) {
      evento.preventDefault();
      setErros(encontrados);
      const primeiro = (['nome', 'telefone', 'endereco', 'troco'] as const).find((c) => encontrados[c]);
      if (primeiro) dialogRef.current?.querySelector<HTMLElement>(`#pedido-${primeiro}`)?.focus();
      return;
    }
    // O link abre o WhatsApp em outra aba/app; aqui só mostramos o próximo passo.
    setEtapa('enviado');
  }

  const titulo = { itens: 'Seu pedido', dados: 'Seus dados', enviado: 'Falta só enviar' }[etapa];

  return (
    <dialog ref={dialogRef} className="painel" aria-labelledby="painel-titulo" onClose={fecharPainel}>
      <header className="painel__cabeca">
        {etapa === 'dados' && (
          <button type="button" className="painel__voltar" onClick={() => setEtapa('itens')}>
            <span aria-hidden="true">←</span> Pedido
          </button>
        )}
        <h2 id="painel-titulo" ref={tituloRef} tabIndex={-1} className="painel__titulo">
          {titulo}
        </h2>
        <button type="button" className="painel__fechar" onClick={fecharPainel} aria-label="Fechar e voltar ao cardápio">
          <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {etapa !== 'enviado' && (
        <ol className="painel__passos" aria-label="Etapas">
          <li aria-current={etapa === 'itens' ? 'step' : undefined}>1. Itens</li>
          <li aria-current={etapa === 'dados' ? 'step' : undefined}>2. Seus dados</li>
          <li>3. WhatsApp</li>
        </ol>
      )}

      <div className="painel__corpo">
        {etapa === 'itens' && (
          <>
            {!agora.aberto && (
              <p className="painel__aviso">
                {textoSituacao(agora)}. Você pode mandar o pedido agora; a casa responde quando abrir.
              </p>
            )}
            <ul className="painel__itens">
              {itens.map((i) => {
                const item = catalogo.get(i.id)!;
                return (
                  <li key={i.id} className="linha-pedido">
                    <div className="linha-pedido__info">
                      <span className="linha-pedido__nome">{i.nome}</span>
                      <span className="linha-pedido__unitario">{formatarPreco(i.preco)} cada</span>
                    </div>
                    <ControleQuantidade item={item} variante="painel" />
                    <span className="linha-pedido__subtotal">{formatarPreco(i.preco * i.quantidade)}</span>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="painel__limpar" onClick={limpar}>
              Esvaziar pedido
            </button>
            <label className="campo" htmlFor="pedido-observacao">
              <span className="campo__rotulo">Observações (opcional)</span>
              <textarea
                id="pedido-observacao"
                rows={2}
                maxLength={300}
                placeholder="Ex.: panelada sem pimenta, farofa à parte"
                value={dados.observacao}
                onChange={(e) => atualizar('observacao', e.target.value)}
              />
            </label>
          </>
        )}

        {etapa === 'dados' && (
          <form className="formulario" noValidate onSubmit={(e) => e.preventDefault()}>
            <Campo id="nome" rotulo="Seu nome" erro={erros.nome}>
              <input
                id="pedido-nome"
                type="text"
                autoComplete="name"
                enterKeyHint="next"
                maxLength={60}
                value={dados.nome}
                onChange={(e) => atualizar('nome', e.target.value)}
                aria-invalid={Boolean(erros.nome)}
                aria-describedby={erros.nome ? 'pedido-nome-erro' : undefined}
              />
            </Campo>
            <Campo id="telefone" rotulo="Telefone (WhatsApp)" erro={erros.telefone}>
              <input
                id="pedido-telefone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(85) 98765-4321"
                value={dados.telefone}
                onChange={(e) => atualizar('telefone', mascararTelefone(e.target.value))}
                aria-invalid={Boolean(erros.telefone)}
                aria-describedby={erros.telefone ? 'pedido-telefone-erro' : undefined}
              />
            </Campo>

            <fieldset className="escolha">
              <legend className="campo__rotulo">Como você quer?</legend>
              <div className="escolha__opcoes">
                {restaurante.modalidades.map((m: Modalidade) => (
                  <label key={m} className="opcao">
                    <input
                      type="radio"
                      name="modalidade"
                      value={m}
                      checked={dados.modalidade === m}
                      onChange={() => atualizar('modalidade', m)}
                    />
                    <span>{ROTULO_MODALIDADE[m]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {dados.modalidade === 'salao' && (
              <Campo id="mesa" rotulo="Número da mesa (opcional)">
                <input
                  id="pedido-mesa"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={dados.mesa}
                  onChange={(e) => atualizar('mesa', e.target.value)}
                />
              </Campo>
            )}
            {dados.modalidade === 'entrega' && (
              <Campo id="endereco" rotulo="Endereço de entrega" erro={erros.endereco} dica="Rua, número, bairro e ponto de referência.">
                <textarea
                  id="pedido-endereco"
                  rows={2}
                  maxLength={200}
                  autoComplete="street-address"
                  value={dados.endereco}
                  onChange={(e) => atualizar('endereco', e.target.value)}
                  aria-invalid={Boolean(erros.endereco)}
                  aria-describedby={erros.endereco ? 'pedido-endereco-erro' : 'pedido-endereco-dica'}
                />
              </Campo>
            )}

            <fieldset className="escolha">
              <legend className="campo__rotulo">Pagamento</legend>
              <div className="escolha__opcoes">
                {(Object.keys(ROTULO_PAGAMENTO) as Pagamento[]).map((p) => (
                  <label key={p} className="opcao">
                    <input
                      type="radio"
                      name="pagamento"
                      value={p}
                      checked={dados.pagamento === p}
                      onChange={() => atualizar('pagamento', p)}
                    />
                    <span>{ROTULO_PAGAMENTO[p]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {dados.pagamento === 'dinheiro' && (
              <Campo id="troco" rotulo="Troco para quanto? (opcional)" erro={erros.troco}>
                <input
                  id="pedido-troco"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex.: 100"
                  maxLength={8}
                  value={dados.troco}
                  onChange={(e) => atualizar('troco', e.target.value)}
                  aria-invalid={Boolean(erros.troco)}
                  aria-describedby={erros.troco ? 'pedido-troco-erro' : undefined}
                />
              </Campo>
            )}
          </form>
        )}

        {etapa === 'enviado' && (
          <div className="enviado">
            <p>
              Abrimos o WhatsApp do <strong>{restaurante.nomeCompleto}</strong> com o seu pedido já escrito.
              Confira a mensagem e toque em <strong>enviar</strong> por lá. A casa confirma o pedido e o valor.
            </p>
            <p className="enviado__dica">O WhatsApp não abriu? Use o botão abaixo.</p>
            <a className="botao botao--whatsapp" href={href} target="_blank" rel="noopener noreferrer">
              <IconeWhatsApp /> Abrir o WhatsApp de novo
            </a>
            <div className="enviado__acoes">
              <button
                type="button"
                className="botao"
                onClick={() => {
                  limpar();
                  fecharPainel();
                }}
              >
                Começar outro pedido
              </button>
              <button type="button" className="botao botao--discreto" onClick={fecharPainel}>
                Voltar ao cardápio
              </button>
            </div>
          </div>
        )}
      </div>

      {etapa !== 'enviado' && (
        <footer className="painel__rodape">
          <div className="painel__total">
            <span>
              Total{' '}
              <span className="painel__qtd">
                · {total.quantidade} {total.quantidade === 1 ? 'item' : 'itens'}
              </span>
            </span>
            <strong>{formatarPreco(total.centavos)}</strong>
          </div>
          {(temEstimado || dados.modalidade === 'entrega') && (
            <p className="painel__nota">
              {temEstimado && 'Alguns preços ainda serão confirmados pela casa. '}
              {dados.modalidade === 'entrega' && etapa === 'dados' && 'Taxa de entrega a combinar.'}
            </p>
          )}
          {etapa === 'itens' ? (
            <button type="button" className="botao botao--primario botao--largo" onClick={() => setEtapa('dados')}>
              Continuar
            </button>
          ) : (
            <a
              className="botao botao--whatsapp botao--largo"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={enviar}
            >
              <IconeWhatsApp /> Enviar pedido no WhatsApp
            </a>
          )}
        </footer>
      )}
    </dialog>
  );
}

function Campo({
  id,
  rotulo,
  erro,
  dica,
  children,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  children: ReactNode;
}) {
  return (
    <div className={`campo${erro ? ' campo--erro' : ''}`}>
      <label className="campo__rotulo" htmlFor={`pedido-${id}`}>
        {rotulo}
      </label>
      {children}
      {dica && !erro && (
        <p id={`pedido-${id}-dica`} className="campo__dica">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`pedido-${id}-erro`} className="campo__erro">
          {erro}
        </p>
      )}
    </div>
  );
}

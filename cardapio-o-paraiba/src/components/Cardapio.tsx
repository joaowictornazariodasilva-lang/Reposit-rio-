import type { Categoria, Etiqueta, Item } from '../data/cardapio';
import { regrasDaCasa } from '../data/cardapio';
import { MODO_PREVIA } from '../data/restaurante';
import { formatarPreco, precoCurto } from '../lib/preco';
import { Panela } from './Xilo';
import { ControleQuantidade } from './Pedido';

const ROTULO_ETIQUETA: Record<Etiqueta, string> = {
  'mais-pedido': 'Mais pedido',
  'serve-2': 'Serve 2',
  'da-casa': 'Receita da casa',
};

export function Preco({ item }: { item: Item }) {
  if (item.preco === null) return <span className="preco preco--consulta">Consulte</span>;
  return (
    <span className="preco">
      {item.prefixoPreco && <span className="preco__prefixo">{item.prefixoPreco} </span>}
      {/* Visualmente "R$ 35"; leitores de tela ouvem o valor completo. */}
      <span aria-hidden="true">
        <span className="preco__moeda">R$</span>
        {precoCurto(item.preco)}
      </span>
      <span className="sr-only">{formatarPreco(item.preco)}</span>
    </span>
  );
}

function LinhaItem({ item }: { item: Item }) {
  const aConfirmar = MODO_PREVIA && !item.verificado;
  return (
    <li className="item" id={`item-${item.id}`} data-verificado={item.verificado}>
      <div className="item__topo">
        <h3 className="item__nome">{item.nome}</h3>
        <span className="item__guia" aria-hidden="true" />
        <Preco item={item} />
      </div>
      <p className="item__descricao">{item.descricao}</p>
      <div className="item__base">
        {(item.etiquetas?.length || aConfirmar) ? (
          <ul className="item__etiquetas" aria-label="Observações">
            {item.etiquetas?.map((e) => (
              <li key={e} className={`etiqueta etiqueta--${e}`}>
                {ROTULO_ETIQUETA[e]}
              </li>
            ))}
            {aConfirmar && <li className="etiqueta etiqueta--confirmar">Preço a confirmar</li>}
          </ul>
        ) : (
          <span />
        )}
        <ControleQuantidade item={item} />
      </div>
    </li>
  );
}

function RegrasDaCasa() {
  return (
    <aside className="regras" aria-labelledby="regras-titulo">
      <Panela className="regras__ilustracao" />
      <div>
        <h3 id="regras-titulo" className="regras__titulo">
          Regras da casa
        </h3>
        <dl className="regras__lista">
          {regrasDaCasa.map((r) => (
            <div key={r.titulo}>
              <dt>{r.titulo}</dt>
              <dd>{r.texto}</dd>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}

export function SecaoCategoria({ categoria }: { categoria: Categoria }) {
  return (
    <section className="categoria" id={categoria.id} aria-labelledby={`${categoria.id}-titulo`} data-categoria>
      <header className="categoria__cabeca">
        <h2 id={`${categoria.id}-titulo`} className="categoria__titulo" tabIndex={-1}>
          {categoria.nome}
        </h2>
        {categoria.resumo && <p className="categoria__resumo">{categoria.resumo}</p>}
      </header>
      <ul className="categoria__itens">
        {categoria.itens.map((item) => (
          <LinhaItem key={item.id} item={item} />
        ))}
      </ul>
      {categoria.id === 'self-service' && <RegrasDaCasa />}
    </section>
  );
}

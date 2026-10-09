import { cardapio, destaques } from './data/cardapio';
import { MODO_PREVIA, restaurante } from './data/restaurante';
import { resumoExpediente } from './lib/horario';
import { Preco, SecaoCategoria } from './components/Cardapio';
import { NavCategorias } from './components/NavCategorias';
import { Status } from './components/Status';
import { Mandacaru, Sol } from './components/Xilo';

const todosItens = cardapio.flatMap((c) => c.itens);
const pratosDestaque = destaques
  .map((id) => todosItens.find((i) => i.id === id))
  .filter((i) => i !== undefined);

function Capa() {
  const { endereco } = restaurante;
  return (
    <header className="capa">
      <div className="capa__moldura">
        <div className="capa__arte">
          <Sol className="capa__sol" />
          <Mandacaru className="capa__mandacaru" />
        </div>
        <p className="capa__sobretitulo">Restaurante</p>
        <h1 className="capa__nome">{restaurante.nome}</h1>
        <p className="capa__slogan">
          {restaurante.slogan}
          <span className="capa__desde">Desde {restaurante.desde} · Alto da Balança</span>
        </p>
        <Status />
        <p className="capa__endereco">{endereco.rua}</p>
        <div className="capa__acoes">
          <a className="botao botao--primario" href="#cardapio">
            Ver cardápio
          </a>
          <a className="botao" href={restaurante.mapsUrl} target="_blank" rel="noopener noreferrer">
            Como chegar
          </a>
        </div>
      </div>
    </header>
  );
}

function OQuePedir() {
  return (
    <section className="destaques" aria-labelledby="destaques-titulo">
      <h2 id="destaques-titulo" className="destaques__titulo">
        O que pedir
      </h2>
      <p className="destaques__sub">Os três que fizeram a fama da casa.</p>
      <ol className="destaques__lista">
        {pratosDestaque.map((item, i) => (
          <li key={item.id} className="destaque">
            <a className="destaque__link" href={`#item-${item.id}`}>
              <span className="destaque__numero" aria-hidden="true">
                {i + 1}
              </span>
              <span className="destaque__nome">{item.nome}</span>
              <Preco item={item} />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Historia() {
  return (
    <section className="historia" aria-labelledby="historia-titulo">
      <h2 id="historia-titulo" className="historia__titulo">
        De Esperança ao Alto da Balança
      </h2>
      {restaurante.historia.map((p) => (
        <p key={p.slice(0, 16)} className="historia__texto">
          {p}
        </p>
      ))}
      <figure className="historia__citacao">
        <blockquote>
          <p>“{restaurante.citacao.texto}”</p>
        </blockquote>
        <figcaption>— {restaurante.citacao.contexto}</figcaption>
      </figure>
    </section>
  );
}

function Info() {
  const { endereco, instagram, whatsapp } = restaurante;
  return (
    <section className="info" aria-labelledby="info-titulo">
      <h2 id="info-titulo" className="sr-only">
        Horário e endereço
      </h2>
      <dl className="info__lista">
        <div>
          <dt>Horário</dt>
          <dd>{resumoExpediente(restaurante.expediente)}</dd>
        </div>
        <div>
          <dt>Endereço</dt>
          <dd>
            <address>
              {endereco.rua}
              <br />
              {endereco.bairro}, {endereco.cidade}
              <br />
              CEP {endereco.cep}
            </address>
          </dd>
        </div>
      </dl>
      <div className="info__acoes">
        <a className="botao botao--primario" href={restaurante.mapsUrl} target="_blank" rel="noopener noreferrer">
          Abrir no mapa
        </a>
        {whatsapp && (
          <a className="botao" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        )}
        <a className="botao" href={instagram.url} target="_blank" rel="noopener noreferrer">
          @{instagram.usuario}
        </a>
      </div>
    </section>
  );
}

export function App() {
  return (
    <>
      <a className="pular" href="#cardapio">
        Pular para o cardápio
      </a>
      <div className="layout">
        <Capa />
        <main className="conteudo">
          <OQuePedir />
          <div id="cardapio" className="cardapio" tabIndex={-1}>
            <NavCategorias categorias={cardapio} />
            {MODO_PREVIA && (
              <p className="aviso-previa">
                Prévia do cardápio digital. Itens marcados com <strong>preço a confirmar</strong> ainda serão
                validados pela casa.
              </p>
            )}
            {cardapio.map((c) => (
              <SecaoCategoria key={c.id} categoria={c} />
            ))}
          </div>
          <Historia />
          <Info />
          <footer className="rodape">
            <p>
              {restaurante.nomeCompleto} · {restaurante.endereco.bairro}, Fortaleza
            </p>
            <p>Preços em reais, sujeitos a alteração sem aviso.</p>
          </footer>
        </main>
      </div>
    </>
  );
}

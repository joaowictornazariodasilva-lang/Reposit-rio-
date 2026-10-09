import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import QRCode from 'qrcode';
import '@fontsource/alfa-slab-one/latin-400.css';
import '@fontsource-variable/work-sans/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/mesa.css';
import { restaurante } from './data/restaurante';
import { resumoExpediente } from './lib/horario';
import { Mandacaru, Sol } from './components/Xilo';

/**
 * Cartão de mesa (A6, dois por folha A5) com QR code para o cardápio.
 * O endereço do QR vem de ?url=… ou, por padrão, do próprio site publicado.
 */
function urlDoCardapio(): string {
  const param = new URLSearchParams(location.search).get('url');
  return param || `${location.origin}/`;
}

function Cartao({ qr, url }: { qr: string; url: string }) {
  return (
    <article className="cartao">
      <div className="cartao__arte" aria-hidden="true">
        <Sol className="cartao__sol" />
        <Mandacaru className="cartao__mandacaru" />
      </div>
      <p className="cartao__sobretitulo">Restaurante</p>
      <h1 className="cartao__nome">{restaurante.nome}</h1>
      <p className="cartao__chamada">Aponte a câmera e veja o cardápio</p>
      <div className="cartao__qr" dangerouslySetInnerHTML={{ __html: qr }} />
      <p className="cartao__url">{url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
      <p className="cartao__rodape">{resumoExpediente(restaurante.expediente)} · desde {restaurante.desde}</p>
    </article>
  );
}

function Mesa() {
  const url = urlDoCardapio();
  const [qr, setQr] = useState('');
  useEffect(() => {
    QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 0,
      color: { dark: '#1e1913', light: '#fbf6ec' },
    }).then(setQr);
  }, [url]);

  return (
    <main>
      <div className="mesa__barra">
        <p>
          QR aponta para <strong>{url}</strong>. Para outro endereço, use <code>?url=https://…</code>
        </p>
        <button className="botao botao--primario" type="button" onClick={() => window.print()}>
          Imprimir
        </button>
      </div>
      <div className="folha">
        <Cartao qr={qr} url={url} />
        <Cartao qr={qr} url={url} />
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Mesa />
  </StrictMode>,
);

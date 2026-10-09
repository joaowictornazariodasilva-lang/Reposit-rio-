import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/alfa-slab-one/latin-400.css';
import '@fontsource-variable/work-sans/wght.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import './styles/pedido.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

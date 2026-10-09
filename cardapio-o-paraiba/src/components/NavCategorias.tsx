import { useEffect, useRef, useState } from 'react';
import type { Categoria } from '../data/cardapio';

const reduzMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Barra fixa com as categorias. Marca a seção visível (scroll-spy) e mantém o
 * botão ativo à vista dentro da barra rolável, sem mexer na rolagem da página.
 */
export function NavCategorias({ categorias }: { categorias: Categoria[] }) {
  const [ativa, setAtiva] = useState(categorias[0]?.id);
  const listaRef = useRef<HTMLUListElement>(null);
  // Enquanto a rolagem disparada por um clique acontece, o spy não deve "pular" pelas seções do meio.
  const travadoAte = useRef(0);

  useEffect(() => {
    const secoes = categorias
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el !== null);
    const visiveis = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) visiveis.set(e.target.id, e.isIntersecting);
        if (Date.now() < travadoAte.current) return;
        const primeira = categorias.find((c) => visiveis.get(c.id));
        if (primeira) setAtiva(primeira.id);
      },
      // Faixa logo abaixo da barra: a seção "ativa" é a que ocupa o topo da tela.
      { rootMargin: '-64px 0px -60% 0px' },
    );
    secoes.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categorias]);

  useEffect(() => {
    const lista = listaRef.current;
    const botao = lista?.querySelector<HTMLElement>(`[data-alvo="${ativa}"]`);
    if (!lista || !botao) return;
    const esquerda = botao.offsetLeft - (lista.clientWidth - botao.offsetWidth) / 2;
    lista.scrollTo({ left: Math.max(0, esquerda), behavior: reduzMovimento() ? 'auto' : 'smooth' });
  }, [ativa]);

  function irPara(evento: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const alvo = document.getElementById(id);
    if (!alvo) return;
    evento.preventDefault();
    setAtiva(id);
    travadoAte.current = Date.now() + 900;
    alvo.scrollIntoView({ behavior: reduzMovimento() ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
    // Leva o foco para o título, para quem navega por teclado/leitor continuar dali.
    alvo.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }

  return (
    <nav className="nav-categorias" aria-label="Categorias do cardápio">
      <ul ref={listaRef} className="nav-categorias__lista">
        {categorias.map((c) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              data-alvo={c.id}
              className="nav-categorias__link"
              aria-current={ativa === c.id ? 'true' : undefined}
              onClick={(e) => irPara(e, c.id)}
            >
              {c.nome}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

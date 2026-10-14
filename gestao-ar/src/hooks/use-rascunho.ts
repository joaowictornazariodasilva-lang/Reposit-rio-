"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Auto-save de formulário: guarda o rascunho no navegador enquanto digita e
 * restaura se o painel for fechado sem querer. Falha silenciosa se o
 * armazenamento estiver bloqueado.
 */
export function useRascunho<T extends object>(chave: string, inicial: T, ativo = true) {
  const [valor, setValor] = useState<T>(inicial);
  const [restaurado, setRestaurado] = useState(false);
  const carregou = useRef(false);

  useEffect(() => {
    if (!ativo || carregou.current) return;
    carregou.current = true;
    try {
      const s = localStorage.getItem(`rascunho:${chave}`);
      if (s) {
        setValor({ ...inicial, ...(JSON.parse(s) as T) });
        setRestaurado(true);
      }
    } catch {
      /* armazenamento indisponível */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, chave]);

  useEffect(() => {
    if (!ativo || !carregou.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(`rascunho:${chave}`, JSON.stringify(valor));
      } catch {
        /* ignora */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [valor, chave, ativo]);

  function limpar() {
    try {
      localStorage.removeItem(`rascunho:${chave}`);
    } catch {
      /* ignora */
    }
    setValor(inicial);
    setRestaurado(false);
    carregou.current = false;
  }

  return { valor, setValor, restaurado, limpar };
}

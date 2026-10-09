import { useEffect, useState } from 'react';
import { restaurante } from '../data/restaurante';
import { situacao, textoSituacao } from '../lib/horario';

/** Re-renderiza a cada minuto para o selo "Aberto agora" não ficar velho na mesa. */
function useAgora(intervaloMs = 60_000): Date {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), intervaloMs);
    return () => window.clearInterval(id);
  }, [intervaloMs]);
  return agora;
}

export function Status() {
  const s = situacao(useAgora(), restaurante.expediente, restaurante.timeZone);
  const estado = s.aberto ? (s.fechandoLogo ? 'fechando' : 'aberto') : 'fechado';
  return (
    <p className="status" data-estado={estado} role="status">
      <span className="status__ponto" aria-hidden="true" />
      {textoSituacao(s)}
    </p>
  );
}

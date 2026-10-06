import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { FlaskConical, RotateCcw, X } from 'lucide-react';
import { DEMO_ADMIN } from '@/lib/env';
import { BrowserStore } from './browser-store';

/** Explains the demo and gives shortcuts to the admin and to a clean restart. */
export default function DemoBanner() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const firstPath = useRef(pathname);

  // Open on arrival; fold into a small pill as soon as the visitor navigates, so it never covers the UI.
  useEffect(() => {
    if (pathname !== firstPath.current) {
      setOpen(false);
      setConfirmReset(false);
    }
  }, [pathname]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Mostrar informações da demonstração"
        className="fixed top-[4.6rem] right-3 z-[55] flex items-center gap-1.5 rounded-full bg-olive px-3 py-1.5 text-xs font-semibold text-oven shadow-lift md:top-auto md:right-auto md:bottom-4 md:left-4"
      >
        <FlaskConical className="size-3.5" aria-hidden /> Demo
      </button>
    );
  }

  return (
    <aside
      aria-label="Modo demonstração"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[55] mx-auto max-w-md rounded-[var(--radius-md)] border border-olive/40 bg-oven/95 p-4 text-flour shadow-lift backdrop-blur md:inset-x-auto md:bottom-4 md:left-4"
    >
      <div className="flex items-start gap-3">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-olive" aria-hidden />
        <div className="min-w-0 flex-1 text-[0.8125rem] leading-relaxed text-ash">
          <p className="font-semibold text-flour">Versão de demonstração</p>
          <p className="mt-1">
            Tudo funciona de verdade, mas os pedidos ficam salvos só neste navegador e o Pix é fictício (use “Simular pagamento”).
          </p>
          <p className="mt-2">
            Painel: <span className="select-all font-mono text-flour">{DEMO_ADMIN.email}</span> · senha{' '}
            <span className="select-all font-mono text-flour">{DEMO_ADMIN.password}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link to="/admin" className="rounded-full bg-flour px-3 py-1.5 text-xs font-semibold text-ink hover:bg-white">
              Abrir painel admin
            </Link>
            <Link to="/" className="rounded-full border border-oven-line px-3 py-1.5 text-xs font-semibold text-flour hover:border-ash">
              Ver loja
            </Link>
            {confirmReset ? (
              <button
                type="button"
                onClick={() => {
                  BrowserStore.reset();
                  location.reload();
                }}
                className="rounded-full bg-tomato px-3 py-1.5 text-xs font-semibold text-white"
              >
                Confirmar: apagar dados da demo
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmReset(true)} className="flex items-center gap-1 px-1 py-1.5 text-xs font-semibold text-ash hover:text-flour">
                <RotateCcw className="size-3.5" aria-hidden /> Reiniciar demo
              </button>
            )}
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Minimizar aviso" className="-mt-1 -mr-1 rounded-full p-1 text-ash hover:bg-flour/10 hover:text-flour">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </aside>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { FlaskConical, RotateCcw, X } from 'lucide-react';
import { BrowserStore } from './browser-store';

/** Explains the demo and offers a clean restart. The admin is never advertised to visitors. */
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
        className="fixed top-[4.6rem] right-3 z-[45] flex items-center gap-1.5 rounded-full bg-olive px-3 py-1.5 text-xs font-semibold text-oven shadow-lift md:top-auto md:right-auto md:bottom-4 md:left-4"
      >
        <FlaskConical className="size-3.5" aria-hidden /> Demo
      </button>
    );
  }

  return (
    <aside
      aria-label="Modo demonstração"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[45] mx-auto max-w-md rounded-[var(--radius-md)] border border-olive/40 bg-oven/95 p-4 text-flour shadow-lift backdrop-blur md:inset-x-auto md:bottom-4 md:left-4"
    >
      <div className="flex items-start gap-3">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-olive" aria-hidden />
        <div className="min-w-0 flex-1 text-[0.8125rem] leading-relaxed text-ash">
          <p className="font-semibold text-flour">Versão de demonstração</p>
          <p className="mt-1">
            Pode fazer pedidos à vontade: eles ficam salvos só neste navegador e o Pix é fictício (use “Simular pagamento”).
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
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

import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useUi } from '@/stores/ui';
import { cn } from '@/lib/cn';

const icons = {
  success: <CheckCircle2 className="size-5 text-[#9fc490]" aria-hidden />,
  error: <AlertTriangle className="size-5 text-ember" aria-hidden />,
  neutral: <Info className="size-5 text-ash" aria-hidden />,
};

/** Polite live region; toasts sit under the header on phones (clear of the cart bar), bottom-right on desktop. */
export function Toaster() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismiss);

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-[60] flex flex-col items-center gap-2 px-3 sm:top-auto sm:bottom-6 sm:items-end sm:pr-6"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <m.div
            key={t.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-md)] bg-oven px-4 py-3 text-flour shadow-lift',
            )}
          >
            <span className="mt-0.5">{icons[t.tone ?? 'neutral']}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[0.8125rem] text-ash">{t.description}</p>}
            </div>
            {t.action && (
              <button
                type="button"
                className="shrink-0 rounded-full px-2 py-1 text-sm font-semibold text-olive underline-offset-4 hover:underline"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Fechar aviso"
              className="-mr-1 shrink-0 rounded-full p-1 text-ash hover:bg-flour/10 hover:text-flour"
              onClick={() => dismiss(t.id)}
            >
              <X className="size-4" aria-hidden />
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

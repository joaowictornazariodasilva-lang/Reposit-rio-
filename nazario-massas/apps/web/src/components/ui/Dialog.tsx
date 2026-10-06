import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, type TargetAndTransition } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

type Placement = 'center' | 'right' | 'sheet';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name. Rendered visually unless `hideTitle`. */
  title: string;
  hideTitle?: boolean;
  description?: string;
  placement?: Placement;
  /** Panel colour scheme — set here, never via className, so it can't be overridden by accident. */
  surface?: 'paper' | 'oven';
  className?: string;
  children: ReactNode;
  /** Element to focus on open; defaults to the first focusable. */
  initialFocus?: React.RefObject<HTMLElement | null>;
}

let openCount = 0;
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function lockPage(lock: boolean) {
  const root = document.getElementById('root');
  const html = document.documentElement;
  if (lock) {
    if (openCount++ === 0) {
      const scrollbar = window.innerWidth - html.clientWidth;
      html.style.overflow = 'hidden';
      if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`;
      root?.setAttribute('inert', '');
    }
  } else if (--openCount === 0) {
    html.style.overflow = '';
    html.style.paddingRight = '';
    root?.removeAttribute('inert');
  }
}

const panelMotion: Record<Placement, { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }> = {
  center: {
    initial: { opacity: 0, y: 24, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 16, scale: 0.98 },
  },
  right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
  sheet: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
};

const panelClass: Record<Placement, string> = {
  center: 'relative m-auto max-h-[calc(100dvh-2rem)] w-[min(100%-2rem,var(--dialog-width,32rem))] rounded-[var(--radius-xl)]',
  right: 'ml-auto h-dvh w-full max-w-[28rem] sm:rounded-l-[var(--radius-xl)]',
  sheet:
    'mt-auto max-h-[94dvh] w-full rounded-t-[var(--radius-xl)] md:m-auto md:h-[min(46rem,calc(100dvh-3rem))] md:w-[min(100%-3rem,var(--dialog-width,60rem))] md:rounded-[var(--radius-xl)]',
};

/**
 * Accessible modal: portal, focus trap, Esc to close, restores focus,
 * makes the page inert and locks scroll. Animations use transform/opacity only.
 */
export function Dialog({ open, onClose, title, hideTitle, description, placement = 'center', surface = 'paper', className, children, initialFocus }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockPage(true);
    const frame = requestAnimationFrame(() => {
      const target = initialFocus?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
      target?.focus({ preventScroll: true });
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      lockPage(false);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, initialFocus]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn('fixed inset-0 z-50 flex', placement === 'center' && 'items-center p-4')}>
          <m.div
            className="absolute inset-0 bg-oven/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cn('relative z-10 flex flex-col overflow-hidden shadow-sheet outline-none', surface === 'oven' ? 'bg-oven text-flour' : 'bg-paper text-ink', panelClass[placement], className)}
            {...panelMotion[placement]}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
          >
            <h2 id={titleId} className={cn(hideTitle && 'sr-only')}>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="sr-only">
                {description}
              </p>
            )}
            {children}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function DialogClose({ onClose, className, tone = 'solid' }: { onClose: () => void; className?: string; tone?: 'solid' | 'default' }) {
  return (
    <IconButton label="Fechar" tone={tone} onClick={onClose} className={className}>
      <X className="size-5" aria-hidden />
    </IconButton>
  );
}

import { useEffect, useRef } from 'react';

const MARK = '__overlay';
const hasMark = () => Boolean((window.history.state as Record<string, unknown> | null)?.[MARK]);

/**
 * While an overlay (e.g. the mobile menu) is open it owns one browser history entry,
 * so the phone's back button/gesture closes it instead of leaving the page.
 * Links inside the overlay should navigate with `replace` to take over that entry.
 */
export function useBackToClose(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  const pendingBack = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    // An immediate re-run (React StrictMode) keeps the entry instead of dropping it.
    window.clearTimeout(pendingBack.current);
    // Same URL and router state, plus a marker: the router sees no navigation.
    if (!hasMark()) window.history.pushState({ ...(window.history.state ?? {}), [MARK]: true }, '');
    let popped = false;
    const onPop = () => {
      popped = true;
      closeRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (popped) return;
      // Closed with X, backdrop or Esc: drop the entry we added. (A link inside already replaced it.)
      pendingBack.current = window.setTimeout(() => {
        if (hasMark()) window.history.back();
      }, 0);
    };
  }, [open]);
}

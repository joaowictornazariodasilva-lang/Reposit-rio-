import { Suspense, useEffect, useRef, type ReactNode } from 'react';
import { m } from 'motion/react';
import { Outlet, useLocation } from 'react-router';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { MobileCartBar } from '@/components/layout/MobileCartBar';
import { Spinner } from '@/components/ui/Spinner';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ScrollToTop() {
  const { pathname, state } = useLocation();
  useEffect(() => {
    // Product sheets open over the current page — keep its scroll position.
    if ((state as { backgroundLocation?: unknown } | null)?.backgroundLocation) return;
    if (pathname.startsWith('/cardapio')) return; // the menu manages its own section scrolling
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, state]);
  return null;
}

export function PageFallback() {
  return (
    <div className="grid min-h-[100svh] place-items-center text-ink-muted">
      <Spinner className="size-6" label="Carregando" />
    </div>
  );
}

/** Soft fade-up between pages; skipped on the very first paint so it never delays the LCP. */
function PageTransition({ id, children }: { id: string; children: ReactNode }) {
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return (
    <m.div
      key={id}
      initial={first.current ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

export function StoreLayout() {
  const { pathname } = useLocation();
  const showCartBar = !pathname.startsWith('/checkout') && !pathname.startsWith('/pedido');
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <SiteHeader />
      <main id="conteudo" className="flex-1" tabIndex={-1}>
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<PageFallback />}>
            <PageTransition id={pathname.split('/')[1] ?? ''}>
              <Outlet />
            </PageTransition>
          </Suspense>
        </ErrorBoundary>
      </main>
      <SiteFooter />
      <CartDrawer />
      {showCartBar && <MobileCartBar />}
    </div>
  );
}

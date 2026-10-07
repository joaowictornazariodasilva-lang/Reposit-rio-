import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { MobileCartBar } from '@/components/layout/MobileCartBar';
import { Spinner } from '@/components/ui/Spinner';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ScrollToTop() {
  const { pathname, state } = useLocation();
  const previous = useRef(pathname);
  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;
    // Product sheets open over the current page — keep its scroll position.
    if ((state as { backgroundLocation?: unknown } | null)?.backgroundLocation) return;
    // Switching categories inside the menu: the menu scrolls to the section itself.
    if (from !== pathname && from.startsWith('/cardapio') && pathname.startsWith('/cardapio')) return;
    // Every other arrival starts at the top (e.g. "Montar meu pedido" from the bottom of the home page).
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
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <SiteFooter />
      <CartDrawer />
      {showCartBar && <MobileCartBar />}
    </div>
  );
}

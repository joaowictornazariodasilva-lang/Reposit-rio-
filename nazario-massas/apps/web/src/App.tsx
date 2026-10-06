import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation, type Location } from 'react-router';
import { StoreLayout, PageFallback } from '@/layouts/StoreLayout';
import HomePage from '@/pages/HomePage';
import { ProductPage, ProductSheet } from '@/features/catalog/ProductRoute';
import { DEMO } from '@/lib/env';

// Route-level code splitting: only the home page ships in the initial bundle.
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const OrderPage = lazy(() => import('@/pages/OrderPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const AdminApp = lazy(() => import('@/features/admin/AdminApp'));
const DemoBanner = DEMO ? lazy(() => import('@/demo/DemoBanner')) : null;

export default function App() {
  const location = useLocation();
  // When a product is opened from inside the app, keep rendering the page underneath.
  const background = (location.state as { backgroundLocation?: Location } | null)?.backgroundLocation;

  return (
    <>
      <Routes location={background ?? location}>
        <Route element={<StoreLayout />}>
          <Route index element={<HomePage />} />
          <Route path="cardapio" element={<MenuPage />} />
          <Route path="cardapio/:categoria" element={<MenuPage />} />
          <Route path="produto/:slug" element={<ProductPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="pedido/:token" element={<OrderPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          path="admin/*"
          element={
            <Suspense fallback={<PageFallback />}>
              <AdminApp />
            </Suspense>
          }
        />
      </Routes>
      {DemoBanner && (
        <Suspense fallback={null}>
          <DemoBanner />
        </Suspense>
      )}
      {background && (
        <Routes>
          <Route path="produto/:slug" element={<ProductSheet />} />
        </Routes>
      )}
    </>
  );
}

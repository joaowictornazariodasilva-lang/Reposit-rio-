import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router';
import { m } from 'motion/react';
import { ClipboardList, LayoutDashboard, LogOut, Puzzle, Settings, Store, UtensilsCrossed } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useSeo } from '@/lib/seo';
import { DEMO, DEMO_ADMIN } from '@/lib/env';
import { useAdminSession } from './session';
import { useOrdersFeed, useOrdersPolling } from './useOrdersFeed';

const DashboardPage = lazy(() => import('./DashboardPage'));
const OrdersPage = lazy(() => import('./OrdersPage'));
const MenuAdminPage = lazy(() => import('./MenuAdminPage'));
const ProductEditorPage = lazy(() => import('./ProductEditorPage'));
const AddonsPage = lazy(() => import('./AddonsPage'));
const SettingsPage = lazy(() => import('./SettingsPage'));

function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-ink-muted">
      <Spinner className="size-6" label="Carregando" />
    </div>
  );
}

function LoginPage() {
  const login = useAdminSession((s) => s.login);
  const [email, setEmail] = useState(DEMO ? DEMO_ADMIN.email : '');
  const [password, setPassword] = useState(DEMO ? DEMO_ADMIN.password : '');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grain grain-dark grid min-h-dvh place-items-center bg-oven px-4 py-10">
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex justify-center">
          <Logo tone="light" />
        </div>
        <form onSubmit={submit} className="rounded-[var(--radius-xl)] bg-paper p-7 shadow-lift" noValidate>
          <h1 className="font-display text-3xl text-ink">Área do restaurante</h1>
          <p className="mt-1.5 text-sm text-ink-muted">Entre para gerenciar pedidos e cardápio.</p>
          {error && (
            <p role="alert" className="mt-5 rounded-[var(--radius-sm)] bg-tomato-tint px-4 py-3 text-sm font-medium text-tomato-deep">
              {error}
            </p>
          )}
          <div className="mt-6 space-y-4">
            <Field label="E-mail">
              {(p) => <Input {...p} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />}
            </Field>
            <Field label="Senha">
              {(p) => <Input {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
            </Field>
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full" loading={loading}>
            Entrar
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-ash">Acesso restrito à equipe Nazário Massas.</p>
      </m.div>
    </div>
  );
}

const NAV = [
  { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/cardapio', label: 'Cardápio', icon: UtensilsCrossed },
  { to: '/admin/adicionais', label: 'Adicionais', icon: Puzzle },
  { to: '/admin/configuracoes', label: 'Loja', icon: Settings },
];

function AdminLayout() {
  useOrdersPolling();
  const { pathname } = useLocation();
  const email = useAdminSession((s) => s.email);
  const logout = useAdminSession((s) => s.logout);
  const newOrders = useOrdersFeed((s) => s.orders.filter((o) => o.status === 'new').length);

  return (
    <div className="min-h-dvh bg-flour lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="grain grain-dark sticky top-0 hidden h-dvh flex-col bg-oven px-4 py-6 text-flour lg:flex">
        <div className="px-2">
          <Logo tone="light" />
        </div>
        <nav aria-label="Painel" className="mt-10 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors',
                  isActive ? 'bg-flour text-ink' : 'text-ash hover:bg-oven-raised hover:text-flour',
                )
              }
            >
              <Icon className="size-[1.125rem]" aria-hidden />
              <span className="flex-1">{label}</span>
              {to === '/admin/pedidos' && newOrders > 0 && (
                <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-tomato px-1.5 text-xs font-bold text-white">{newOrders}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-oven-line pt-4">
          <a href="/" target="_blank" rel="noreferrer" className="flex h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm text-ash hover:text-flour">
            <Store className="size-4" aria-hidden /> Ver loja
          </a>
          <button type="button" onClick={logout} className="flex h-10 w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm text-ash hover:text-flour">
            <LogOut className="size-4" aria-hidden /> Sair
          </button>
          <p className="truncate px-3 pt-2 text-xs text-ash/80">{email}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-flour/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <button type="button" onClick={logout} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink-soft">
          <LogOut className="size-4" aria-hidden /> Sair
        </button>
      </header>

      <main id="conteudo" className="min-w-0 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
        <ErrorBoundary resetKey={pathname}>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Mobile bottom navigation */}
      <nav aria-label="Painel" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium', isActive ? 'text-ink' : 'text-ink-muted')}
          >
            <Icon className="size-5" aria-hidden />
            {label}
            {to === '/admin/pedidos' && newOrders > 0 && (
              <span className="tabular absolute top-2 right-[calc(50%-1.25rem)] grid h-4 min-w-4 place-items-center rounded-full bg-tomato px-1 text-[0.625rem] font-bold text-white">
                {newOrders}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function AdminApp() {
  const status = useAdminSession((s) => s.status);
  const check = useAdminSession((s) => s.check);
  useSeo({ title: 'Painel', noindex: true });

  useEffect(() => {
    void check();
  }, [check]);

  if (status === 'checking') return <Loading />;
  if (status === 'anonymous') {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="pedidos" element={<OrdersPage />} />
        <Route path="pedidos/:id" element={<OrdersPage />} />
        <Route path="cardapio" element={<MenuAdminPage />} />
        <Route path="cardapio/novo" element={<ProductEditorPage />} />
        <Route path="cardapio/:id" element={<ProductEditorPage />} />
        <Route path="adicionais" element={<AddonsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

export { Loading as AdminLoading };

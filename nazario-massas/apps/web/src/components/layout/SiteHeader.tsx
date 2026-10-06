import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { m, useAnimationControls } from 'motion/react';
import { Menu, ShoppingBag } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { IconButton } from '@/components/ui/Button';
import { AnimatedText } from '@/components/ui/AnimatedNumber';
import { Dialog, DialogClose } from '@/components/ui/Dialog';
import { cn } from '@/lib/cn';
import { useCartCount } from '@/stores/cart';
import { useCustomer } from '@/stores/customer';
import { useUi } from '@/stores/ui';

const NAV = [
  { to: '/cardapio/pizzas', label: 'Pizzas' },
  { to: '/cardapio/massas', label: 'Massas' },
  { to: '/cardapio/bebidas', label: 'Bebidas' },
];

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function CartButton({ light }: { light: boolean }) {
  const count = useCartCount();
  const openCart = useUi((s) => s.openCart);
  const pulse = useUi((s) => s.cartPulse);
  const controls = useAnimationControls();

  useEffect(() => {
    if (pulse > 0) void controls.start({ scale: [1, 1.18, 0.94, 1], rotate: [0, -8, 6, 0], transition: { duration: 0.5 } });
  }, [pulse, controls]);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Abrir carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
      className={cn(
        'relative inline-flex h-11 items-center gap-2 rounded-full pr-4 pl-3.5 text-sm font-semibold transition-colors duration-300',
        light ? 'bg-flour/10 text-flour hover:bg-flour/20' : 'bg-ink text-flour hover:bg-oven-raised',
      )}
    >
      <m.span animate={controls} className="inline-flex">
        <ShoppingBag className="size-[1.125rem]" aria-hidden />
      </m.span>
      <span className="hidden sm:inline">Carrinho</span>
      <span
        className={cn(
          'tabular grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs transition-colors',
          count > 0 ? 'bg-tomato text-white' : light ? 'bg-flour/15' : 'bg-flour/15',
        )}
        aria-hidden
      >
        <AnimatedText value={String(count)} />
      </span>
    </button>
  );
}

export function SiteHeader() {
  const { pathname } = useLocation();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const lastOrder = useCustomer((s) => s.recentOrders[0]);
  const overHero = pathname === '/' && !scrolled;

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500',
        overHero ? 'bg-transparent' : 'bg-flour/85 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl backdrop-saturate-150',
      )}
    >
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-flour">
        Pular para o conteúdo
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
        <Link to="/" className="rounded-md">
          <Logo tone={overHero ? 'light' : 'dark'} />
          <span className="sr-only">, página inicial</span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          <NavLink
            to="/cardapio"
            end
            className={({ isActive }) =>
              cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                overHero ? 'text-flour hover:bg-flour/10' : 'text-ink hover:bg-ink/[0.06]',
                isActive && (overHero ? 'bg-flour/10' : 'bg-ink/[0.06]'),
              )
            }
          >
            Cardápio
          </NavLink>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  overHero ? 'text-ash hover:text-flour' : 'text-ink-soft hover:text-ink',
                  isActive && (overHero ? 'text-flour' : 'text-ink'),
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          {lastOrder && (
            <NavLink
              to={`/pedido/${lastOrder.token}`}
              className={cn('ml-1 rounded-full px-4 py-2 text-sm font-medium transition-colors', overHero ? 'text-ash hover:text-flour' : 'text-ink-soft hover:text-ink')}
            >
              Meu pedido #{lastOrder.number}
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <CartButton light={overHero} />
          <IconButton label="Abrir menu" tone={overHero ? 'light' : 'default'} className="md:hidden" onClick={() => setMenuOpen(true)}>
            <Menu className="size-5" aria-hidden />
          </IconButton>
        </div>
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" hideTitle placement="right" className="bg-oven text-flour">
        <div className="flex items-center justify-between px-5 pt-4">
          <Logo tone="light" />
          <DialogClose onClose={() => setMenuOpen(false)} className="bg-oven-raised text-flour hover:bg-oven-line" />
        </div>
        <nav aria-label="Menu móvel" className="mt-10 flex flex-col px-5">
          {[{ to: '/cardapio', label: 'Cardápio completo' }, ...NAV].map((item, i) => (
            <m.div
              key={item.to}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to={item.to} className="flex items-baseline justify-between border-b border-oven-line py-5">
                <span className="font-display text-[2rem] leading-none">{item.label}</span>
                <span className="eyebrow text-ash">0{i + 1}</span>
              </Link>
            </m.div>
          ))}
          {lastOrder && (
            <Link to={`/pedido/${lastOrder.token}`} className="mt-8 text-sm font-semibold text-olive">
              Acompanhar pedido #{lastOrder.number} →
            </Link>
          )}
        </nav>
      </Dialog>
    </header>
  );
}

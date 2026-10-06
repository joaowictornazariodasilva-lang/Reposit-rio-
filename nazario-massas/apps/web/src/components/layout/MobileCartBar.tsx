import { AnimatePresence, m } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { useCartSummary } from '@/hooks/useCartSummary';
import { formatBRL } from '@/lib/format';
import { useUi } from '@/stores/ui';
import { AnimatedText } from '@/components/ui/AnimatedNumber';

/** Thumb-reachable "view cart" bar on phones while browsing the menu. */
export function MobileCartBar() {
  const { count, subtotal } = useCartSummary();
  const cartOpen = useUi((s) => s.cartOpen);
  const openCart = useUi((s) => s.openCart);
  const visible = count > 0 && !cartOpen;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          className="no-print fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
          initial={{ y: '120%' }}
          animate={{ y: 0 }}
          exit={{ y: '120%' }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        >
          <button
            type="button"
            onClick={openCart}
            className="flex h-14 w-full items-center gap-3 rounded-full bg-tomato pr-5 pl-2 text-white shadow-lift active:scale-[0.98]"
          >
            <span className="tabular grid size-10 place-items-center rounded-full bg-white/15 text-sm font-bold">
              <AnimatedText value={String(count)} />
            </span>
            <span className="flex-1 text-left font-semibold">Ver carrinho</span>
            <ShoppingBag className="size-4 opacity-80" aria-hidden />
            <span className="tabular font-semibold">
              <AnimatedText value={formatBRL(subtotal)} />
            </span>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}

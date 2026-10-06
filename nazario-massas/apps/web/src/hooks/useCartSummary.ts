import { useMemo } from 'react';
import { priceLine, PricingError, type OrderLine, type Product } from '@nazario/shared';
import { useCart, type CartLine } from '@/stores/cart';
import { useCatalog } from '@/stores/catalog';

export interface CartItemView {
  line: CartLine;
  product?: Product;
  priced?: OrderLine;
  /** Product removed/disabled or options changed since it was added. */
  problem?: string;
}

/**
 * Prices the cart locally with the same function the API uses, so totals shown
 * here always match the order the server will create.
 */
export function useCartSummary() {
  const lines = useCart((s) => s.lines);
  const { productsById, groupsById, data } = useCatalog();

  return useMemo(() => {
    const items: CartItemView[] = lines.map((line) => {
      const product = productsById.get(line.productId);
      try {
        return { line, product, priced: priceLine(line, productsById, groupsById) };
      } catch (error) {
        return { line, product, problem: error instanceof PricingError ? error.message : 'Item indisponível.' };
      }
    });
    const subtotal = items.reduce((sum, i) => sum + (i.priced?.lineTotal ?? 0), 0);
    const settings = data?.settings;
    const deliveryEnabled = settings?.deliveryEnabled ?? false;
    const freeFrom = deliveryEnabled ? (settings?.freeDeliveryFrom ?? 0) : 0;
    return {
      items,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal,
      hasProblems: items.some((i) => i.problem),
      deliveryEnabled,
      deliveryFee: settings && deliveryEnabled ? (freeFrom > 0 && subtotal >= freeFrom ? 0 : settings.deliveryFee) : 0,
      freeDeliveryFrom: freeFrom,
      freeDeliveryRemaining: Math.max(0, freeFrom - subtotal),
      minOrder: settings?.minOrder ?? 0,
      ready: Boolean(data),
    };
  }, [lines, productsById, groupsById, data]);
}

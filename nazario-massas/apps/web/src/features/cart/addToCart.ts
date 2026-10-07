import type { CartLineInput, Product } from '@nazario/shared';
import { useCart } from '@/stores/cart';
import { toast, useUi } from '@/stores/ui';
import { flyToCart } from '@/lib/flyToCart';

/** Adds to cart with immediate feedback: header pulse + toast with shortcut to the cart. */
export function addToCart(product: Product, line: Omit<CartLineInput, 'productId'>, from?: Element | null) {
  useCart.getState().add({ productId: product.id, ...line });
  flyToCart(from);
  // Pulse the bag as the photo lands in it.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (from && !reduce) window.setTimeout(() => useUi.getState().pulseCart(), 640);
  else useUi.getState().pulseCart();
  const variant = product.variants.length > 1 ? product.variants.find((v) => v.id === line.variantId)?.label : undefined;
  toast({
    tone: 'success',
    title: `${line.quantity > 1 ? `${line.quantity}× ` : ''}${product.name} no carrinho`,
    description: variant ? `Tamanho ${variant.toLowerCase()}` : undefined,
    action: { label: 'Ver carrinho', onClick: () => useUi.getState().openCart() },
    duration: 3200,
  });
}

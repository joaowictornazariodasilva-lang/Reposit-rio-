import type { CartLineInput, Product } from '@nazario/shared';
import { useCart } from '@/stores/cart';
import { toast, useUi } from '@/stores/ui';

/** Adds to cart with immediate feedback: header pulse + toast with shortcut to the cart. */
export function addToCart(product: Product, line: Omit<CartLineInput, 'productId'>) {
  useCart.getState().add({ productId: product.id, ...line });
  useUi.getState().pulseCart();
  const variant = product.variants.length > 1 ? product.variants.find((v) => v.id === line.variantId)?.label : undefined;
  toast({
    tone: 'success',
    title: `${line.quantity > 1 ? `${line.quantity}× ` : ''}${product.name} no carrinho`,
    description: variant ? `Tamanho ${variant.toLowerCase()}` : undefined,
    action: { label: 'Ver carrinho', onClick: () => useUi.getState().openCart() },
    duration: 3200,
  });
}

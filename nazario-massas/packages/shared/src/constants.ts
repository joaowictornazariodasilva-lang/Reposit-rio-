/** Plain runtime constants (no zod) — safe to import from the storefront's initial bundle. */
export const CATEGORY_IDS = ['pizzas', 'massas', 'bebidas'] as const;
export const PRODUCT_BADGES = ['vegetariano', 'picante', 'novidade', 'assinatura', 'zero'] as const;
export const PAYMENT_METHODS = ['pix', 'card', 'cash'] as const;
export const ORDER_STATUSES = [
  'new',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
] as const;
export const PAYMENT_STATUSES = ['awaiting_payment', 'paid', 'pay_on_delivery', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

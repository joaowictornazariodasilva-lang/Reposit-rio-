import type {
  AddonGroup,
  CartLineInput,
  Catalog,
  Coupon,
  Fulfillment,
  OrderLine,
  Product,
  StoreSettings,
} from './schemas';

export class PricingError extends Error {
  constructor(
    message: string,
    readonly code: 'PRODUCT_UNAVAILABLE' | 'INVALID_VARIANT' | 'INVALID_ADDON' | 'ADDON_LIMIT' | 'MIN_ORDER',
  ) {
    super(message);
    this.name = 'PricingError';
  }
}

export interface PricedOrder {
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  coupon?: Coupon;
  /** Non-fatal coupon feedback, e.g. "valid from R$ 80". */
  couponMessage?: string;
  freeDeliveryRemaining: number;
}

/** Resolve one cart line against the live catalog. Throws PricingError when the line is no longer valid. */
export function priceLine(
  input: CartLineInput,
  products: Map<string, Product>,
  groups: Map<string, AddonGroup>,
): OrderLine {
  const product = products.get(input.productId);
  if (!product || !product.active) {
    throw new PricingError('Um item do carrinho não está mais disponível.', 'PRODUCT_UNAVAILABLE');
  }
  const variant = product.variants.find((v) => v.id === input.variantId);
  if (!variant) throw new PricingError(`Tamanho inválido para ${product.name}.`, 'INVALID_VARIANT');

  const productGroups = product.addonGroupIds
    .map((id) => groups.get(id))
    .filter((g): g is AddonGroup => Boolean(g));

  const addons: OrderLine['addons'] = [];
  const unique = [...new Set(input.addonOptionIds ?? [])];
  for (const optionId of unique) {
    const group = productGroups.find((g) => g.options.some((o) => o.id === optionId));
    const option = group?.options.find((o) => o.id === optionId);
    if (!group || !option || !option.active) {
      throw new PricingError(`Adicional indisponível em ${product.name}.`, 'INVALID_ADDON');
    }
    addons.push({ groupName: group.name, optionId: option.id, name: option.name, price: option.price });
  }
  for (const group of productGroups) {
    const picked = addons.filter((a) => group.options.some((o) => o.id === a.optionId)).length;
    if (picked > group.maxSelect || picked < group.minSelect) {
      throw new PricingError(`Seleção inválida em "${group.name}" (${product.name}).`, 'ADDON_LIMIT');
    }
  }

  const unitPrice = variant.price + addons.reduce((sum, a) => sum + a.price, 0);
  return {
    productId: product.id,
    productName: product.name,
    categoryId: product.categoryId,
    variantId: variant.id,
    variantLabel: variant.label,
    unitPrice,
    quantity: input.quantity,
    addons,
    notes: input.notes ?? '',
    lineTotal: unitPrice * input.quantity,
  };
}

export function findCoupon(settings: StoreSettings, code?: string): Coupon | undefined {
  if (!code) return undefined;
  const normalized = code.trim().toUpperCase();
  return settings.coupons.find((c) => c.active && c.code.toUpperCase() === normalized);
}

export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (subtotal < coupon.minSubtotal) return 0;
  const raw = coupon.kind === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  return Math.min(raw, subtotal);
}

/**
 * Single source of truth for order totals. The API calls this with the
 * persisted catalog; the storefront calls it for instant previews only.
 */
export function priceOrder(
  items: CartLineInput[],
  catalog: Pick<Catalog, 'products' | 'addonGroups' | 'settings'>,
  options: { fulfillment: Fulfillment['type']; couponCode?: string },
): PricedOrder {
  const products = new Map(catalog.products.map((p) => [p.id, p]));
  const groups = new Map(catalog.addonGroups.map((g) => [g.id, g]));
  const lines = items.map((item) => priceLine(item, products, groups));
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const { settings } = catalog;

  let discount = 0;
  let couponMessage: string | undefined;
  const coupon = findCoupon(settings, options.couponCode);
  if (options.couponCode && !coupon) couponMessage = 'Cupom inválido ou expirado.';
  if (coupon) {
    discount = couponDiscount(coupon, subtotal);
    if (discount === 0) couponMessage = `Cupom válido para pedidos a partir de ${formatBRL(coupon.minSubtotal)}.`;
  }

  const isDelivery = options.fulfillment === 'delivery';
  const freeDelivery = settings.freeDeliveryFrom > 0 && subtotal >= settings.freeDeliveryFrom;
  const deliveryFee = isDelivery && !freeDelivery ? settings.deliveryFee : 0;
  const freeDeliveryRemaining = isDelivery && !freeDelivery ? Math.max(0, settings.freeDeliveryFrom - subtotal) : 0;

  return {
    lines,
    subtotal,
    deliveryFee,
    discount,
    total: subtotal - discount + deliveryFee,
    coupon: discount > 0 ? coupon : undefined,
    couponMessage,
    freeDeliveryRemaining,
  };
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function formatBRL(valueInCents: number): string {
  return brl.format(valueInCents / 100);
}

/** Lowest price among variants, for "a partir de" labels. */
export function startingPrice(product: Pick<Product, 'variants'>): number {
  return Math.min(...product.variants.map((v) => v.price));
}

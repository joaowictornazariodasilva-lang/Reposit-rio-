import { z } from 'zod';
import { CATEGORY_IDS, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, PRODUCT_BADGES, type PaymentStatus } from './constants';

/** All monetary values are integer cents (BRL). */
export const cents = z.number().int().min(0);

export const categoryId = z.enum(CATEGORY_IDS);
export type CategoryId = z.infer<typeof categoryId>;

export const categorySchema = z.object({
  id: categoryId,
  name: z.string().min(2).max(40),
  tagline: z.string().max(80),
  description: z.string().max(280),
  sortOrder: z.number().int(),
  active: z.boolean(),
});
export type Category = z.infer<typeof categorySchema>;

export const productBadge = z.enum(PRODUCT_BADGES);
export type ProductBadge = z.infer<typeof productBadge>;

export const variantSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(40),
  detail: z.string().max(60).optional(),
  price: cents,
});
export type Variant = z.infer<typeof variantSchema>;

export const addonOptionSchema = z.object({
  id: z.string().min(1).max(60),
  name: z.string().min(1).max(60),
  price: cents,
  active: z.boolean(),
});
export type AddonOption = z.infer<typeof addonOptionSchema>;

export const addonGroupSchema = z
  .object({
    id: z.string().min(1).max(60),
    name: z.string().min(1).max(60),
    description: z.string().max(120).optional(),
    minSelect: z.number().int().min(0),
    maxSelect: z.number().int().min(1),
    options: z.array(addonOptionSchema).min(1),
  })
  .refine((g) => g.maxSelect >= g.minSelect, { message: 'maxSelect deve ser ≥ minSelect' });
export type AddonGroup = z.infer<typeof addonGroupSchema>;

export const productSchema = z.object({
  id: z.string().min(1).max(60),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hífens'),
  categoryId,
  name: z.string().min(2).max(60),
  shortDescription: z.string().min(2).max(120),
  description: z.string().max(600),
  ingredients: z.array(z.string().min(1).max(40)).max(20),
  image: z.string().max(300).optional(),
  imageAlt: z.string().max(160).optional(),
  badges: z.array(productBadge).max(4),
  featured: z.boolean(),
  active: z.boolean(),
  sortOrder: z.number().int(),
  variants: z.array(variantSchema).min(1).max(6),
  addonGroupIds: z.array(z.string()).max(6),
});
export type Product = z.infer<typeof productSchema>;

/** Payload accepted from the admin when creating/updating a product. */
export const productInputSchema = productSchema.omit({ id: true });
export type ProductInput = z.infer<typeof productInputSchema>;

export const couponSchema = z.object({
  code: z.string().min(3).max(24),
  kind: z.enum(['percent', 'fixed']),
  value: z.number().int().min(1),
  minSubtotal: cents,
  active: z.boolean(),
  description: z.string().max(80),
});
export type Coupon = z.infer<typeof couponSchema>;

export const storeSettingsSchema = z.object({
  storeName: z.string(),
  phone: z.string(),
  whatsapp: z.string(),
  address: z.string(),
  hours: z.string(),
  isOpen: z.boolean(),
  deliveryFee: cents,
  freeDeliveryFrom: cents,
  minOrder: cents,
  deliveryEstimate: z.string(),
  pickupEstimate: z.string(),
  coupons: z.array(couponSchema),
});
export type StoreSettings = z.infer<typeof storeSettingsSchema>;

/* ───────────── Checkout ───────────── */

const digits = (min: number, max: number) =>
  z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().min(min).max(max));

export const addressSchema = z.object({
  cep: digits(8, 8),
  street: z.string().trim().min(2, 'Informe a rua').max(120),
  number: z.string().trim().min(1, 'Informe o número').max(12),
  complement: z.string().trim().max(60).optional().default(''),
  neighborhood: z.string().trim().min(2, 'Informe o bairro').max(80),
  city: z.string().trim().min(2, 'Informe a cidade').max(80),
  reference: z.string().trim().max(120).optional().default(''),
});
export type Address = z.infer<typeof addressSchema>;

export const fulfillmentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('delivery'), address: addressSchema }),
  z.object({ type: z.literal('pickup') }),
]);
export type Fulfillment = z.infer<typeof fulfillmentSchema>;

export const paymentMethod = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof paymentMethod>;

export const cartLineInputSchema = z.object({
  productId: z.string().min(1).max(60),
  variantId: z.string().min(1).max(40),
  quantity: z.number().int().min(1).max(20),
  addonOptionIds: z.array(z.string().max(60)).max(20).default([]),
  notes: z.string().trim().max(140).optional().default(''),
});
export type CartLineInput = z.infer<typeof cartLineInputSchema>;

export const checkoutSchema = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2, 'Informe seu nome').max(80),
      phone: digits(10, 11),
      /** CPF/CNPJ — only required when an online gateway (e.g. Asaas) issues the charge. */
      document: z
        .string()
        .transform((v) => v.replace(/\D/g, ''))
        .pipe(z.union([z.literal(''), z.string().length(11), z.string().length(14)]))
        .optional(),
    }),
    fulfillment: fulfillmentSchema,
    items: z.array(cartLineInputSchema).min(1, 'Seu carrinho está vazio').max(40),
    payment: z.object({
      method: paymentMethod,
      /** Cash only: amount the customer will pay with, for change. */
      changeFor: cents.optional(),
    }),
    couponCode: z.string().trim().max(24).optional(),
  })
  .strict();
export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

/* ───────────── Orders ───────────── */

export const orderStatus = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatus>;


export interface OrderLine {
  productId: string;
  productName: string;
  categoryId: CategoryId;
  variantId: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  addons: { groupName: string; optionId: string; name: string; price: number }[];
  notes: string;
  lineTotal: number;
}

export interface PixCharge {
  qrCodeImage: string;
  copyPaste: string;
  expiresAt: string;
}

export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  provider: string;
  providerChargeId?: string;
  pix?: PixCharge;
  changeFor?: number;
  paidAt?: string;
}

export interface Order {
  id: string;
  number: number;
  /** Unguessable token used in the customer's tracking URL. */
  accessToken: string;
  createdAt: string;
  updatedAt: string;
  customer: { name: string; phone: string; document?: string };
  fulfillment: Fulfillment;
  items: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  payment: OrderPayment;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: string }[];
}

/** What the customer-facing tracking endpoint exposes (no internal ids). */
export type PublicOrder = Omit<Order, 'id' | 'accessToken'> & { token: string };

export const statusUpdateSchema = z.object({ status: orderStatus });
export const paymentUpdateSchema = z.object({ status: z.enum(PAYMENT_STATUSES) });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(120),
  password: z.string().min(1, 'Informe a senha').max(200),
});

export interface PaymentCapabilities {
  provider: string;
  /** Pix is charged online (QR code) instead of on delivery. */
  onlinePix: boolean;
  /** Gateway needs CPF/CNPJ to issue a charge. */
  requiresDocument: boolean;
  /** Sandbox/mock provider — the UI may show a "simulate payment" helper. */
  testMode: boolean;
}

/** Public settings: coupons are never exposed to the storefront. */
export type PublicSettings = Omit<StoreSettings, 'coupons'>;

export interface Catalog {
  categories: Category[];
  products: Product[];
  addonGroups: AddonGroup[];
  settings: StoreSettings;
}

export interface PublicCatalog {
  categories: Category[];
  products: Product[];
  addonGroups: AddonGroup[];
  settings: PublicSettings;
  payments: PaymentCapabilities;
}

export interface Quote {
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  couponMessage?: string;
  freeDeliveryRemaining: number;
  minOrder: number;
}

export const quoteSchema = z.object({
  items: z.array(cartLineInputSchema).max(40),
  fulfillment: z.enum(['delivery', 'pickup']),
  couponCode: z.string().trim().max(24).optional(),
});

export interface DashboardStats {
  today: { orders: number; revenue: number; averageTicket: number; cancelled: number };
  byStatus: Record<OrderStatus, number>;
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  revenueByHour: { hour: number; revenue: number; orders: number }[];
  last7Days: { date: string; revenue: number; orders: number }[];
}

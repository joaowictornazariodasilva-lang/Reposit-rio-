import { describe, expect, it } from 'vitest';
import { priceOrder, PricingError } from './pricing';
import { canTransition, nextStatus, trackingSteps } from './status';
import type { AddonGroup, Product, StoreSettings } from './schemas';

const pizza: Product = {
  id: 'p1',
  slug: 'margherita',
  categoryId: 'pizzas',
  name: 'Margherita',
  shortDescription: 'x',
  description: '',
  ingredients: [],
  badges: [],
  featured: false,
  active: true,
  sortOrder: 0,
  variants: [
    { id: 'p', label: 'Pequena', price: 4000 },
    { id: 'g', label: 'Grande', price: 8000 },
  ],
  addonGroupIds: ['borda', 'extras'],
};
const groups: AddonGroup[] = [
  { id: 'borda', name: 'Borda', minSelect: 0, maxSelect: 1, options: [
    { id: 'b1', name: 'Catupiry', price: 1200, active: true },
    { id: 'b2', name: 'Cheddar', price: 1200, active: true },
  ] },
  { id: 'extras', name: 'Extras', minSelect: 0, maxSelect: 2, options: [
    { id: 'e1', name: 'Bacon', price: 1000, active: true },
    { id: 'e2', name: 'Queijo', price: 900, active: false },
  ] },
];
const settings: StoreSettings = {
  storeName: 'N', phone: '', whatsapp: '', address: '', hours: '', isOpen: true, deliveryEnabled: true,
  deliveryFee: 790, freeDeliveryFrom: 15000, minOrder: 3000, deliveryEstimate: '', pickupEstimate: '',
  coupons: [
    { code: 'BEMVINDO10', kind: 'percent', value: 10, minSubtotal: 6000, active: true, description: '' },
    { code: 'OFF', kind: 'fixed', value: 2000, minSubtotal: 0, active: false, description: '' },
  ],
};
const catalog = { products: [pizza], addonGroups: groups, settings };
const line = (over: Partial<{ variantId: string; quantity: number; addonOptionIds: string[] }> = {}) => ({
  productId: 'p1', variantId: 'p', quantity: 1, addonOptionIds: [], notes: '', ...over,
});

describe('priceOrder', () => {
  it('prices variant + addons × quantity and adds delivery fee', () => {
    const r = priceOrder([line({ quantity: 2, addonOptionIds: ['b1', 'e1'] })], catalog, { fulfillment: 'delivery' });
    expect(r.lines[0]?.unitPrice).toBe(4000 + 1200 + 1000);
    expect(r.subtotal).toBe(12400);
    expect(r.deliveryFee).toBe(790);
    expect(r.total).toBe(13190);
    expect(r.freeDeliveryRemaining).toBe(2600);
  });

  it('gives free delivery above the threshold and none for pickup', () => {
    expect(priceOrder([line({ variantId: 'g', quantity: 2 })], catalog, { fulfillment: 'delivery' }).deliveryFee).toBe(0);
    expect(priceOrder([line()], catalog, { fulfillment: 'pickup' }).deliveryFee).toBe(0);
  });

  it('applies coupons case-insensitively and respects minimum subtotal', () => {
    const ok = priceOrder([line({ variantId: 'g' })], catalog, { fulfillment: 'pickup', couponCode: 'bemvindo10' });
    expect(ok.discount).toBe(800);
    expect(ok.total).toBe(7200);
    const low = priceOrder([line()], catalog, { fulfillment: 'pickup', couponCode: 'BEMVINDO10' });
    expect(low.discount).toBe(0);
    expect(low.couponMessage).toMatch(/a partir de/);
    const inactive = priceOrder([line()], catalog, { fulfillment: 'pickup', couponCode: 'OFF' });
    expect(inactive.discount).toBe(0);
    expect(inactive.couponMessage).toMatch(/inválido/);
  });

  it('rejects tampered carts', () => {
    expect(() => priceOrder([line({ variantId: 'xx' })], catalog, { fulfillment: 'pickup' })).toThrow(PricingError);
    expect(() => priceOrder([line({ addonOptionIds: ['b1', 'b2'] })], catalog, { fulfillment: 'pickup' })).toThrow(/Seleção inválida/);
    expect(() => priceOrder([line({ addonOptionIds: ['e2'] })], catalog, { fulfillment: 'pickup' })).toThrow(/indisponível/);
    expect(() => priceOrder([{ ...line(), productId: 'nope' }], catalog, { fulfillment: 'pickup' })).toThrow(/não está mais disponível/);
    const inactive = { ...catalog, products: [{ ...pizza, active: false }] };
    expect(() => priceOrder([line()], inactive, { fulfillment: 'pickup' })).toThrow(PricingError);
  });
});

describe('order status', () => {
  const delivery = { fulfillment: { type: 'pickup' as const } };
  it('skips out_for_delivery for pickup', () => {
    expect(nextStatus({ ...delivery, status: 'ready' })).toBe('completed');
  });
  it('is forward-only and terminal after completion/cancel', () => {
    expect(canTransition({ ...delivery, status: 'preparing' }, 'confirmed')).toBe(false);
    expect(canTransition({ ...delivery, status: 'new' }, 'preparing')).toBe(true);
    expect(canTransition({ ...delivery, status: 'completed' }, 'cancelled')).toBe(false);
    expect(canTransition({ ...delivery, status: 'new' }, 'cancelled')).toBe(true);
  });
  it('builds the customer timeline', () => {
    const steps = trackingSteps({
      status: 'preparing',
      fulfillment: { type: 'delivery', address: {} as never },
      payment: { method: 'pix', status: 'paid', provider: 'mock' },
    });
    expect(steps.map((s) => s.state)).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming']);
  });
  it('treats received/payment as instant events and the next step as current', () => {
    const base = { fulfillment: { type: 'pickup' as const } };
    const awaiting = trackingSteps({ ...base, status: 'new', payment: { method: 'pix', status: 'awaiting_payment', provider: 'mock' } });
    expect(awaiting.map((s) => s.state)).toEqual(['done', 'current', 'upcoming', 'upcoming', 'upcoming']);
    const paid = trackingSteps({ ...base, status: 'confirmed', payment: { method: 'pix', status: 'paid', provider: 'mock' } });
    expect(paid.map((s) => s.state)).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming']);
    const finished = trackingSteps({ ...base, status: 'completed', payment: { method: 'cash', status: 'pay_on_delivery', provider: 'mock' } });
    expect(finished.every((s) => s.state === 'done')).toBe(true);
  });
});

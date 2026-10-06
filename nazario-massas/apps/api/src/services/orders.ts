import { randomBytes, randomUUID } from 'node:crypto';
import { canTransition, formatBRL, priceOrder, type CheckoutData, type Order, type OrderStatus, type PaymentStatus, type PublicOrder, type Quote } from '@nazario/shared';
import type { PaymentProvider } from '../payments';
import type { Repositories } from '../repositories/types';

export class DomainError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 | 422 = 422,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export function toPublicOrder(order: Order): PublicOrder {
  const { id: _id, accessToken, customer, ...rest } = order;
  return { ...rest, customer: { name: customer.name, phone: customer.phone }, token: accessToken };
}

export function createOrderService(repos: Repositories, payments: PaymentProvider) {
  async function loadPricingCatalog() {
    const [products, addonGroups, settings] = await Promise.all([
      repos.catalog.listProducts(),
      repos.catalog.listAddonGroups(),
      repos.catalog.getSettings(),
    ]);
    return { products, addonGroups, settings };
  }

  return {
    async quote(input: { items: CheckoutData['items']; fulfillment: 'delivery' | 'pickup'; couponCode?: string }): Promise<Quote> {
      const catalog = await loadPricingCatalog();
      const fulfillment = catalog.settings.deliveryEnabled ? input.fulfillment : 'pickup';
      const priced = priceOrder(input.items, catalog, { fulfillment, couponCode: input.couponCode });
      return {
        lines: priced.lines,
        subtotal: priced.subtotal,
        deliveryFee: priced.deliveryFee,
        discount: priced.discount,
        total: priced.total,
        couponCode: priced.coupon?.code,
        couponMessage: priced.couponMessage,
        freeDeliveryRemaining: priced.freeDeliveryRemaining,
        minOrder: catalog.settings.minOrder,
      };
    },

    async create(input: CheckoutData): Promise<Order> {
      const catalog = await loadPricingCatalog();
      const { settings } = catalog;
      if (!settings.isOpen) throw new DomainError('A loja está fechada no momento. Volte no nosso horário de funcionamento.', 409);

      if (input.fulfillment.type === 'delivery' && !settings.deliveryEnabled) {
        throw new DomainError('No momento trabalhamos apenas com retirada no local.');
      }
      const priced = priceOrder(input.items, catalog, {
        fulfillment: input.fulfillment.type,
        couponCode: input.couponCode,
      });
      if (priced.subtotal < settings.minOrder) {
        throw new DomainError(`O pedido mínimo é de ${formatBRL(settings.minOrder)}.`);
      }
      const method = input.payment.method;
      const document = input.customer.document || undefined;
      if (method === 'pix' && payments.capabilities.requiresDocument && !document) {
        throw new DomainError('Informe seu CPF para gerar o Pix.');
      }
      if (method === 'cash' && input.payment.changeFor && input.payment.changeFor < priced.total) {
        throw new DomainError('O valor para troco precisa ser maior que o total do pedido.');
      }

      const now = new Date().toISOString();
      const draft: Order = {
        id: randomUUID(),
        number: await repos.orders.nextOrderNumber(),
        accessToken: randomBytes(18).toString('base64url'),
        createdAt: now,
        updatedAt: now,
        customer: { name: input.customer.name, phone: input.customer.phone, document },
        fulfillment: input.fulfillment,
        items: priced.lines,
        subtotal: priced.subtotal,
        deliveryFee: priced.deliveryFee,
        discount: priced.discount,
        couponCode: priced.coupon?.code,
        total: priced.total,
        payment: {
          method,
          status: 'awaiting_payment',
          provider: payments.name,
          changeFor: method === 'cash' ? input.payment.changeFor : undefined,
        },
        status: 'new',
        statusHistory: [{ status: 'new', at: now }],
      };

      // Charge first: if the gateway fails, nothing is persisted and the customer can retry.
      const { payment } = await payments.createCharge(draft);
      return repos.orders.createOrder({ ...draft, payment });
    },

    async changeStatus(id: string, status: OrderStatus): Promise<Order> {
      const order = await repos.orders.getOrder(id);
      if (!order) throw new DomainError('Pedido não encontrado.', 404);
      if (!canTransition(order, status)) {
        throw new DomainError('Esta mudança de status não é permitida.', 409);
      }
      const at = new Date().toISOString();
      const updated = await repos.orders.updateOrder(id, (o) => ({
        ...o,
        status,
        statusHistory: [...o.statusHistory, { status, at }],
        // Card/cash collected by the courier or at the counter: completing the order settles it.
        payment:
          status === 'completed' && o.payment.status === 'pay_on_delivery' ? { ...o.payment, status: 'paid', paidAt: at } : o.payment,
      }));
      return updated!;
    },

    async setPaymentStatus(id: string, status: PaymentStatus): Promise<Order> {
      const updated = await repos.orders.updateOrder(id, (o) => ({
        ...o,
        payment: { ...o.payment, status, paidAt: status === 'paid' ? new Date().toISOString() : o.payment.paidAt },
        // A paid Pix order is automatically confirmed for the kitchen.
        ...(status === 'paid' && o.status === 'new'
          ? {
              status: 'confirmed' as const,
              statusHistory: [...o.statusHistory, { status: 'confirmed' as const, at: new Date().toISOString() }],
            }
          : {}),
      }));
      if (!updated) throw new DomainError('Pedido não encontrado.', 404);
      return updated;
    },
  };
}

export type OrderService = ReturnType<typeof createOrderService>;

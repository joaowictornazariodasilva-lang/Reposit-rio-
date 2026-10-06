import type { Order, OrderPayment, PaymentCapabilities } from '@nazario/shared';

export interface ChargeResult {
  payment: OrderPayment;
}

/**
 * Gateway abstraction. Adding a provider (Asaas, Mercado Pago, Stripe…) means
 * implementing this interface — checkout and order code stay untouched.
 */
export interface PaymentProvider {
  readonly name: string;
  readonly capabilities: PaymentCapabilities;
  /** Called once the order is persisted. Must never trust client-side amounts. */
  createCharge(order: Order): Promise<ChargeResult>;
}

export class PaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentError';
  }
}

/** Card and cash are settled with the courier/at the counter in v1. */
export function offlinePayment(order: Order, provider: string): ChargeResult {
  return {
    payment: {
      method: order.payment.method,
      status: 'pay_on_delivery',
      provider,
      changeFor: order.payment.changeFor,
    },
  };
}

import { timingSafeEqual } from 'node:crypto';
import { Hono } from 'hono';
import type { PaymentStatus } from '@nazario/shared';
import { config } from '../config';
import type { Repositories } from '../repositories/types';
import type { OrderService } from '../services/orders';

const ASAAS_EVENTS: Record<string, PaymentStatus> = {
  PAYMENT_RECEIVED: 'paid',
  PAYMENT_CONFIRMED: 'paid',
  PAYMENT_OVERDUE: 'failed',
  PAYMENT_DELETED: 'failed',
  PAYMENT_REFUNDED: 'refunded',
};

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function webhookRoutes(repos: Repositories, orders: OrderService) {
  const app = new Hono();

  app.post('/asaas', async (c) => {
    const token = config.payments.asaas.webhookToken;
    if (!token || !safeEqual(c.req.header('asaas-access-token') ?? '', token)) {
      return c.json({ error: 'unauthorized' }, 401);
    }
    const body = (await c.req.json().catch(() => null)) as {
      event?: string;
      payment?: { id?: string; externalReference?: string };
    } | null;
    const status = body?.event ? ASAAS_EVENTS[body.event] : undefined;
    const chargeId = body?.payment?.id;
    if (!status || !chargeId) return c.json({ received: true });

    const order = await repos.orders.getOrderByChargeId(chargeId);
    // Idempotent: Asaas retries deliveries; re-applying the same status is harmless.
    if (order && order.payment.status !== status) await orders.setPaymentStatus(order.id, status);
    return c.json({ received: true });
  });

  return app;
}

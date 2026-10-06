import type { PaymentStatus } from './constants';
import type { Fulfillment, Order, OrderStatus, PaymentMethod } from './schemas';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Novo',
  confirmed: 'Confirmado',
  preparing: 'Em preparação',
  ready: 'Pronto',
  out_for_delivery: 'Saiu para entrega',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  awaiting_payment: 'Aguardando pagamento',
  paid: 'Pago',
  pay_on_delivery: 'Pagamento presencial',
  failed: 'Falhou',
  refunded: 'Estornado',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: 'Pix',
  card: 'Cartão',
  cash: 'Dinheiro',
};

const FLOW: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed'];

/** Kitchen workflow. Pickup orders skip "out for delivery". */
export function statusFlow(type: Fulfillment['type']): OrderStatus[] {
  return type === 'pickup' ? FLOW.filter((s) => s !== 'out_for_delivery') : FLOW;
}

export function nextStatus(order: Pick<Order, 'status' | 'fulfillment'>): OrderStatus | null {
  const flow = statusFlow(order.fulfillment.type);
  const index = flow.indexOf(order.status);
  if (index === -1 || index === flow.length - 1) return null;
  return flow[index + 1] ?? null;
}

export function canTransition(order: Pick<Order, 'status' | 'fulfillment'>, to: OrderStatus): boolean {
  if (order.status === 'completed' || order.status === 'cancelled') return false;
  if (to === 'cancelled') return true;
  const flow = statusFlow(order.fulfillment.type);
  // Forward-only, but the admin may skip steps (e.g. new → preparing).
  return flow.indexOf(to) > flow.indexOf(order.status);
}

export function isPaymentSettled(status: PaymentStatus): boolean {
  return status === 'paid' || status === 'pay_on_delivery';
}

export interface TrackingStep {
  key: string;
  label: string;
  description: string;
  state: 'done' | 'current' | 'upcoming';
}

/** Customer-facing 5-step timeline derived from order + payment status. */
export function trackingSteps(order: Pick<Order, 'status' | 'fulfillment' | 'payment'>): TrackingStep[] {
  const pickup = order.fulfillment.type === 'pickup';
  const rank: Record<OrderStatus, number> = {
    new: 0,
    confirmed: 1,
    preparing: 2,
    ready: pickup ? 3 : 2,
    out_for_delivery: 3,
    completed: 4,
    cancelled: -1,
  };
  const paymentOk =
    order.payment.status === 'paid' || (order.payment.status === 'pay_on_delivery' && rank[order.status] >= 1);
  const reached = [
    true,
    paymentOk || rank[order.status] >= 1,
    rank[order.status] >= 2,
    rank[order.status] >= 3,
    rank[order.status] >= 4,
  ];
  const defs = [
    { key: 'received', label: 'Pedido recebido', description: 'Recebemos seu pedido.' },
    {
      key: 'payment',
      label: order.payment.status === 'pay_on_delivery' ? 'Pedido confirmado' : 'Pagamento confirmado',
      description:
        order.payment.status === 'pay_on_delivery'
          ? pickup
            ? 'Pagamento será feito na retirada.'
            : 'Pagamento será feito na entrega.'
          : order.payment.status === 'paid'
            ? 'Pagamento aprovado.'
            : 'Aguardando a confirmação do pagamento.',
    },
    { key: 'preparing', label: 'Em preparação', description: 'Nossa cozinha está preparando seu pedido.' },
    pickup
      ? { key: 'ready', label: 'Pronto para retirada', description: 'Pode vir buscar no balcão.' }
      : { key: 'out', label: 'Saiu para entrega', description: 'O entregador está a caminho.' },
    { key: 'done', label: pickup ? 'Retirado' : 'Entregue', description: 'Bom apetite!' },
  ];
  // "Received" and "payment" are instant events: once reached they're done and the next step is in progress.
  // "Preparing" and "out for delivery" are ongoing: the last one reached is the current step.
  const lastReached = reached.lastIndexOf(true);
  const ongoing = lastReached === 2 || lastReached === 3;
  const currentIndex = lastReached === defs.length - 1 ? -1 : ongoing ? lastReached : lastReached + 1;
  return defs.map((d, i) => ({
    ...d,
    state: i === currentIndex ? 'current' : i <= lastReached ? 'done' : 'upcoming',
  }));
}

import { ORDER_STATUSES, type DashboardStats, type Order, type OrderStatus } from '@nazario/shared';

const TIME_ZONE = 'America/Sao_Paulo';
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const hourOf = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', hourCycle: 'h23' });

const counts = (o: Order) => o.status !== 'cancelled';

export function computeStats(orders: Order[], now = new Date()): DashboardStats {
  const today = dayKey.format(now);
  const todays = orders.filter((o) => dayKey.format(new Date(o.createdAt)) === today);
  const valid = todays.filter(counts);
  const revenue = valid.reduce((sum, o) => sum + o.total, 0);

  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  // Open orders count regardless of day (a late order may cross midnight); finished ones only today.
  for (const o of orders) {
    const finished = o.status === 'completed' || o.status === 'cancelled';
    if (!finished || dayKey.format(new Date(o.createdAt)) === today) byStatus[o.status]++;
  }

  const products = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>();
  for (const o of valid) {
    for (const line of o.items) {
      const entry = products.get(line.productId) ?? { productId: line.productId, name: line.productName, quantity: 0, revenue: 0 };
      entry.quantity += line.quantity;
      entry.revenue += line.lineTotal;
      products.set(line.productId, entry);
    }
  }

  const revenueByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0, orders: 0 }));
  for (const o of valid) {
    const bucket = revenueByHour[Number(hourOf.format(new Date(o.createdAt)))];
    if (bucket) {
      bucket.revenue += o.total;
      bucket.orders++;
    }
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = dayKey.format(new Date(now.getTime() - (6 - i) * 86_400_000));
    const dayOrders = orders.filter((o) => counts(o) && dayKey.format(new Date(o.createdAt)) === date);
    return { date, orders: dayOrders.length, revenue: dayOrders.reduce((s, o) => s + o.total, 0) };
  });

  return {
    today: {
      orders: valid.length,
      revenue,
      averageTicket: valid.length ? Math.round(revenue / valid.length) : 0,
      cancelled: todays.length - valid.length,
    },
    byStatus,
    topProducts: [...products.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    revenueByHour,
    last7Days,
  };
}

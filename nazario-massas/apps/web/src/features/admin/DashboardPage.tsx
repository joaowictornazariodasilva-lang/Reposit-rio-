import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { m } from 'motion/react';
import { ArrowRight, Bike, ChefHat, Inbox, PackageCheck, BadgeCheck } from 'lucide-react';
import type { DashboardStats, OrderStatus } from '@nazario/shared';
import { CountUp } from '@/components/ui/AnimatedNumber';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { formatBRL, timeAgo } from '@/lib/format';
import { adminApi } from './session';
import { useCatalog } from '@/stores/catalog';
import { useOrdersFeed } from './useOrdersFeed';
import { Panel, PageHeader, PaymentBadge, StatusBadge } from './ui';
import { RevenueChart } from './RevenueChart';

const PIPELINE: { status: OrderStatus; label: string; icon: typeof Inbox }[] = [
  { status: 'new', label: 'Novos', icon: Inbox },
  { status: 'confirmed', label: 'Confirmados', icon: BadgeCheck },
  { status: 'preparing', label: 'Em preparação', icon: ChefHat },
  { status: 'ready', label: 'Prontos', icon: PackageCheck },
  { status: 'out_for_delivery', label: 'Em entrega', icon: Bike },
];

const brl = (n: number) => formatBRL(n);
const int = (n: number) => String(n);

function Kpi({ label, value, format, hint, index }: { label: string; value: number; format: (n: number) => string; hint?: string; index: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[var(--radius-lg)] bg-paper p-5 shadow-soft"
    >
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-[1.625rem] leading-none tracking-[-0.02em] text-ink sm:text-[2.125rem]">
        <CountUp value={value} format={format} />
      </p>
      {hint && <p className="mt-2 text-xs text-ink-muted">{hint}</p>}
    </m.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>();
  const [error, setError] = useState<string>();
  const orders = useOrdersFeed((s) => s.orders);

  const load = useCallback(() => {
    adminApi
      .stats()
      .then((s) => {
        setStats(s);
        setError(undefined);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  // Recompute whenever the live order feed changes.
  useEffect(load, [load, orders]);

  if (error && !stats) return <ErrorState message={error} onRetry={load} />;

  const deliveryEnabled = useCatalog((s) => s.data?.settings.deliveryEnabled ?? false);
  const pipeline = PIPELINE.filter((p) => p.status !== 'out_for_delivery' || deliveryEnabled || (stats?.byStatus.out_for_delivery ?? 0) > 0);
  const inProgress = stats ? pipeline.reduce((n, p) => n + stats.byStatus[p.status], 0) : 0;
  const topMax = Math.max(1, ...(stats?.topProducts.map((p) => p.quantity) ?? [1]));
  const recent = orders.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Visão geral" description="Atualizado automaticamente a cada pedido." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats ? (
          <>
            <Kpi index={0} label="Pedidos hoje" value={stats.today.orders} format={int} hint={stats.today.cancelled ? `${stats.today.cancelled} cancelado(s)` : undefined} />
            <Kpi index={1} label="Faturamento hoje" value={stats.today.revenue} format={brl} />
            <Kpi index={2} label="Ticket médio" value={stats.today.averageTicket} format={brl} />
            <Kpi index={3} label="Em andamento" value={inProgress} format={int} hint="Novos até prontos" />
          </>
        ) : (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[7.5rem] rounded-[var(--radius-lg)]" />)
        )}
      </div>

      <Panel title="Pedidos por etapa" className="mt-4" action={<Link to="/admin/pedidos" className="text-sm font-semibold text-tomato hover:underline">Abrir quadro</Link>}>
        <ul className={`grid grid-cols-2 gap-2 ${pipeline.length === 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
          {pipeline.map(({ status, label, icon: Icon }) => (
            <li key={status}>
              <Link
                to={`/admin/pedidos?status=${status}`}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line px-4 py-3 transition-colors hover:border-ink/40"
              >
                <Icon className="size-5 text-ink-soft" aria-hidden />
                <span className="min-w-0">
                  <span className="tabular block text-xl font-semibold text-ink">{stats?.byStatus[status] ?? '–'}</span>
                  <span className="block truncate text-xs text-ink-muted">{label}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Faturamento · últimos 7 dias">
          {stats ? <RevenueChart data={stats.last7Days} /> : <Skeleton className="h-60" />}
        </Panel>

        <Panel title="Mais vendidos hoje">
          {!stats ? (
            <Skeleton className="h-60" />
          ) : stats.topProducts.length === 0 ? (
            <EmptyState title="Sem vendas ainda" description="Os campeões do dia aparecem aqui." className="py-8" />
          ) : (
            <ol className="space-y-4">
              {stats.topProducts.map((p, i) => (
                <li key={p.productId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-ink">
                      <span className="mr-2 text-ink-muted tabular">{i + 1}.</span>
                      {p.name}
                    </span>
                    <span className="tabular shrink-0 text-ink-soft">
                      {p.quantity} un · {formatBRL(p.revenue)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-flour-deep" aria-hidden>
                    <m.div
                      className="h-full origin-left rounded-full bg-tomato"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: p.quantity / topMax }}
                      transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <Panel
        title="Pedidos recentes"
        className="mt-4"
        action={
          <Link to="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-tomato hover:underline">
            Ver todos <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      >
        {recent.length === 0 ? (
          <EmptyState title="Nenhum pedido ainda" description="Assim que um cliente pedir, ele aparece aqui com um aviso sonoro." className="py-8" />
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((o) => (
              <li key={o.id}>
                <Link to={`/admin/pedidos/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 hover:bg-flour/60 sm:flex-nowrap">
                  <span className="tabular w-14 font-semibold text-ink">#{o.number}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{o.customer.name}</span>
                  <span className="text-xs text-ink-muted">{timeAgo(o.createdAt)}</span>
                  <StatusBadge status={o.status} />
                  <span className="hidden sm:inline-flex">
                    <PaymentBadge status={o.payment.status} />
                  </span>
                  <span className="tabular w-24 text-right text-sm font-semibold text-ink">{formatBRL(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

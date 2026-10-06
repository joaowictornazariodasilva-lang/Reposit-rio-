import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { AnimatePresence, m } from 'motion/react';
import { ArrowRight, Bike, MapPin, MessageSquareText, Phone, Printer, Store, XCircle } from 'lucide-react';
import { canTransition, nextStatus, ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, statusFlow, type Order, type OrderStatus } from '@nazario/shared';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Choice';
import { Dialog, DialogClose } from '@/components/ui/Dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatBRL, formatCep, formatPhone, formatTime, timeAgo } from '@/lib/format';
import { toast } from '@/stores/ui';
import { DEMO } from '@/lib/env';
import { useCatalog } from '@/stores/catalog';
import { adminApi } from './session';
import { useOrdersFeed } from './useOrdersFeed';
import { nextActionLabel, PageHeader, PaymentBadge, StatusBadge } from './ui';

const ACTIVE: OrderStatus[] = ['new', 'confirmed', 'preparing', 'ready', 'out_for_delivery'];
type View = 'active' | 'completed' | 'cancelled';

function useOrderAction() {
  const upsert = useOrdersFeed((s) => s.upsert);
  const [busy, setBusy] = useState<string>();
  async function run(order: Order, status: OrderStatus) {
    setBusy(order.id + status);
    try {
      const updated = await adminApi.setStatus(order.id, status);
      upsert(updated);
      toast({ tone: 'success', title: `#${order.number} → ${ORDER_STATUS_LABEL[status]}` });
      return updated;
    } catch (e) {
      toast({ tone: 'error', title: 'Não foi possível atualizar', description: e instanceof ApiError ? e.message : undefined });
    } finally {
      setBusy(undefined);
    }
  }
  return { run, busy };
}

function OrderCard({ order, onAdvance, busy }: { order: Order; onAdvance: () => void; busy: boolean }) {
  const next = nextStatus(order);
  const items = order.items.reduce((n, l) => n + l.quantity, 0);
  return (
    <m.article
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn('rounded-[var(--radius-md)] bg-paper p-4 shadow-soft', order.status === 'new' && 'ring-2 ring-tomato/70')}
    >
      <Link to={`/admin/pedidos/${order.id}`} className="block">
        <div className="flex items-center justify-between gap-2">
          <span className="tabular text-lg font-semibold text-ink">#{order.number}</span>
          <span className="text-xs text-ink-muted" title={formatTime(order.createdAt)}>
            {timeAgo(order.createdAt)}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-medium text-ink">{order.customer.name}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
          {order.fulfillment.type === 'delivery' ? <Bike className="size-3.5" aria-hidden /> : <Store className="size-3.5" aria-hidden />}
          {order.fulfillment.type === 'delivery' ? order.fulfillment.address.neighborhood : 'Retirada'} · {items} {items === 1 ? 'item' : 'itens'}
        </p>
        <ul className="mt-3 space-y-0.5 text-[0.8125rem] text-ink-soft">
          {order.items.slice(0, 3).map((l, i) => (
            <li key={i} className="truncate">
              {l.quantity}× {l.productName}
              {l.variantLabel !== 'Unidade' && <span className="text-ink-muted"> · {l.variantLabel}</span>}
            </li>
          ))}
          {order.items.length > 3 && <li className="text-ink-muted">+ {order.items.length - 3} itens</li>}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
          <PaymentBadge status={order.payment.status} />
          <span className="tabular ml-auto text-sm font-semibold text-ink">{formatBRL(order.total)}</span>
        </div>
      </Link>
      {next && (
        <Button size="sm" variant={order.status === 'new' ? 'primary' : 'secondary'} className="mt-3 w-full" loading={busy} onClick={onAdvance}>
          {nextActionLabel(order)} <ArrowRight className="size-4" aria-hidden />
        </Button>
      )}
    </m.article>
  );
}

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const { run, busy } = useOrderAction();
  const upsert = useOrdersFeed((s) => s.upsert);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = nextStatus(order);
  const flow = statusFlow(order.fulfillment.type);
  const address = order.fulfillment.type === 'delivery' ? order.fulfillment.address : undefined;

  const markPaid = async () => {
    try {
      upsert(await adminApi.setPayment(order.id, 'paid'));
      toast({ tone: 'success', title: `Pagamento do #${order.number} confirmado` });
    } catch (e) {
      toast({ tone: 'error', title: e instanceof ApiError ? e.message : 'Erro ao atualizar pagamento' });
    }
  };

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="tabular font-display text-3xl leading-none text-ink">Pedido #{order.number}</p>
          <p className="mt-2 text-xs text-ink-muted">
            {formatTime(order.createdAt)} · {timeAgo(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!DEMO && <button type="button" onClick={() => window.print()} className="grid size-11 place-items-center rounded-full text-ink-soft hover:bg-ink/[0.06]" aria-label="Imprimir comanda">
            <Printer className="size-5" aria-hidden />
          </button>}
          <DialogClose onClose={onClose} tone="default" />
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.payment.status} />
        </div>

        {order.status !== 'cancelled' && (
          <ol className="flex gap-1" aria-label="Etapas">
            {flow.map((s) => {
              const reached = flow.indexOf(order.status) >= flow.indexOf(s);
              return (
                <li key={s} className="flex-1">
                  <span className={cn('block h-1.5 rounded-full transition-colors duration-500', reached ? 'bg-basil' : 'bg-flour-deep')} />
                  <span className={cn('mt-1.5 block text-[0.625rem] leading-tight', reached ? 'font-semibold text-ink' : 'text-ink-muted')}>
                    {ORDER_STATUS_LABEL[s]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <section>
          <h3 className="eyebrow text-ink-muted">Cliente</h3>
          <p className="mt-2 font-semibold text-ink">{order.customer.name}</p>
          <a href={`tel:+55${order.customer.phone}`} className="mt-1 flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
            <Phone className="size-4" aria-hidden /> {formatPhone(order.customer.phone)}
          </a>
          <a
            href={`https://wa.me/55${order.customer.phone}?text=${encodeURIComponent(`Olá, ${order.customer.name.split(' ')[0]}! Aqui é da Nazário Massas, sobre o pedido #${order.number}.`)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-sm font-semibold text-basil hover:underline"
          >
            Chamar no WhatsApp
          </a>
        </section>

        <section>
          <h3 className="eyebrow text-ink-muted">{address ? 'Entrega' : 'Retirada no balcão'}</h3>
          {address ? (
            <p className="mt-2 flex gap-2 text-sm text-ink">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden />
              <span>
                {address.street}, {address.number}
                {address.complement && ` — ${address.complement}`}
                <br />
                {address.neighborhood} · {address.city} · CEP {formatCep(address.cep)}
                {address.reference && (
                  <>
                    <br />
                    <span className="text-ink-muted">Referência: {address.reference}</span>
                  </>
                )}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">O cliente vem buscar.</p>
          )}
        </section>

        <section>
          <h3 className="eyebrow text-ink-muted">Itens</h3>
          <ul className="mt-2 divide-y divide-line rounded-[var(--radius-md)] border border-line">
            {order.items.map((l, i) => (
              <li key={i} className="p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold text-ink">
                    {l.quantity}× {l.productName}
                    {l.variantLabel !== 'Unidade' && <span className="font-normal text-ink-soft"> · {l.variantLabel}</span>}
                  </p>
                  <p className="tabular shrink-0 text-ink">{formatBRL(l.lineTotal)}</p>
                </div>
                {l.addons.length > 0 && (
                  <ul className="mt-1 text-ink-soft">
                    {l.addons.map((a) => (
                      <li key={a.optionId}>
                        + {a.name} <span className="tabular text-ink-muted">({formatBRL(a.price)})</span>
                      </li>
                    ))}
                  </ul>
                )}
                {l.notes && (
                  <p className="mt-1.5 flex items-start gap-1.5 rounded-[var(--radius-xs)] bg-[#f3ead3] px-2 py-1 font-medium text-olive-ink">
                    <MessageSquareText className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {l.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-ink-soft">
              <dt>Subtotal</dt>
              <dd className="tabular">{formatBRL(order.subtotal)}</dd>
            </div>
            {order.fulfillment.type === 'delivery' && (
              <div className="flex justify-between text-ink-soft">
                <dt>Entrega</dt>
                <dd className="tabular">{formatBRL(order.deliveryFee)}</dd>
              </div>
            )}
            <div className="flex justify-between text-ink-soft">
              <dt>Desconto{order.couponCode && ` (${order.couponCode})`}</dt>
              <dd className="tabular">− {formatBRL(order.discount)}</dd>
            </div>
            <div className="flex justify-between pt-1 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd className="tabular">{formatBRL(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section>
          <h3 className="eyebrow text-ink-muted">Pagamento</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ink">{PAYMENT_METHOD_LABEL[order.payment.method]}</span>
            <PaymentBadge status={order.payment.status} />
            {order.payment.changeFor && <span className="text-ink-soft">· troco para {formatBRL(order.payment.changeFor)}</span>}
          </div>
          {order.payment.status !== 'paid' && order.status !== 'cancelled' && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={markPaid}>
              Marcar como pago
            </Button>
          )}
        </section>
      </div>

      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <div className="space-y-2 border-t border-line px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {next && (
            <Button size="lg" className="w-full" loading={busy === order.id + next} onClick={() => run(order, next)}>
              {nextActionLabel(order)} <ArrowRight className="size-5" aria-hidden />
            </Button>
          )}
          <details className="group">
            <summary className="flex h-10 cursor-pointer list-none items-center px-1 text-sm font-semibold text-ink-soft hover:text-ink">
              Mais ações
              <span className="ml-1.5 transition-transform group-open:rotate-180" aria-hidden>▾</span>
            </summary>
            <div className="flex flex-wrap gap-1 pb-1">
              {flow
                .filter((s) => s !== next && canTransition(order, s))
                .map((s) => (
                  <Button key={s} size="sm" variant="ghost" onClick={() => run(order, s)}>
                    Pular para “{ORDER_STATUS_LABEL[s]}”
                  </Button>
                ))}
            </div>
          </details>
          {confirmCancel ? (
            <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-tomato-tint p-3" role="alertdialog" aria-label="Confirmar cancelamento">
              <p className="text-sm font-semibold text-tomato-deep">Cancelar o pedido #{order.number}?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setConfirmCancel(false)}>
                  Voltar
                </Button>
                <Button size="sm" variant="danger" loading={busy === order.id + 'cancelled'} onClick={() => run(order, 'cancelled').then(() => setConfirmCancel(false))}>
                  Cancelar pedido
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="text-tomato" icon={<XCircle className="size-4" aria-hidden />} onClick={() => setConfirmCancel(true)}>
              Cancelar pedido
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export default function OrdersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { orders, loaded, error, refresh } = useOrdersFeed();
  const { run, busy } = useOrderAction();
  const [view, setView] = useState<View>('active');
  const filterStatus = params.get('status') as OrderStatus | null;
  const [detail, setDetail] = useState<Order>();

  // Detail may not be in the feed yet (deep link) — fetch it.
  useEffect(() => {
    if (!id) return setDetail(undefined);
    const inFeed = orders.find((o) => o.id === id);
    if (inFeed) return setDetail(inFeed);
    adminApi.order(id).then(setDetail).catch(() => navigate('/admin/pedidos', { replace: true }));
  }, [id, orders, navigate]);

  const visible = useMemo(() => {
    if (view === 'completed') return orders.filter((o) => o.status === 'completed');
    if (view === 'cancelled') return orders.filter((o) => o.status === 'cancelled');
    return orders.filter((o) => ACTIVE.includes(o.status));
  }, [orders, view]);

  const deliveryEnabled = useCatalog((s) => s.data?.settings.deliveryEnabled ?? false);
  // Pickup-only: no "out for delivery" column unless an older delivery order still sits there.
  const statuses = ACTIVE.filter((s) => s !== 'out_for_delivery' || deliveryEnabled || visible.some((o) => o.status === s));
  const columns = statuses.map((status) => ({ status, orders: visible.filter((o) => o.status === status).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }));
  const mobileList = filterStatus ? visible.filter((o) => o.status === filterStatus) : visible;

  return (
    <div className="mx-auto max-w-[96rem]">
      <PageHeader
        title="Pedidos"
        description="Novos pedidos chegam sozinhos, com aviso sonoro."
        actions={
          <Segmented<View>
            label="Visualização"
            value={view}
            onChange={setView}
            options={[
              { value: 'active', label: 'Em andamento' },
              { value: 'completed', label: 'Concluídos' },
              { value: 'cancelled', label: 'Cancelados' },
            ]}
          />
        }
      />

      {error && !loaded && <ErrorState message={error} onRetry={() => void refresh()} />}
      {!loaded && !error && (
        <div className="grid gap-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-[var(--radius-md)]" />
          ))}
        </div>
      )}

      {loaded && view === 'active' && (
        <>
          {/* Desktop board */}
          <div className={cn('hidden gap-3 lg:grid', columns.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
            {columns.map((col) => (
              <section key={col.status} aria-labelledby={`col-${col.status}`} className="flex min-h-[60vh] flex-col rounded-[var(--radius-lg)] bg-flour-deep/60 p-2.5">
                <h2 id={`col-${col.status}`} className="flex items-center justify-between px-1.5 pt-1 pb-3 text-sm font-semibold text-ink">
                  {ORDER_STATUS_LABEL[col.status]}
                  <span className="tabular grid h-6 min-w-6 place-items-center rounded-full bg-paper px-2 text-xs">{col.orders.length}</span>
                </h2>
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence initial={false}>
                    {col.orders.map((o) => {
                      const next = nextStatus(o);
                      return <OrderCard key={o.id} order={o} busy={busy === o.id + next} onAdvance={() => next && run(o, next)} />;
                    })}
                  </AnimatePresence>
                  {col.orders.length === 0 && <p className="px-2 py-6 text-center text-xs text-ink-muted">Nenhum pedido</p>}
                </div>
              </section>
            ))}
          </div>

          {/* Mobile list with status filter */}
          <div className="lg:hidden">
            <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 scrollbar-none">
              {[null, ...statuses].map((s) => {
                const count = s ? visible.filter((o) => o.status === s).length : visible.length;
                const active = filterStatus === s;
                return (
                  <button
                    key={s ?? 'all'}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setParams(s ? { status: s } : {}, { replace: true })}
                    className={cn(
                      'h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium',
                      active ? 'border-ink bg-ink text-flour' : 'border-line bg-paper text-ink-soft',
                    )}
                  >
                    {s ? ORDER_STATUS_LABEL[s] : 'Todos'} <span className="tabular opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AnimatePresence initial={false}>
                {mobileList.map((o) => {
                  const next = nextStatus(o);
                  return <OrderCard key={o.id} order={o} busy={busy === o.id + next} onAdvance={() => next && run(o, next)} />;
                })}
              </AnimatePresence>
            </div>
            {mobileList.length === 0 && <EmptyState title="Nenhum pedido aqui" description="Novos pedidos aparecem automaticamente." />}
          </div>
        </>
      )}

      {loaded && view !== 'active' && (
        visible.length === 0 ? (
          <EmptyState title={view === 'completed' ? 'Nenhum pedido concluído' : 'Nenhum pedido cancelado'} />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-lg)] bg-paper shadow-soft">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pedido</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="hidden px-4 py-3 font-semibold sm:table-cell">Horário</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Pagamento</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((o) => (
                  <tr key={o.id} className="hover:bg-flour/60">
                    <td className="px-4 py-3">
                      <Link to={`/admin/pedidos/${o.id}`} className="tabular font-semibold text-ink hover:underline">
                        #{o.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink">{o.customer.name}</td>
                    <td className="hidden px-4 py-3 text-ink-soft sm:table-cell">{formatTime(o.createdAt)}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <PaymentBadge status={o.payment.status} />
                    </td>
                    <td className="tabular px-4 py-3 text-right font-semibold text-ink">{formatBRL(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Dialog open={Boolean(id && detail)} onClose={() => navigate('/admin/pedidos')} title={detail ? `Pedido #${detail.number}` : 'Pedido'} hideTitle placement="right" className="max-w-[32rem]">
        {detail && <OrderDetail order={detail} onClose={() => navigate('/admin/pedidos')} />}
      </Dialog>
    </div>
  );
}

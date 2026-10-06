import { useLocation, useParams } from 'react-router';
import { m } from 'motion/react';
import { MapPin, MessageCircle, Receipt, Store, XCircle } from 'lucide-react';
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL, trackingSteps } from '@nazario/shared';
import { Badge } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { OrderTimeline } from '@/features/order/OrderTimeline';
import { PixPanel } from '@/features/order/PixPanel';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { formatBRL, formatDateTime, formatPhone } from '@/lib/format';
import { useSeo } from '@/lib/seo';
import { useCatalog } from '@/stores/catalog';

const EASE = [0.22, 1, 0.36, 1] as const;

export default function OrderPage() {
  const { token } = useParams();
  const location = useLocation();
  const justPlaced = Boolean((location.state as { justPlaced?: boolean } | null)?.justPlaced);
  const { order, setOrder, error, refresh } = useOrderTracking(token);
  const settings = useCatalog((s) => s.data?.settings);
  useSeo({ title: order ? `Pedido #${order.number}` : 'Seu pedido', noindex: true });

  if (error && !order) {
    return (
      <div className="container-page pt-32 pb-24">
        {error.status === 404 ? (
          <EmptyState title="Pedido não encontrado" description="Confira o link recebido ou fale com a loja." action={<ButtonLink to="/">Voltar ao início</ButtonLink>} />
        ) : (
          <ErrorState message={error.message} onRetry={() => void refresh()} />
        )}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-page max-w-3xl space-y-4 pt-32 pb-24" aria-busy="true">
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="mt-8 h-64 w-full rounded-[var(--radius-xl)]" />
      </div>
    );
  }

  const cancelled = order.status === 'cancelled';
  const awaitingPix = order.payment.method === 'pix' && order.payment.status === 'awaiting_payment' && !cancelled;
  const steps = trackingSteps(order);
  const address = order.fulfillment.type === 'delivery' ? order.fulfillment.address : undefined;

  return (
    <div className="container-page max-w-5xl pt-28 pb-24 sm:pt-32">
      <m.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>
        <p className="eyebrow text-tomato">Pedido #{order.number}</p>
        <h1 className="mt-3 font-display text-5xl leading-[0.98] tracking-[-0.035em] text-ink sm:text-6xl">
          {cancelled ? 'Pedido cancelado' : justPlaced ? 'Pedido recebido! 🍕' : 'Acompanhe seu pedido'}
        </h1>
        <p className="mt-4 text-ink-soft">
          {cancelled
            ? 'Este pedido foi cancelado. Se tiver dúvidas, fale com a gente.'
            : awaitingPix
              ? 'Falta só o pagamento. Assim que o Pix for confirmado, sua massa vai para o forno.'
              : `Feito em ${formatDateTime(order.createdAt)}. Esta página se atualiza sozinha.`}
        </p>
      </m.header>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          {awaitingPix && <PixPanel order={order} onPaid={setOrder} />}

          <section className="rounded-[var(--radius-xl)] bg-paper p-6 shadow-soft sm:p-8" aria-labelledby="status-title">
            <div className="mb-6 flex items-center justify-between">
              <h2 id="status-title" className="font-display text-2xl text-ink">
                Status do pedido
              </h2>
              <span className="text-sm text-ink-muted">
                {order.fulfillment.type === 'delivery' ? settings?.deliveryEstimate : settings?.pickupEstimate}
              </span>
            </div>
            {cancelled ? (
              <p className="flex items-center gap-2 font-semibold text-tomato">
                <XCircle className="size-5" aria-hidden /> Pedido cancelado
              </p>
            ) : (
              <div aria-live="polite">
                <OrderTimeline steps={steps} />
              </div>
            )}
          </section>

          {settings?.whatsapp && (
            <a
              href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Olá! Sobre o pedido #${order.number}`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-paper px-5 py-4 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
            >
              <MessageCircle className="size-5 text-basil" aria-hidden />
              Precisa de ajuda? Fale com a loja pelo WhatsApp
            </a>
          )}
        </div>

        <aside className="space-y-6" aria-label="Resumo do pedido">
          <section className="rounded-[var(--radius-xl)] bg-paper p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
              <Receipt className="size-5 text-ink-muted" aria-hidden /> Resumo
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((line, i) => (
                <li key={i} className="flex justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink">
                      {line.quantity}× {line.productName}
                    </p>
                    <p className="text-ink-muted">{[line.variantLabel !== 'Unidade' ? line.variantLabel : null, ...line.addons.map((a) => a.name)].filter(Boolean).join(' · ')}</p>
                    {line.notes && <p className="italic text-ink-muted">“{line.notes}”</p>}
                  </div>
                  <p className="tabular shrink-0 font-semibold text-ink">{formatBRL(line.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <dt>Subtotal</dt>
                <dd className="tabular">{formatBRL(order.subtotal)}</dd>
              </div>
              {order.fulfillment.type === 'delivery' && (
                <div className="flex justify-between text-ink-soft">
                  <dt>Entrega</dt>
                  <dd className="tabular">{order.deliveryFee ? formatBRL(order.deliveryFee) : 'Grátis'}</dd>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-basil">
                  <dt>Desconto {order.couponCode && `(${order.couponCode})`}</dt>
                  <dd className="tabular">− {formatBRL(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 text-lg font-semibold text-ink">
                <dt>Total</dt>
                <dd className="tabular">{formatBRL(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="space-y-4 rounded-[var(--radius-xl)] bg-paper p-6 text-sm shadow-soft">
            <div>
              <h3 className="eyebrow text-ink-muted">Pagamento</h3>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 font-semibold text-ink">
                {PAYMENT_METHOD_LABEL[order.payment.method]}
                <Badge tone={order.payment.status === 'paid' ? 'basil' : order.payment.status === 'awaiting_payment' ? 'olive' : 'neutral'}>
                  {PAYMENT_STATUS_LABEL[order.payment.status]}
                </Badge>
              </p>
              {order.payment.changeFor && <p className="mt-1 text-ink-muted">Troco para {formatBRL(order.payment.changeFor)}</p>}
            </div>
            <div>
              <h3 className="eyebrow text-ink-muted">{address ? 'Entrega' : 'Retirada'}</h3>
              {address ? (
                <p className="mt-1.5 flex gap-2 text-ink">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden />
                  <span>
                    {address.street}, {address.number}
                    {address.complement && ` — ${address.complement}`}
                    <br />
                    {address.neighborhood} · {address.city}
                    {address.reference && (
                      <>
                        <br />
                        <span className="text-ink-muted">Ref.: {address.reference}</span>
                      </>
                    )}
                  </span>
                </p>
              ) : (
                <p className="mt-1.5 flex gap-2 text-ink">
                  <Store className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden />
                  {settings?.address}
                </p>
              )}
            </div>
            <div>
              <h3 className="eyebrow text-ink-muted">Cliente</h3>
              <p className="mt-1.5 text-ink">
                {order.customer.name} · {formatPhone(order.customer.phone)}
              </p>
            </div>
          </section>

          <ButtonLink to="/cardapio" variant="secondary" className="w-full">
            Voltar ao cardápio
          </ButtonLink>
        </aside>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { CheckCircle2, Clock, CircleDollarSign, XCircle, Bike, ChefHat, PackageCheck, Inbox, BadgeCheck } from 'lucide-react';
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, type OrderStatus, type PaymentStatus } from '@nazario/shared';
import { cn } from '@/lib/cn';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl tracking-[-0.03em] text-ink sm:text-5xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-[var(--radius-lg)] bg-paper p-5 shadow-soft sm:p-6', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLE: Record<OrderStatus, { className: string; icon: ReactNode }> = {
  new: { className: 'bg-tomato text-white', icon: <Inbox className="size-3.5" aria-hidden /> },
  confirmed: { className: 'bg-[#f3ead3] text-olive-ink', icon: <BadgeCheck className="size-3.5" aria-hidden /> },
  preparing: { className: 'bg-tomato-tint text-tomato-deep', icon: <ChefHat className="size-3.5" aria-hidden /> },
  ready: { className: 'bg-basil-tint text-basil', icon: <PackageCheck className="size-3.5" aria-hidden /> },
  out_for_delivery: { className: 'bg-[#dfe6ea] text-[#2c4250]', icon: <Bike className="size-3.5" aria-hidden /> },
  completed: { className: 'bg-flour-deep text-ink-soft', icon: <CheckCircle2 className="size-3.5" aria-hidden /> },
  cancelled: { className: 'border border-line-strong text-ink-muted', icon: <XCircle className="size-3.5" aria-hidden /> },
};

/** Status always shows icon + label — never colour alone. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold', s.className)}>
      {s.icon}
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const paid = status === 'paid';
  const waiting = status === 'awaiting_payment';
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold',
        paid ? 'bg-basil-tint text-basil' : waiting ? 'bg-[#f3ead3] text-olive-ink' : status === 'pay_on_delivery' ? 'bg-flour-deep text-ink-soft' : 'bg-tomato-tint text-tomato-deep',
      )}
    >
      {paid ? <CircleDollarSign className="size-3.5" aria-hidden /> : <Clock className="size-3.5" aria-hidden />}
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}

/** Primary action label for moving an order one step forward. */
export const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  new: 'Confirmar',
  confirmed: 'Iniciar preparo',
  preparing: 'Marcar como pronto',
  ready: 'Despachar',
  out_for_delivery: 'Concluir',
};

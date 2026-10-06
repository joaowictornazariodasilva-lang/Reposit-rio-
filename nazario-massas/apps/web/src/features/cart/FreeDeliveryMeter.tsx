import { m } from 'motion/react';
import { Bike } from 'lucide-react';
import { formatBRL } from '@/lib/format';

export function FreeDeliveryMeter({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  if (threshold <= 0) return null;
  const progress = Math.min(1, subtotal / threshold);
  const remaining = Math.max(0, threshold - subtotal);
  return (
    <div className="rounded-[var(--radius-md)] bg-flour px-4 py-3">
      <p className="flex items-center gap-2 text-[0.8125rem] text-ink-soft">
        <Bike className="size-4 shrink-0 text-basil" aria-hidden />
        {remaining > 0 ? (
          <span>
            Faltam <strong className="tabular text-ink">{formatBRL(remaining)}</strong> para a <strong className="text-ink">entrega grátis</strong>
          </span>
        ) : (
          <strong className="text-basil">Você ganhou entrega grátis!</strong>
        )}
      </p>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-flour-deep"
        role="progressbar"
        aria-label="Progresso para entrega grátis"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <m.div
          className="h-full origin-left rounded-full bg-basil"
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

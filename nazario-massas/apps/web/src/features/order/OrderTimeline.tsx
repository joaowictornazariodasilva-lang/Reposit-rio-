import { m } from 'motion/react';
import { Check } from 'lucide-react';
import type { TrackingStep } from '@nazario/shared';
import { cn } from '@/lib/cn';

export function OrderTimeline({ steps }: { steps: TrackingStep[] }) {
  return (
    <ol className="relative" aria-label="Status do pedido">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0" aria-current={step.state === 'current' ? 'step' : undefined}>
            {!last && (
              <span aria-hidden className="absolute top-8 bottom-0 left-[0.9375rem] w-0.5 overflow-hidden rounded-full bg-line">
                <m.span
                  className="block h-full w-full origin-top bg-basil"
                  initial={false}
                  animate={{ scaleY: step.state === 'done' ? 1 : 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            )}
            <span
              className={cn(
                'relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors duration-500',
                step.state === 'done' && 'border-basil bg-basil text-white',
                step.state === 'current' && 'border-tomato bg-paper text-tomato',
                step.state === 'upcoming' && 'border-line bg-paper text-ink-muted',
              )}
            >
              {step.state === 'done' ? (
                <m.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                </m.span>
              ) : step.state === 'current' ? (
                <>
                  <span className="absolute inset-0 animate-ping rounded-full bg-tomato/20" aria-hidden />
                  <span className="size-2.5 rounded-full bg-tomato" aria-hidden />
                </>
              ) : (
                <span className="text-xs font-semibold">{i + 1}</span>
              )}
            </span>
            <div className="pt-1">
              <p className={cn('font-semibold', step.state === 'upcoming' ? 'text-ink-muted' : 'text-ink')}>
                {step.label}
                <span className="sr-only">
                  {step.state === 'done' ? ' — concluído' : step.state === 'current' ? ' — etapa atual' : ' — próxima etapa'}
                </span>
              </p>
              {step.state !== 'upcoming' && <p className="mt-0.5 text-sm text-ink-muted">{step.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

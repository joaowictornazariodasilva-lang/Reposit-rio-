import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AnimatedText } from './AnimatedNumber';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** When set, the minus button turns into a trash button at `min`. */
  onRemove?: () => void;
  size?: 'sm' | 'md';
  label: string;
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, max = 20, onRemove, size = 'md', label, className }: QuantityStepperProps) {
  const atMin = value <= min;
  const btn = cn(
    'grid place-items-center rounded-full text-ink transition-[background-color,transform] hover:bg-ink/[0.07] active:scale-90 disabled:opacity-30',
    size === 'md' ? 'size-11' : 'size-9',
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center rounded-full border border-line bg-paper', className)}
    >
      {atMin && onRemove ? (
        <button type="button" className={btn} onClick={onRemove} aria-label="Remover item">
          <Trash2 className="size-4" aria-hidden />
        </button>
      ) : (
        <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={atMin} aria-label="Diminuir quantidade">
          <Minus className="size-4" aria-hidden />
        </button>
      )}
      <span className={cn('tabular text-center font-semibold', size === 'md' ? 'w-8 text-base' : 'w-6 text-sm')} aria-live="polite">
        <AnimatedText value={String(value)} />
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Aumentar quantidade">
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

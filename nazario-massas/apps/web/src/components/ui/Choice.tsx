import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ChoiceOption<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

/** Native radio group styled as selectable cards (keyboard: arrows, as per platform). */
export function RadioCards<T extends string>({
  name,
  value,
  onChange,
  options,
  legend,
  hideLegend,
  columns = 1,
  className,
}: {
  name: string;
  value: T | undefined;
  onChange: (value: T) => void;
  options: ChoiceOption<T>[];
  legend: string;
  hideLegend?: boolean;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className={cn('mb-3 text-sm font-semibold text-ink', hideLegend && 'sr-only')}>{legend}</legend>
      <div className={cn('grid gap-2', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'grid-cols-3')}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                'group relative flex min-h-14 items-center gap-3 rounded-[var(--radius-md)] border bg-paper px-4 py-3 transition-[border-color,background-color,box-shadow] duration-200',
                checked ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line hover:border-line-strong',
                option.disabled && 'pointer-events-none opacity-50',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tomato',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors',
                  checked ? 'border-ink bg-ink' : 'border-line-strong',
                )}
              >
                <span className={cn('size-1.5 rounded-full bg-paper transition-transform', checked ? 'scale-100' : 'scale-0')} />
              </span>
              {option.icon && <span className="text-ink-soft">{option.icon}</span>}
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold text-ink">{option.label}</span>
                {option.description && <span className="mt-0.5 block text-[0.8125rem] text-ink-muted">{option.description}</span>}
              </span>
              {option.aside && <span className="tabular shrink-0 text-sm font-semibold text-ink">{option.aside}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CheckCard({
  checked,
  onChange,
  label,
  aside,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  aside?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        'flex min-h-13 items-center gap-3 rounded-[var(--radius-md)] border bg-paper px-4 py-3 transition-[border-color,box-shadow] duration-200',
        checked ? 'border-ink shadow-[0_0_0_1px_var(--color-ink)]' : 'border-line hover:border-line-strong',
        disabled && !checked && 'opacity-45',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tomato',
      )}
    >
      <input type="checkbox" className="sr-only" checked={checked} disabled={disabled && !checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-[6px] border-[1.5px] transition-colors',
          checked ? 'border-ink bg-ink text-paper' : 'border-line-strong',
        )}
      >
        <Check className={cn('size-3.5 transition-transform', checked ? 'scale-100' : 'scale-0')} strokeWidth={3} />
      </span>
      <span className="min-w-0 flex-1 text-[0.9375rem] font-medium text-ink">{label}</span>
      {aside && <span className="tabular shrink-0 text-sm text-ink-soft">{aside}</span>}
    </label>
  );
}

/** Pill toggle used for filters and compact single choice. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  tone = 'light',
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-full p-1', tone === 'light' ? 'bg-flour-deep' : 'bg-oven-raised', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-9 flex-1 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200',
              active
                ? tone === 'light'
                  ? 'bg-paper text-ink shadow-soft'
                  : 'bg-flour text-ink'
                : tone === 'light'
                  ? 'text-ink-soft hover:text-ink'
                  : 'text-ash hover:text-flour',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label, hideLabel }: { checked: boolean; onChange: (v: boolean) => void; label: string; hideLabel?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-sm font-medium text-ink"
    >
      <span className={cn('relative h-6 w-10 rounded-full transition-colors duration-200', checked ? 'bg-basil' : 'bg-line-strong')}>
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-out-soft)]',
            checked && 'translate-x-4',
          )}
        />
      </span>
      {!hideLabel && label}
    </button>
  );
}

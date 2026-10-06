import { cn } from '@/lib/cn';

/** Brand mark: the arched mouth of a wood-fired oven framing an "N". */
export function LogoMark({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <svg viewBox="0 0 40 40" className={cn('size-9', className)} aria-hidden>
      <path d="M6 35V19a14 14 0 0 1 28 0v16" fill="none" stroke="var(--color-ember)" strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M14 35V23l12 12V23"
        fill="none"
        stroke={tone === 'dark' ? 'var(--color-ink)' : 'var(--color-flour)'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ tone = 'dark', className }: { tone?: 'dark' | 'light'; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark tone={tone} className="size-8 sm:size-9" />
      <span className="flex flex-col leading-none">
        <span
          className={cn('font-display text-[1.375rem] italic font-[560] tracking-[-0.02em]', tone === 'dark' ? 'text-ink' : 'text-flour')}
          style={{ fontVariationSettings: "'SOFT' 100" }}
        >
          Nazário
        </span>{' '}
        <span className={cn('mt-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.42em]', tone === 'dark' ? 'text-ink-muted' : 'text-ash')}>
          Massas
        </span>
      </span>
    </span>
  );
}

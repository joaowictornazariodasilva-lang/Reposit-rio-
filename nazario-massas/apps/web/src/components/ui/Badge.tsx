import type { ReactNode } from 'react';
import { Flame, Leaf, Sparkles, Star, Droplet } from 'lucide-react';
import type { ProductBadge as Kind } from '@nazario/shared';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'tomato' | 'basil' | 'olive' | 'dark' | 'outline';

const tones: Record<Tone, string> = {
  neutral: 'bg-flour-deep text-ink-soft',
  tomato: 'bg-tomato-tint text-tomato-deep',
  basil: 'bg-basil-tint text-basil',
  olive: 'bg-[#f3ead3] text-olive-ink',
  dark: 'bg-oven text-flour',
  outline: 'border border-line-strong text-ink-soft',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const PRODUCT_BADGES: Record<Kind, { label: string; tone: Tone; icon: ReactNode }> = {
  vegetariano: { label: 'Vegetariano', tone: 'basil', icon: <Leaf className="size-3" aria-hidden /> },
  picante: { label: 'Picante', tone: 'tomato', icon: <Flame className="size-3" aria-hidden /> },
  novidade: { label: 'Novidade', tone: 'olive', icon: <Sparkles className="size-3" aria-hidden /> },
  assinatura: { label: 'Assinatura', tone: 'dark', icon: <Star className="size-3" aria-hidden /> },
  zero: { label: 'Zero açúcar', tone: 'outline', icon: <Droplet className="size-3" aria-hidden /> },
};

export function ProductBadge({ kind, className }: { kind: Kind; className?: string }) {
  const b = PRODUCT_BADGES[kind];
  return (
    <Badge tone={b.tone} className={className}>
      {b.icon}
      {b.label}
    </Badge>
  );
}

export const productBadgeLabel = (kind: Kind) => PRODUCT_BADGES[kind].label;

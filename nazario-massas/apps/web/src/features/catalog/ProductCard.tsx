import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { AnimatePresence, m, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { Check, Plus } from 'lucide-react';
import { startingPrice, type Product } from '@nazario/shared';
import { ProductBadge } from '@/components/ui/Badge';
import { Picture } from '@/components/ui/Picture';
import { AnimatedText } from '@/components/ui/AnimatedNumber';
import { cn } from '@/lib/cn';
import { formatBRL } from '@/lib/format';
import { addToCart } from '@/features/cart/addToCart';

export function defaultVariantId(product: Product): string {
  const variants = product.variants;
  return (variants[Math.floor((variants.length - 1) / 2)] ?? variants[0])!.id;
}

/** Product link that opens as a sheet over the current page (URL stays shareable). */
export function useProductHref(product: Product) {
  const location = useLocation();
  return { to: `/produto/${product.slug}`, state: { backgroundLocation: location } };
}

function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setFine(mq.matches);
    const on = () => setFine(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return fine;
}

/** Image gently follows the cursor (transform-only, desktop pointers only). */
function TiltImage({ product, sizes, priority }: { product: Product; sizes: string; priority?: boolean }) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const hover = useMotionValue(0);
  const spring = { stiffness: 180, damping: 22, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [0, 1], [-5, 5]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [4, -4]), spring);
  const scale = useSpring(useTransform(hover, [0, 1], [1, 1.045]), spring);
  const interactive = fine && !reduce;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  return (
    <div
      className="relative [perspective:900px]"
      onPointerMove={interactive ? onMove : undefined}
      onPointerEnter={interactive ? () => hover.set(1) : undefined}
      onPointerLeave={
        interactive
          ? () => {
              hover.set(0);
              px.set(0.5);
              py.set(0.5);
            }
          : undefined
      }
    >
      <m.div style={interactive ? { rotateX, rotateY, scale } : undefined} className="will-change-transform">
        <Picture
          src={product.image}
          alt={product.imageAlt ?? product.name}
          sizes={sizes}
          priority={priority}
          className="aspect-square rounded-[var(--radius-lg)]"
        />
      </m.div>
    </div>
  );
}

function AddButton({ onAdd, label, compact }: { onAdd: () => void; label: string; compact?: boolean }) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <m.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAdd();
        setAdded(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setAdded(false), 1400);
      }}
      aria-label={label}
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full text-white shadow-[0_8px_18px_-8px_rgb(180_50_31/0.8)] transition-colors duration-300',
        compact ? 'size-10' : 'size-12',
        added ? 'bg-basil' : 'bg-tomato hover:bg-tomato-deep',
      )}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          key={added ? 'ok' : 'add'}
          initial={{ scale: 0.4, opacity: 0, rotate: -90 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.4, opacity: 0, rotate: 90 }}
          transition={{ type: 'spring', stiffness: 500, damping: 26 }}
        >
          {added ? <Check className="size-5" strokeWidth={2.5} aria-hidden /> : <Plus className="size-5" strokeWidth={2.5} aria-hidden />}
        </m.span>
      </AnimatePresence>
    </m.button>
  );
}

/** Full editorial card: image, story, size picker, price and add — used in grids and the featured rail. */
export function ProductCard({ product, index, priority }: { product: Product; index?: number; priority?: boolean }) {
  const href = useProductHref(product);
  const [variantId, setVariantId] = useState(() => defaultVariantId(product));
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0]!;
  const hasSizes = product.variants.length > 1;

  return (
    <article className="group relative flex h-full flex-col">
      <Link {...href} className="block rounded-[var(--radius-lg)]" aria-label={`${product.name} — ver detalhes`}>
        <TiltImage product={product} priority={priority} sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 85vw" />
      </Link>
      {product.badges.length > 0 && (
        <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.badges.slice(0, 2).map((b) => (
            <ProductBadge key={b} kind={b} className="shadow-soft" />
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col pt-5">
        {index !== undefined && <p className="eyebrow text-ink-muted">Nº {String(index + 1).padStart(2, '0')}</p>}
        <h3 className="mt-1.5 font-display text-[1.625rem] leading-[1.05] tracking-[-0.02em] text-ink">
          <Link {...href} className="link-underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-ink-soft">{product.shortDescription}</p>
        {product.ingredients.length > 0 && (
          <p className="mt-2 line-clamp-1 text-xs tracking-wide text-ink-muted">{product.ingredients.join(' · ')}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="min-w-0">
            {hasSizes && (
              <div role="radiogroup" aria-label={`Tamanho de ${product.name}`} className="mb-2.5 flex gap-1">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={v.id === variantId}
                    aria-label={`${v.label}${v.detail ? `, ${v.detail}` : ''}`}
                    title={v.detail}
                    onClick={() => setVariantId(v.id)}
                    className={cn(
                      'h-8 min-w-8 rounded-full border px-2.5 text-xs font-semibold transition-[background-color,border-color,color] duration-200',
                      v.id === variantId ? 'border-ink bg-ink text-flour' : 'border-line text-ink-soft hover:border-ink/50',
                    )}
                  >
                    {v.label.length > 8 ? v.label : v.label.charAt(0)}
                  </button>
                ))}
              </div>
            )}
            <p className="tabular text-xl font-semibold tracking-[-0.01em] text-ink">
              <AnimatedText value={formatBRL(variant.price)} />
            </p>
            {hasSizes && <p className="text-xs text-ink-muted">{variant.label} · {variant.detail}</p>}
          </div>
          <AddButton
            label={`Adicionar ${product.name}${hasSizes ? ` ${variant.label.toLowerCase()}` : ''} ao carrinho`}
            onAdd={() => addToCart(product, { variantId, quantity: 1, addonOptionIds: [], notes: '' })}
          />
        </div>
      </div>
    </article>
  );
}

/** Compact row for phones and the drinks list — tapping opens the configurator. */
export function ProductRow({ product }: { product: Product }) {
  const href = useProductHref(product);
  const hasOptions = product.variants.length > 1 || product.addonGroupIds.length > 0;

  return (
    <article className="relative flex gap-4 py-5">
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-[1.3125rem] leading-tight text-ink">
          <Link {...href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">{product.shortDescription}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="tabular text-[0.9375rem] font-semibold text-ink">
            {product.variants.length > 1 && <span className="text-xs font-normal text-ink-muted">a partir de </span>}
            {formatBRL(startingPrice(product))}
          </p>
          {product.badges.slice(0, 1).map((b) => (
            <ProductBadge key={b} kind={b} />
          ))}
        </div>
      </div>
      <div className="relative shrink-0">
        <Picture src={product.image} alt={product.imageAlt ?? product.name} sizes="120px" className="size-28 rounded-[var(--radius-md)] sm:size-32" />
        <div className="absolute -right-1.5 -bottom-1.5 z-10">
          {hasOptions ? (
            <Link
              {...href}
              aria-label={`Escolher opções de ${product.name}`}
              className="grid size-10 place-items-center rounded-full bg-tomato text-white shadow-[0_8px_18px_-8px_rgb(180_50_31/0.8)] transition-transform active:scale-90"
            >
              <Plus className="size-5" strokeWidth={2.5} aria-hidden />
            </Link>
          ) : (
            <AddButton compact label={`Adicionar ${product.name} ao carrinho`} onAdd={() => addToCart(product, { variantId: product.variants[0]!.id, quantity: 1, addonOptionIds: [], notes: '' })} />
          )}
        </div>
      </div>
    </article>
  );
}

const DRINK_TINTS: Record<string, string> = {
  coca: 'bg-[#7d1d16] text-[#f6e1d9]',
  guarana: 'bg-[#2f4a2b] text-[#e3eadb]',
  sprite: 'bg-[#2c5a4a] text-[#dcefe6]',
  agua: 'bg-[#dfe6ea] text-[#2c4250]',
  suco: 'bg-[#e9a23b] text-[#3a2508]',
  limonada: 'bg-[#e8e3a6] text-[#3c3a12]',
};

function drinkTint(slug: string) {
  const key = Object.keys(DRINK_TINTS).find((k) => slug.includes(k));
  return key ? DRINK_TINTS[key]! : 'bg-flour-deep text-ink-soft';
}

/** Drinks are impulse items: compact, scannable rows with one-tap add. */
export function DrinkRow({ product }: { product: Product }) {
  const variant = product.variants[0]!;
  return (
    <article className="flex items-center gap-4 py-3.5">
      {product.image ? (
        <Picture src={product.image} alt="" sizes="56px" className="size-14 shrink-0 rounded-[var(--radius-md)]" />
      ) : (
        <div className={cn('grid size-14 shrink-0 place-items-center rounded-[var(--radius-md)] font-display text-xl italic', drinkTint(product.slug))} aria-hidden>
          {product.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-tight text-ink">{product.name}</h3>
        <p className="mt-0.5 text-[0.8125rem] text-ink-muted">{product.shortDescription}</p>
      </div>
      <p className="tabular shrink-0 font-semibold text-ink">{formatBRL(variant.price)}</p>
      <AddButton compact label={`Adicionar ${product.name} ao carrinho`} onAdd={() => addToCart(product, { variantId: variant.id, quantity: 1, addonOptionIds: [], notes: '' })} />
    </article>
  );
}

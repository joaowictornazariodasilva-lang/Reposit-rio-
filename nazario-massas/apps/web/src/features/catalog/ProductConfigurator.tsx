import { useId, useMemo, useState } from 'react';
import { m } from 'motion/react';
import { priceLine, type AddonGroup, type Product } from '@nazario/shared';
import { Button } from '@/components/ui/Button';
import { CheckCard, RadioCards } from '@/components/ui/Choice';
import { ProductBadge } from '@/components/ui/Badge';
import { Picture } from '@/components/ui/Picture';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { AnimatedText } from '@/components/ui/AnimatedNumber';
import { cn } from '@/lib/cn';
import { formatBRL } from '@/lib/format';
import { useCatalog } from '@/stores/catalog';
import { addToCart } from '@/features/cart/addToCart';
import { defaultVariantId } from './ProductCard';

const QUICK_NOTES: Record<string, string[]> = {
  pizzas: ['Sem cebola', 'Pouco molho', 'Bem assada', 'Cortar em mais fatias'],
  massas: ['Sem queijo', 'Molho à parte', 'Bem quente'],
  bebidas: ['Bem gelada', 'Sem gelo'],
};

const NONE = '__none';

function GroupPicker({
  group,
  selected,
  onChange,
  headingLevel,
}: {
  group: AddonGroup;
  selected: string[];
  onChange: (ids: string[]) => void;
  /** h2 on the standalone page (under the h1), h3 inside the sheet (under the dialog's h2). */
  headingLevel: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  const atLimit = selected.length >= group.maxSelect;
  return (
    <section className="border-t border-line pt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <Heading className="text-base font-semibold text-ink">{group.name}</Heading>
        <span className="text-xs text-ink-muted">
          {group.minSelect > 0 ? 'Obrigatório · ' : ''}
          {group.maxSelect === 1 ? 'escolha 1' : `até ${group.maxSelect}`}
        </span>
      </div>
      {group.maxSelect === 1 ? (
        <RadioCards
          name={group.id}
          legend={group.name}
          hideLegend
          value={selected[0] ?? NONE}
          onChange={(v) => onChange(v === NONE ? [] : [v])}
          options={[
            ...(group.minSelect === 0 ? [{ value: NONE, label: 'Sem ' + group.name.toLowerCase().replace(/ recheada$/, ' recheada') }] : []),
            ...group.options.map((o) => ({ value: o.id, label: o.name, aside: `+ ${formatBRL(o.price)}` })),
          ]}
        />
      ) : (
        <fieldset>
          <legend className="sr-only">{group.name}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.options.map((o) => {
              const checked = selected.includes(o.id);
              return (
                <CheckCard
                  key={o.id}
                  checked={checked}
                  disabled={atLimit}
                  onChange={(c) => onChange(c ? [...selected, o.id] : selected.filter((id) => id !== o.id))}
                  label={o.name}
                  aside={`+ ${formatBRL(o.price)}`}
                />
              );
            })}
          </div>
        </fieldset>
      )}
    </section>
  );
}

/** Size, extras, notes and quantity — shared by the product sheet and the standalone product page. */
export function ProductConfigurator({ product, onAdded, layout }: { product: Product; onAdded?: () => void; layout: 'sheet' | 'page' }) {
  const { productsById, groupsById } = useCatalog();
  const groups = useMemo(
    () => product.addonGroupIds.map((id) => groupsById.get(id)).filter((g): g is AddonGroup => Boolean(g && g.options.length)),
    [product, groupsById],
  );
  const [variantId, setVariantId] = useState(() => defaultVariantId(product));
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const notesId = useId();

  const addonOptionIds = Object.values(picked).flat();
  const priced = useMemo(() => {
    try {
      return priceLine({ productId: product.id, variantId, quantity, addonOptionIds, notes }, productsById, groupsById);
    } catch {
      return undefined;
    }
  }, [product.id, variantId, quantity, addonOptionIds.join(), notes, productsById, groupsById]);

  const missingRequired = groups.find((g) => (picked[g.id]?.length ?? 0) < g.minSelect);
  const quickNotes = QUICK_NOTES[product.categoryId] ?? [];
  const toggleQuick = (note: string) => {
    const parts = notes.split(',').map((p) => p.trim()).filter(Boolean);
    const next = parts.includes(note) ? parts.filter((p) => p !== note) : [...parts, note];
    setNotes(next.join(', ').slice(0, 140));
  };

  const submit = () => {
    if (!priced || missingRequired) return;
    addToCart(product, { variantId, quantity, addonOptionIds, notes });
    onAdded?.();
  };

  return (
    <div className={cn('grid min-h-0 flex-1', layout === 'sheet' ? 'md:h-full md:grid-cols-[1fr_1.1fr] md:grid-rows-[minmax(0,1fr)]' : 'gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16')}>
      <div className={cn('relative', layout === 'sheet' ? 'bg-flour-deep md:h-full md:overflow-hidden' : '')}>
        <m.div
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={cn(layout === 'sheet' ? 'md:h-full' : 'lg:sticky lg:top-28')}
        >
          <Picture
            src={product.image}
            alt={product.imageAlt ?? product.name}
            priority
            sizes={layout === 'sheet' ? '(min-width: 768px) 30rem, 100vw' : '(min-width: 1024px) 40vw, 100vw'}
            className={cn(
              layout === 'sheet' ? 'aspect-[4/3] md:aspect-auto md:h-full' : 'aspect-square rounded-[var(--radius-xl)]',
            )}
          />
        </m.div>
      </div>

      <div className={cn('flex min-h-0 flex-col', layout === 'sheet' && 'md:overflow-hidden')}>
        <div className={cn(layout === 'sheet' && 'px-5 pt-6 pb-4 sm:px-8 md:flex-1 md:overflow-y-auto md:pt-8')}>
          <div className="flex flex-wrap gap-1.5">
            {product.badges.map((b) => (
              <ProductBadge key={b} kind={b} />
            ))}
          </div>
          {layout === 'page' ? (
            <h1 className="mt-4 font-display text-5xl leading-none tracking-[-0.025em] text-ink lg:text-6xl">{product.name}</h1>
          ) : (
            // The dialog already exposes the name to assistive tech via its (visually hidden) title.
            <p className="mt-3 font-display text-[2.125rem] leading-[1.02] tracking-[-0.025em] text-ink" aria-hidden>
              {product.name}
            </p>
          )}
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">{product.description || product.shortDescription}</p>
          {product.ingredients.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Ingredientes">
              {product.ingredients.map((i) => (
                <li key={i} className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft">
                  {i}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-7 space-y-6 pb-2">
            {product.variants.length > 1 && (
              <section className="border-t border-line pt-6">
                <RadioCards
                  name="size"
                  legend="Tamanho"
                  value={variantId}
                  onChange={setVariantId}
                  columns={1}
                  options={product.variants.map((v) => ({
                    value: v.id,
                    label: v.label,
                    description: v.detail,
                    aside: formatBRL(v.price),
                  }))}
                />
              </section>
            )}

            {groups.map((group) => (
              <GroupPicker key={group.id} headingLevel={layout === 'page' ? 'h2' : 'h3'} group={group} selected={picked[group.id] ?? []} onChange={(ids) => setPicked((p) => ({ ...p, [group.id]: ids }))} />
            ))}

            <section className="border-t border-line pt-6">
              <label htmlFor={notesId} className="text-base font-semibold text-ink">
                Observações
              </label>
              {quickNotes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2" aria-label="Sugestões de observação">
                  {quickNotes.map((q) => {
                    const on = notes.split(',').map((p) => p.trim()).includes(q);
                    return (
                      <button
                        key={q}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleQuick(q)}
                        className={cn(
                          'h-9 rounded-full border px-3.5 text-[0.8125rem] font-medium transition-colors',
                          on ? 'border-ink bg-ink text-flour' : 'border-line text-ink-soft hover:border-ink/50',
                        )}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              )}
              <textarea
                id={notesId}
                value={notes}
                maxLength={140}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex.: sem cebola, pouco molho, adicionar borda…"
                className="mt-3 block min-h-20 w-full resize-none rounded-[var(--radius-sm)] border border-line bg-paper px-4 py-3 text-[0.9375rem] outline-none focus:border-ink"
              />
              <p className="mt-1 text-right text-xs text-ink-muted tabular">{notes.length}/140</p>
            </section>
          </div>
        </div>

        <div
          className={cn(
            'flex items-center gap-3 border-t border-line bg-paper/95 backdrop-blur',
            layout === 'sheet'
              ? 'sticky bottom-0 z-10 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 md:static'
              : 'sticky bottom-4 z-10 mt-8 rounded-full border border-line p-2 shadow-lift',
          )}
        >
          <QuantityStepper label="Quantidade" value={quantity} onChange={setQuantity} />
          <Button size="lg" className="flex-1 justify-between px-6" onClick={submit} disabled={!priced || Boolean(missingRequired)}>
            <span>{missingRequired ? `Escolha: ${missingRequired.name}` : 'Adicionar'}</span>
            <span className="tabular">{priced && <AnimatedText value={formatBRL(priced.lineTotal)} />}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

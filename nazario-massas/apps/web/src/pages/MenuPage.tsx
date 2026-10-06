import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { m } from 'motion/react';
import { Leaf, Flame, Search, X } from 'lucide-react';
import { CATEGORY_IDS, type CategoryId, type Product } from '@nazario/shared';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Reveal, revealItem } from '@/components/ui/Reveal';
import { DrinkRow, ProductCard, ProductRow } from '@/features/catalog/ProductCard';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { useSeo } from '@/lib/seo';
import { useCatalog } from '@/stores/catalog';

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Filter = 'vegetariano' | 'picante';

function matches(product: Product, query: string, filters: Filter[]) {
  if (filters.some((f) => !product.badges.includes(f))) return false;
  if (!query) return true;
  const haystack = normalize([product.name, product.shortDescription, ...product.ingredients].join(' '));
  return normalize(query)
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

/** Highlights the tab of the section currently under the sticky bar (rAF-throttled, passive). */
function useScrollSpy(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(`sec-${id}`);
        if (el && el.getBoundingClientRect().top <= 180) current = id;
      }
      // At the very bottom, the last (short) section wins.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = ids[ids.length - 1];
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [ids]);
  return active;
}

export default function MenuPage() {
  const { categoria } = useParams();
  const navigate = useNavigate();
  const { data, status, error, load } = useCatalog();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());
  const [filters, setFilters] = useState<Filter[]>([]);
  const wide = useMediaQuery('(min-width: 768px)');
  const tabsRef = useRef<HTMLDivElement>(null);

  const category = CATEGORY_IDS.includes(categoria as CategoryId) ? (categoria as CategoryId) : undefined;
  const categoryInfo = data?.categories.find((c) => c.id === category);

  useSeo({
    title: categoryInfo ? `${categoryInfo.name} — Cardápio` : 'Cardápio',
    description: categoryInfo
      ? `${categoryInfo.description} Peça online na Nazário Massas.`
      : 'Pizzas de fermentação natural, massas frescas e bebidas. Escolha, personalize e peça online para entrega ou retirada.',
    path: category ? `/cardapio/${category}` : '/cardapio',
  });

  const sections = useMemo(() => {
    if (!data) return [];
    return data.categories.map((c) => ({
      category: c,
      products: data.products.filter((p) => p.categoryId === c.id && matches(p, deferredQuery, filters)),
    }));
  }, [data, deferredQuery, filters]);

  const sectionIds = useMemo(() => sections.map((s) => s.category.id), [sections]);
  const active = useScrollSpy(sectionIds);
  const total = sections.reduce((n, s) => n + s.products.length, 0);

  // Deep link: /cardapio/massas scrolls to the section once the menu is rendered.
  useEffect(() => {
    if (!category || status !== 'ready') return;
    const el = document.getElementById(`sec-${category}`);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 128;
      window.scrollTo({ top, behavior: window.scrollY > 200 ? 'smooth' : 'instant' });
    }
  }, [category, status]);

  const goToSection = (id: CategoryId) => {
    navigate(`/cardapio/${id}`, { replace: true, preventScrollReset: true });
  };

  const toggleFilter = (f: Filter) => setFilters((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]));

  return (
    <div className="pb-28">
      <header className="container-page pt-28 pb-8 sm:pt-36 sm:pb-12">
        <Reveal>
          <p className="eyebrow text-tomato">Cardápio</p>
          <h1 className="mt-3 font-display text-[3rem] leading-[0.95] tracking-[-0.035em] text-ink sm:text-7xl">
            {categoryInfo ? categoryInfo.name : 'Tudo sai do nosso forno.'}
          </h1>
          <p className="mt-5 max-w-xl text-ink-soft">
            {categoryInfo?.description ??
              'Pizzas de fermentação natural, massas frescas e bebidas geladas. Toque em um item para escolher tamanho, adicionais e observações.'}
          </p>
        </Reveal>
      </header>

      <div ref={tabsRef} className="sticky top-16 z-30 border-y border-line bg-flour/90 backdrop-blur-xl sm:top-[4.5rem]">
        <div className="container-page flex items-center gap-3 py-3">
          <nav aria-label="Categorias" className="-mx-1 flex flex-1 gap-1 overflow-x-auto scrollbar-none">
            {sections.map(({ category: c }) => (
              <button
                key={c.id}
                type="button"
                onClick={() => goToSection(c.id)}
                aria-current={active === c.id ? 'true' : undefined}
                className={cn(
                  'relative h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-200',
                  active === c.id ? 'text-flour' : 'text-ink-soft hover:text-ink',
                )}
              >
                {active === c.id && (
                  <m.span
                    className="absolute inset-0 rounded-full bg-ink"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    aria-hidden
                  />
                )}
                <span className="relative">{c.name}</span>
              </button>
            ))}
          </nav>
          <div className="relative hidden w-72 sm:block">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar sabor ou ingrediente"
              aria-label="Buscar no cardápio"
              className="h-10 w-full rounded-full border border-line bg-paper pr-4 pl-10 text-sm outline-none focus:border-ink"
            />
          </div>
        </div>
        <div className="container-page flex items-center gap-2 pb-3 sm:pb-3">
          <div className="relative flex-1 sm:hidden">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar"
              aria-label="Buscar no cardápio"
              className="h-10 w-full rounded-full border border-line bg-paper pr-4 pl-10 text-[1rem] outline-none focus:border-ink"
            />
          </div>
          {(
            [
              ['vegetariano', 'Vegetariano', <Leaf key="l" className="size-3.5" aria-hidden />],
              ['picante', 'Picante', <Flame key="f" className="size-3.5" aria-hidden />],
            ] as const
          ).map(([value, label, icon]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filters.includes(value)}
              aria-label={`Filtrar: ${label}`}
              onClick={() => toggleFilter(value)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors sm:h-8 sm:text-xs',
                filters.includes(value) ? 'border-ink bg-ink text-flour' : 'border-line bg-paper text-ink-soft hover:border-ink/40',
              )}
            >
              {icon}
              <span className="hidden min-[400px]:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reserve space so the footer doesn't jump when the menu arrives (CLS). */}
      <div className="container-page min-h-[100svh]">
        {status === 'error' && <ErrorState message={error ?? ''} onRetry={() => void load(true)} />}
        {status !== 'ready' && status !== 'error' && (
          <div className="grid gap-x-6 gap-y-12 pt-12 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Carregando cardápio">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-[var(--radius-lg)]" />
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        )}

        {status === 'ready' && total === 0 && (
          <EmptyState
            icon={<Search className="size-7" aria-hidden />}
            title="Nenhum item encontrado"
            description="Tente outro termo ou remova os filtros."
            action={
              <Button
                variant="secondary"
                icon={<X className="size-4" aria-hidden />}
                onClick={() => {
                  setQuery('');
                  setFilters([]);
                }}
              >
                Limpar busca
              </Button>
            }
          />
        )}

        {sections.map(({ category: c, products }, sectionIndex) =>
          products.length === 0 ? null : (
            <section key={c.id} id={`sec-${c.id}`} aria-labelledby={`h-${c.id}`} className="scroll-mt-36 pt-14 sm:pt-20">
              <div className="mb-6 flex items-baseline justify-between border-b border-line pb-4 sm:mb-10">
                <h2 id={`h-${c.id}`} className="font-display text-4xl tracking-[-0.03em] text-ink sm:text-5xl">
                  <span className="mr-3 align-top font-sans text-xs font-semibold tracking-[0.16em] text-tomato">0{sectionIndex + 1}</span>
                  {c.name}
                </h2>
                <p className="hidden text-sm text-ink-muted sm:block">{c.tagline}</p>
              </div>

              {c.id === 'bebidas' ? (
                <ul className="grid divide-y divide-line md:grid-cols-2 md:gap-x-12 md:divide-y-0">
                  {products.map((p) => (
                    <li key={p.id} className="md:border-b md:border-line">
                      <DrinkRow product={p} />
                    </li>
                  ))}
                </ul>
              ) : wide ? (
                <Reveal stagger amount={0.05} as="ul" className="grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
                  {products.map((p, i) => (
                    <m.li key={p.id} variants={revealItem}>
                      <ProductCard product={p} index={i} />
                    </m.li>
                  ))}
                </Reveal>
              ) : (
                <ul className="divide-y divide-line">
                  {products.map((p) => (
                    <li key={p.id}>
                      <ProductRow product={p} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ),
        )}
      </div>
    </div>
  );
}

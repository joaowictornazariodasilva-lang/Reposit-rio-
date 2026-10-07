import { useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { m, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ArrowUpRight, Clock, MapPin } from 'lucide-react';
import { startingPrice, type CategoryId } from '@nazario/shared';
import { ButtonLink } from '@/components/ui/Button';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Picture } from '@/components/ui/Picture';
import { Reveal, revealItem } from '@/components/ui/Reveal';
import { Hero, Ticker } from '@/features/home/Hero';
import { CurtainReveal, ExplodedPizza, Manifesto, OvenNumbers } from '@/features/home/Scenes';
import { ProductCard, useProductHref } from '@/features/catalog/ProductCard';
import { formatBRL, pluralize } from '@/lib/format';
import { useSeo } from '@/lib/seo';
import { useCatalog } from '@/stores/catalog';
import type { Product } from '@nazario/shared';

const CATEGORY_ART: Record<CategoryId, { image: string; alt: string }> = {
  pizzas: { image: '/images/categoria-pizzas', alt: 'Pizza margherita com manjericão sobre fundo escuro' },
  massas: { image: '/images/categoria-massas', alt: 'Spaghetti carbonara servido em prato branco' },
  bebidas: { image: '/images/categoria-bebidas', alt: 'Copo de refrigerante com gelo' },
};

function SectionHeading({ eyebrow, title, action, id }: { eyebrow: string; title: string; action?: React.ReactNode; id: string }) {
  return (
    <Reveal className="mb-10 flex flex-col gap-5 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow text-tomato">{eyebrow}</p>
        <h2 id={id} className="mt-3 max-w-2xl font-display text-[2.5rem] leading-[1] tracking-[-0.03em] text-ink sm:text-6xl">
          {title}
        </h2>
      </div>
      {action}
    </Reveal>
  );
}

function Categories() {
  const { data, status } = useCatalog();
  return (
    <section className="container-page py-20 sm:py-28" aria-labelledby="categorias-title">
      <SectionHeading id="categorias-title" eyebrow="O cardápio" title="Escolha por onde começar." />
      <Reveal stagger className="grid gap-4 sm:grid-cols-3 sm:gap-5" amount={0.15}>
        {(data?.categories ?? []).map((category, i) => {
          const count = data?.products.filter((p) => p.categoryId === category.id).length ?? 0;
          const art = CATEGORY_ART[category.id];
          return (
            <m.div key={category.id} variants={revealItem}>
              <Link
                to={`/cardapio/${category.id}`}
                className="group relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-xl)] bg-oven text-flour sm:aspect-[3/4]"
              >
                <Picture
                  src={art.image}
                  alt={art.alt}
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="absolute inset-0 size-full"
                  imgClassName="transition-transform duration-[1.2s] ease-[var(--ease-out-soft)] group-hover:scale-[1.06]"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-oven via-oven/45 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                  <div>
                    <p className="eyebrow text-olive">Nº 0{i + 1}</p>
                    <h3 className="mt-2 font-display text-4xl leading-none">{category.name}</h3>
                    <p className="mt-2 text-sm text-ash">
                      {category.tagline} · {pluralize(count, 'opção', 'opções')}
                    </p>
                  </div>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-flour text-ink transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:rotate-45">
                    <ArrowUpRight className="size-5" aria-hidden />
                  </span>
                </div>
              </Link>
            </m.div>
          );
        })}
        {status !== 'ready' &&
          [0, 1, 2].map((i) => <Skeleton key={i} className="aspect-[4/3] rounded-[var(--radius-xl)] sm:aspect-[3/4]" />)}
      </Reveal>
    </section>
  );
}

function Favorites() {
  const { data, status, error, load } = useCatalog();
  const featured = (data?.products ?? []).filter((p) => p.featured).slice(0, 8);

  return (
    <section id="favoritos" className="bg-paper py-20 sm:py-28" aria-labelledby="favoritos-title">
      <div className="container-page">
        <SectionHeading
          id="favoritos-title"
          eyebrow="Seleção da casa"
          title="Os favoritos da Nazário"
          action={
            <Link to="/cardapio" className="link-underline inline-flex w-fit items-center gap-2 text-sm font-semibold text-ink">
              Ver cardápio completo <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
        {status === 'error' ? (
          <ErrorState message={error ?? ''} onRetry={() => void load(true)} />
        ) : (
          <Reveal
            stagger
            amount={0.1}
            as="ul"
            className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-14 sm:overflow-visible sm:px-0 lg:grid-cols-4"
          >
            {status === 'ready'
              ? featured.map((product, i) => (
                  <m.li key={product.id} variants={revealItem} className="w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-auto sm:max-w-none">
                    <ProductCard product={product} index={i} />
                  </m.li>
                ))
              : [0, 1, 2, 3].map((i) => (
                  <li key={i} className="w-[78vw] max-w-[22rem] shrink-0 space-y-4 sm:w-auto">
                    <Skeleton className="aspect-square rounded-[var(--radius-lg)]" />
                    <Skeleton className="h-7 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                  </li>
                ))}
          </Reveal>
        )}
      </div>
    </section>
  );
}

const STEPS = [
  { n: '01', title: 'Massa de 48 horas', text: 'Farinha italiana tipo 00, fermento natural e paciência. A massa descansa dois dias até ficar leve, aerada e fácil de digerir.' },
  { n: '02', title: 'Forno a lenha a 400 °C', text: 'Noventa segundos bastam para a borda alta, o fundo crocante e as marcas de leopardo que só o fogo de verdade entrega.' },
  { n: '03', title: 'Pronta quando você chega', text: 'Peça pelo site e retire no balcão: a pizza sai do forno no horário combinado, em embalagem com respiro para manter a borda crocante.' },
];

function Method() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <section className="container-page grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20" aria-labelledby="metodo-title">
      <div ref={ref} className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] lg:aspect-[4/5.2]">
        <CurtainReveal className="absolute inset-0">
          <m.div className="absolute inset-[-10%_0]" style={{ y }}>
            <Picture
              src="/images/editorial-queijo"
              kind="editorial"
              width={2}
              height={3}
              alt="Fatia de pizza sendo levantada com o queijo esticando"
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="size-full"
            />
          </m.div>
        </CurtainReveal>
        <div className="absolute top-5 left-5 rounded-full bg-oven/80 px-4 py-2 text-xs font-semibold tracking-wide text-flour backdrop-blur">
          Fior di latte rasgado à mão
        </div>
      </div>

      <div>
        <Reveal>
          <p className="eyebrow text-tomato">O método</p>
          <h2 id="metodo-title" className="mt-3 font-display text-[2.5rem] leading-[1] tracking-[-0.03em] text-ink sm:text-6xl">
            Sem atalhos entre a farinha e o forno.
          </h2>
        </Reveal>
        <Reveal stagger as="ul" className="mt-12 space-y-0">
          {STEPS.map((s) => (
            <m.li key={s.n} variants={revealItem} className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-line py-7">
              <span className="font-display text-2xl italic text-tomato">{s.n}</span>
              <div>
                <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{s.text}</p>
              </div>
            </m.li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

function PastaRow({ product }: { product: Product }) {
  const href = useProductHref(product);
  return (
    <Link {...href} className="group flex items-center gap-4 border-b border-oven-line py-5">
      <Picture src={product.image} alt="" sizes="64px" className="size-16 shrink-0 rounded-full" />
      <span className="min-w-0 flex-1">
        <span className="block font-display text-2xl leading-tight text-flour">{product.name}</span>
        <span className="mt-1 line-clamp-1 block text-sm text-ash">{product.shortDescription}</span>
      </span>
      <span className="tabular shrink-0 text-sm font-semibold text-flour">{formatBRL(startingPrice(product))}</span>
      <ArrowRight className="size-4 shrink-0 text-ember transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
    </Link>
  );
}

function PastaBand() {
  const products = useCatalog((s) => s.data?.products);
  const pastas = useMemo(() => (products ?? []).filter((p) => p.categoryId === 'massas').slice(0, 4), [products]);
  return (
    <section className="grain grain-dark relative overflow-hidden bg-oven text-flour" aria-labelledby="massas-title">
      <div className="container-page grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div className="order-2 lg:order-1">
          <Reveal>
            <p className="eyebrow text-olive">Massas da casa</p>
            <h2 id="massas-title" className="mt-3 font-display text-[2.5rem] leading-[1] tracking-[-0.03em] sm:text-6xl">
              Feitas à mão, <em className="text-ember">todos os dias.</em>
            </h2>
            <p className="mt-6 max-w-lg leading-relaxed text-ash">
              Sêmola, ovos caipiras e molhos que passam horas no fogo. Do ragu de costela braseada por 8 horas à carbonara romana
              sem creme de leite.
            </p>
          </Reveal>
          <Reveal className="mt-8 border-t border-oven-line">
            {pastas.map((p) => (
              <PastaRow key={p.id} product={p} />
            ))}
          </Reveal>
          <ButtonLink to="/cardapio/massas" variant="light" size="lg" className="mt-10" icon={<ArrowRight className="size-5" aria-hidden />}>
            Ver todas as massas
          </ButtonLink>
        </div>
        <Reveal className="order-1 lg:order-2">
          <CurtainReveal curtain="bg-oven" className="mx-auto aspect-[4/5] max-w-md rounded-t-[999px] rounded-b-[var(--radius-xl)]">
            <Picture
              src="/images/editorial-garfo"
              kind="editorial"
              width={4}
              height={5}
              alt="Spaghetti enrolado em um garfo sobre fundo preto"
              sizes="(min-width: 1024px) 28rem, 90vw"
              className="size-full bg-oven"
            />
          </CurtainReveal>
        </Reveal>
      </div>
    </section>
  );
}

function OrderCta() {
  const settings = useCatalog((s) => s.data?.settings);
  return (
    <section className="container-page py-20 sm:py-28" aria-labelledby="pedir-title">
      <Reveal className="relative overflow-hidden rounded-[var(--radius-xl)] bg-tomato px-6 py-14 text-white sm:px-14 sm:py-20">
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-40 size-[28rem] rounded-full border-[48px] border-white/[0.07]" />
        <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-white">Pedido em 3 toques</p>
            <h2 id="pedir-title" className="mt-3 font-display text-[2.5rem] leading-[1] tracking-[-0.03em] sm:text-6xl">
              Escolha, personalize, pague com Pix.
            </h2>
            <p className="mt-5 max-w-lg text-white">
              Sem cadastro e sem senha. Acompanhe o preparo em tempo real e retire no balcão, sem fila.
            </p>
            <ButtonLink to="/cardapio" variant="light" size="lg" className="mt-8" icon={<ArrowRight className="size-5" aria-hidden />}>
              Montar meu pedido
            </ButtonLink>
          </div>
          <ul className="space-y-4 text-sm text-white">
            <li className="flex gap-3">
              <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
              {settings?.hours ?? 'Terça a domingo, 18h às 23h30'}
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {settings?.address ?? 'Vila Madalena, São Paulo · SP'}
            </li>
            {settings?.deliveryEnabled && settings.freeDeliveryFrom > 0 && (
              <li className="rounded-[var(--radius-md)] bg-white/10 px-4 py-3">
                Entrega grátis em pedidos a partir de <strong className="tabular">{formatBRL(settings.freeDeliveryFrom)}</strong>.
              </li>
            )}
          </ul>
        </div>
      </Reveal>
    </section>
  );
}

export default function HomePage() {
  useSeo({
    description:
      'Pizzas de longa fermentação assadas no forno a lenha e massas frescas feitas à mão todos os dias. Peça online e retire no balcão, na Vila Madalena, São Paulo.',
    path: '/',
  });

  return (
    <>
      <Hero />
      <Ticker />
      <Manifesto />
      <Categories />
      <ExplodedPizza />
      <Favorites />
      <OvenNumbers />
      <Method />
      <PastaBand />
      <OrderCta />
    </>
  );
}

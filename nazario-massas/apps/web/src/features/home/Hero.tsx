import { useRef } from 'react';
import { Link } from 'react-router';
import { m, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Bike, Store } from 'lucide-react';
import { startingPrice } from '@nazario/shared';
import { ButtonLink } from '@/components/ui/Button';
import { Picture } from '@/components/ui/Picture';
import { SplitWords } from '@/components/ui/Reveal';
import { formatBRL } from '@/lib/format';
import { useCatalog } from '@/stores/catalog';

const EASE = [0.22, 1, 0.36, 1] as const;
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: EASE, delay },
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const settings = useCatalog((s) => s.data?.settings);
  const margherita = useCatalog((s) => s.data?.products.find((p) => p.slug === 'margherita'));

  return (
    <section ref={ref} className="grain grain-dark relative overflow-hidden bg-oven text-flour" aria-labelledby="hero-title">
      {/* warm ember glow behind the oven arch */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-[-10%] size-[70vmax] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgb(224 97 47 / 0.35), transparent 60%)' }}
      />
      <div className="container-page relative grid min-h-[100svh] items-center gap-10 gap-y-8 pt-20 pb-12 sm:pt-24 lg:grid-cols-12 lg:gap-8 lg:pt-28 lg:pb-20">
        <div className="order-2 lg:order-1 lg:col-span-6 lg:pr-6">
          <m.p className="eyebrow text-olive" {...fadeUp(0.1)}>
            Pizzaria & massas artesanais · Vila Madalena
          </m.p>
          <h1 id="hero-title" className="mt-5 font-display text-display text-flour">
            <SplitWords text="48 horas de" className="block italic" delay={0.15} />
            <SplitWords text="fermentação." className="block" delay={0.3} />
            <SplitWords text="90 segundos de forno." className="mt-3 block text-[max(0.42em,1.75rem)] leading-tight tracking-[-0.02em] text-ember" delay={0.5} />
          </h1>
          <m.p className="mt-7 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ash" {...fadeUp(0.7)}>
            Pizzas napolitanas de borda alta e aerada, massas frescas feitas à mão todos os dias. Peça pelo site e retire
            quentinho no nosso balcão.
          </m.p>
          <m.div className="mt-9 flex flex-col gap-3 sm:flex-row" {...fadeUp(0.85)}>
            <ButtonLink to="/cardapio" size="lg" icon={<ArrowRight className="size-5" aria-hidden />} className="flex-row-reverse">
              Pedir agora
            </ButtonLink>
            <ButtonLink to="/cardapio/pizzas" size="lg" variant="outline-light">
              Ver cardápio
            </ButtonLink>
          </m.div>
          <m.ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-ash" {...fadeUp(1)} aria-label="Informações de funcionamento">
            <li className="flex items-center gap-2">
              <span className="relative flex size-2.5" aria-hidden>
                {settings?.isOpen !== false && <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#9fc490] opacity-60" />}
                <span className={`relative inline-flex size-2.5 rounded-full ${settings?.isOpen === false ? 'bg-ash' : 'bg-[#9fc490]'}`} />
              </span>
              <span className="font-semibold text-flour">{settings?.isOpen === false ? 'Fechado agora' : 'Aberto agora'}</span>
            </li>
            {settings?.deliveryEnabled && (
              <li className="flex items-center gap-2">
                <Bike className="size-4" aria-hidden /> Entrega {settings.deliveryEstimate}
              </li>
            )}
            <li className="flex items-center gap-2">
              <Store className="size-4" aria-hidden /> Retirada no balcão em {settings?.pickupEstimate ?? '20–30 min'}
            </li>
          </m.ul>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-6">
          <m.div
            className="relative mx-auto max-w-[36rem] lg:mr-[-4vw] lg:max-w-none"
            // Transform-only entrance: the photo is visible from the first frame (it's the LCP element).
            initial={{ scale: 0.96, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EASE }}
          >
            {/* Oven-mouth arch — echoes the brand mark */}
            <div className="relative aspect-[4/3.3] max-h-[44svh] w-full overflow-hidden rounded-t-[999px] rounded-b-[var(--radius-xl)] ring-1 ring-oven-line sm:aspect-[4/4.4] sm:max-h-none">
              <m.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
                <Picture
                  src="/images/hero-forno"
                  kind="editorial"
                  alt="Pizza margherita recém-saída do forno a lenha, com as brasas ao fundo"
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  width={3}
                  height={2}
                  priority
                  className="size-full bg-oven-raised"
                  imgClassName="object-[62%_center]"
                />
              </m.div>
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-oven/50 via-transparent to-transparent" />
            </div>

            {margherita && (
              <m.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 1.1 }}
                className="absolute bottom-6 left-4 sm:-left-6 sm:bottom-10"
              >
                <Link
                  to={`/produto/${margherita.slug}`}
                  className="group flex items-center gap-3 rounded-full bg-flour py-2 pr-5 pl-2 text-ink shadow-lift transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <Picture src={margherita.image} alt="" sizes="48px" className="size-12 rounded-full" />
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">Margherita</span>
                    <span className="tabular block text-xs text-ink-muted">a partir de {formatBRL(startingPrice(margherita))}</span>
                  </span>
                  <ArrowRight className="size-4 text-tomato transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </m.div>
            )}
          </m.div>
        </div>
      </div>
    </section>
  );
}

const TICKER = ['Fermentação natural de 48 h', 'Forno a lenha a 400 °C', 'Fior di latte', 'Tomates San Marzano', 'Massas frescas todos os dias', 'Embalagem térmica'];

/** Slow CSS marquee (transform only); duplicated once so the loop is seamless. Hidden from screen readers. */
export function Ticker() {
  return (
    <div className="overflow-hidden border-y border-line bg-flour py-4" aria-hidden>
      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {TICKER.map((t) => (
              <li key={t} className="flex items-center whitespace-nowrap px-6 font-display text-xl italic text-ink-soft sm:text-2xl">
                {t}
                <span className="ml-12 inline-block size-1.5 rounded-full bg-tomato" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

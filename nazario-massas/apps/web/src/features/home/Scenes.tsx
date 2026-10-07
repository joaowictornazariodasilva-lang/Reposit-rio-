import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  animate,
  interpolate,
  m,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Picture } from '@/components/ui/Picture';
import { assetUrl } from '@/lib/images';

/*
 * Scroll-driven scenes for the home page. Everything animates transform/opacity only,
 * and every scene has a static layout under prefers-reduced-motion.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Piecewise scroll mapping computed on the main thread. Motion hands plain
 * `useTransform(value, input, output)` opacity to native ScrollTimeline, which
 * mis-maps multi-stop ranges inside a pinned section — a function transform opts out.
 */
function useRamp(value: MotionValue<number>, input: number[], output: number[]) {
  const map = interpolate(input, output);
  return useTransform(value, (v) => map(v));
}

/* ─────────────────────────── Manifesto: words light up as you read ─────────────────────────── */

function LitWord({ progress, range, children }: { progress: MotionValue<number>; range: [number, number]; children: string }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <m.span style={{ opacity }} className="inline">
      {children}
    </m.span>
  );
}

export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const text =
    'Cada pizza que sai do nosso forno começou dois dias antes: farinha, água, sal e tempo. Sem atalhos, sem pressa — é isso que você sente na primeira mordida.';
  const words = text.split(' ');

  return (
    <section className="container-page py-24 sm:py-36" aria-label="Nosso jeito de fazer">
      <p className="eyebrow mb-8 text-tomato">Desde a primeira fornada</p>
      <p ref={ref} className="max-w-5xl font-display text-[2rem] leading-[1.12] tracking-[-0.025em] text-ink sm:text-[3.25rem] lg:text-[4rem]">
        <span className="sr-only">{text}</span>
        <span aria-hidden>
          {words.map((word, i) =>
            reduce ? (
              <span key={i}>{word} </span>
            ) : (
              <LitWord key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
                {`${word} `}
              </LitWord>
            ),
          )}
        </span>
      </p>
    </section>
  );
}

/* ─────────────────────────── Exploded margherita (pinned) ─────────────────────────── */

const SLICES = 8;
const PIZZA = '/images/pizza-topo';

/** Wedge from the centre, wide enough past the crust that neighbours tile without gaps. */
function wedgeClip(i: number) {
  const step = (Math.PI * 2) / SLICES;
  // A hair of overlap with each neighbour hides the anti-aliased seams when the pizza is whole.
  const pad = 0.012;
  const a0 = -Math.PI / 2 + i * step - pad;
  const pts = [0, 0.5, 1].map((t) => {
    const a = a0 + (step + pad * 2) * t;
    return `${(50 + Math.cos(a) * 75).toFixed(2)}% ${(50 + Math.sin(a) * 75).toFixed(2)}%`;
  });
  return `polygon(50% 50%, ${pts.join(', ')})`;
}

function Wedge({ i, spread }: { i: number; spread: MotionValue<number> }) {
  const angle = -Math.PI / 2 + (i + 0.5) * ((Math.PI * 2) / SLICES);
  const x = useTransform(spread, (d) => `${Math.cos(angle) * d * 13}%`);
  const y = useTransform(spread, (d) => `${Math.sin(angle) * d * 13}%`);
  const rotate = useTransform(spread, (d) => (i % 2 ? 1 : -1) * d * 6);
  return (
    <m.div className="absolute inset-0 will-change-transform" style={{ x, y, rotate, clipPath: wedgeClip(i) }}>
      <img
        src={assetUrl(`${PIZZA}-1000.webp`)}
        srcSet={`${assetUrl(`${PIZZA}-600.webp`)} 600w, ${assetUrl(`${PIZZA}-1000.webp`)} 1000w`}
        sizes="(min-width: 1024px) 34rem, 78vw"
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="size-full select-none object-contain"
      />
    </m.div>
  );
}

const INGREDIENTS = [
  { name: 'Fior di latte', note: 'rasgado à mão', pos: 'top-[4%] -left-[4%] sm:-left-[30%]', line: 'right' },
  { name: 'San Marzano', note: 'tomate italiano DOP', pos: 'top-[8%] -right-[4%] sm:-right-[30%]', line: 'left' },
  { name: 'Manjericão', note: 'colhido no dia', pos: 'bottom-[10%] -left-[4%] sm:-left-[28%]', line: 'right' },
  { name: 'Massa de 48 h', note: 'fermentação natural', pos: 'bottom-[4%] -right-[4%] sm:-right-[30%]', line: 'left' },
] as const;

function IngredientLabel({ item, show, delay }: { item: (typeof INGREDIENTS)[number]; show: MotionValue<number>; delay: number }) {
  const opacity = useRamp(show, [delay, delay + 0.25], [0, 1]);
  const y = useRamp(show, [delay, delay + 0.25], [14, 0]);
  const lineScale = useRamp(show, [delay + 0.1, delay + 0.4], [0, 1]);
  return (
    <m.li style={{ opacity, y }} className={`absolute z-10 ${item.pos}`}>
      <div className={`flex items-center gap-3 ${item.line === 'left' ? 'flex-row-reverse text-right' : ''}`}>
        <div className="rounded-[var(--radius-md)] bg-oven/90 px-3.5 py-2.5 ring-1 ring-oven-line backdrop-blur sm:bg-transparent sm:p-0 sm:ring-0 sm:backdrop-blur-none">
          <p className="font-display text-lg leading-tight text-flour sm:text-2xl">{item.name}</p>
          <p className="text-xs text-ash sm:text-sm">{item.note}</p>
        </div>
        <m.span
          aria-hidden
          style={{ scaleX: lineScale }}
          className={`hidden h-px w-16 bg-ember sm:block lg:w-24 ${item.line === 'left' ? 'origin-right' : 'origin-left'}`}
        />
        <span aria-hidden className="hidden size-2 shrink-0 rounded-full bg-ember sm:block" />
      </div>
    </m.li>
  );
}

export function ExplodedPizza() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  // Reduced motion: freeze the scene in its most informative frame (slices apart, labels shown).
  const still = useMotionValue(0.56);
  const p = reduce ? still : scrollYProgress;

  const spread = useRamp(p, [0.1, 0.4, 0.7, 0.92], [0, 1, 1, 0]);
  const labels = useRamp(p, [0.3, 0.45, 0.68, 0.76], [0, 1, 1, 0]);
  const rotate = useRamp(p, [0, 1], [-30, 40]);
  const scale = useRamp(p, [0, 0.12, 0.9, 1], [0.78, 1, 1, 0.96]);
  const glow = useRamp(p, [0.1, 0.4, 0.92], [0.25, 0.7, 0.35]);
  const introOpacity = useRamp(p, [0.34, 0.42, 0.8, 0.9], [1, 0.25, 0.25, 1]);
  const outroOpacity = useRamp(p, [0.8, 0.9], [0, 1]);
  const outroY = useRamp(p, [0.8, 0.9], [24, 0]);

  return (
    <section
      ref={ref}
      className={`grain grain-dark relative bg-oven text-flour ${reduce ? '' : 'h-[320svh]'}`}
      aria-labelledby="anatomia-title"
    >
      <div className={`${reduce ? 'relative py-24' : 'sticky top-0 h-[100svh]'} overflow-hidden`}>
        <m.div
          aria-hidden
          style={{ opacity: glow }}
          className="pointer-events-none absolute top-1/2 left-1/2 size-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        >
          <div className="size-full rounded-full" style={{ background: 'radial-gradient(circle, rgb(224 97 47 / 0.4), transparent 62%)' }} />
        </m.div>

        <div className="container-page relative flex h-full flex-col justify-between gap-6 pt-24 pb-10 sm:pt-28 sm:pb-14">
          <m.div style={reduce ? undefined : { opacity: introOpacity }} className="max-w-xl">
            <p className="eyebrow text-olive">Anatomia de uma margherita</p>
            <h2 id="anatomia-title" className="mt-3 font-display text-[2.25rem] leading-[1] tracking-[-0.03em] sm:text-6xl">
              Quatro ingredientes. <em className="text-ember">Nenhum atalho.</em>
            </h2>
          </m.div>

          <div className="relative mx-auto w-[min(78vw,50svh)] sm:w-[min(52vw,54svh)] lg:w-[min(34rem,56svh)]">
            <m.div style={{ rotate, scale }} className="relative aspect-square will-change-transform">
              {Array.from({ length: SLICES }, (_, i) => (
                <Wedge key={i} i={i} spread={spread} />
              ))}
            </m.div>
            <ul aria-label="Ingredientes da margherita">
              {INGREDIENTS.map((item, i) => (
                <IngredientLabel key={item.name} item={item} show={labels} delay={i * 0.12} />
              ))}
            </ul>
          </div>

          <m.div
            style={reduce ? undefined : { opacity: outroOpacity, y: outroY }}
            className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <p className="max-w-md text-ash">
              Inteira de novo, saindo do forno em 90 segundos. <span className="text-flour">Pronta para você retirar no balcão.</span>
            </p>
            <Link
              to="/produto/margherita"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-flour px-6 text-sm font-semibold text-ink transition-transform duration-300 hover:-translate-y-0.5"
            >
              Pedir a margherita
              <ArrowRight className="size-4 text-tomato transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </m.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Oven numbers ─────────────────────────── */

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduce) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: EASE,
      onUpdate: (v) => {
        node.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [inView, reduce, to]);

  return (
    <span className="tabular inline-flex items-baseline" aria-hidden>
      <span ref={ref}>{to}</span>
      <span className="ml-1 text-[0.4em] text-ember">{suffix}</span>
    </span>
  );
}

const STATS = [
  { value: 400, suffix: '°C', label: 'no coração do forno a lenha' },
  { value: 90, suffix: 's', label: 'de forno — nem um a mais' },
  { value: 48, suffix: 'h', label: 'de fermentação natural da massa' },
];

export function OvenNumbers() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const marqueeX = useTransform(scrollYProgress, [0, 1], ['8%', '-38%']);
  const imageY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  const imageScale = useRamp(scrollYProgress, [0, 0.5, 1], [1.2, 1.05, 1.15]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-oven py-24 text-flour sm:py-36" aria-labelledby="forno-title">
      <m.div aria-hidden className="absolute inset-[-12%_0]" style={reduce ? undefined : { y: imageY, scale: imageScale }}>
        <Picture src="/images/hero-forno" kind="editorial" alt="" sizes="100vw" width={3} height={2} className="size-full" imgClassName="object-cover" />
      </m.div>
      <div aria-hidden className="absolute inset-0 bg-oven/85" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-oven via-transparent to-oven" />

      <m.p
        aria-hidden
        style={reduce ? undefined : { x: marqueeX }}
        className="relative font-display text-[22vw] leading-[0.85] tracking-[-0.05em] whitespace-nowrap text-transparent italic [-webkit-text-stroke:1px_rgb(224_97_47/0.55)] sm:text-[15vw]"
      >
        Forno a lenha · Forno a lenha
      </m.p>

      <div className="container-page relative mt-10 sm:mt-16">
        <h2 id="forno-title" className="sr-only">
          O forno em números
        </h2>
        <ul className="grid gap-10 sm:grid-cols-3 sm:gap-6">
          {STATS.map((s, i) => (
            <m.li
              key={s.label}
              initial={reduce ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
              className="border-t border-oven-line pt-6"
            >
              <p className="font-display text-[5.5rem] leading-none tracking-[-0.04em] sm:text-[7rem] lg:text-[9rem]">
                <Counter to={s.value} suffix={s.suffix} />
                <span className="sr-only">
                  {s.value} {s.suffix}
                </span>
              </p>
              <p className="mt-3 max-w-[16rem] text-ash">{s.label}</p>
            </m.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────── Curtain reveal for photos ─────────────────────────── */

/** A colour curtain lifts off the photo while it settles from a slight zoom (transform only). */
export function CurtainReveal({ children, className, curtain = 'bg-flour' }: { children: ReactNode; className?: string; curtain?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={`relative overflow-hidden ${className ?? ''}`}>{children}</div>;
  return (
    <m.div className={`relative overflow-hidden ${className ?? ''}`} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
      <m.div
        className="size-full"
        variants={{ hidden: { scale: 1.18 }, show: { scale: 1, transition: { duration: 1.4, ease: EASE } } }}
      >
        {children}
      </m.div>
      <m.div
        aria-hidden
        className={`absolute inset-0 origin-top ${curtain}`}
        variants={{ hidden: { scaleY: 1 }, show: { scaleY: 0, transition: { duration: 1, ease: [0.76, 0, 0.24, 1] } } }}
      />
    </m.div>
  );
}

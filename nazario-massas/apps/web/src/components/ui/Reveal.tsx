import type { ReactNode } from 'react';
import { m, useReducedMotion, type Variants } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

export const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

/** Scroll reveal (transform + opacity only). Children using `revealItem` stagger in. */
export function Reveal({
  children,
  className,
  as = 'div',
  amount = 0.25,
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'ul' | 'header';
  amount?: number;
  stagger?: boolean;
}) {
  const Component = m[as];
  // Reduced motion: content is simply there — no fade, no slide.
  const reduce = useReducedMotion();
  return (
    <Component
      className={className}
      initial={reduce ? 'show' : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={stagger ? revealContainer : revealItem}
    >
      {children}
    </Component>
  );
}

/** Splits a headline into words that rise in sequence — used sparingly for hero/section titles. */
export function SplitWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  const reduce = useReducedMotion();
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden>
          <m.span
            className="inline-block will-change-transform"
            initial={reduce ? false : { y: '105%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.06 }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </m.span>
        </span>
      ))}
    </span>
  );
}

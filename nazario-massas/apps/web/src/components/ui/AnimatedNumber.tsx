import { useEffect, useRef } from 'react';
import { AnimatePresence, animate, m, useReducedMotion } from 'motion/react';

/** Rolls the old value up and the new one in — used for counters and prices. */
export function AnimatedText({ value, className }: { value: string; className?: string }) {
  return (
    <span className={className} style={{ display: 'inline-grid', overflow: 'hidden', verticalAlign: 'bottom' }}>
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          key={value}
          style={{ gridArea: '1 / 1' }}
          initial={{ y: '70%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-70%', opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

/** Counts from the previous value to the next (dashboard KPIs). Writes textContent directly — no re-renders. */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      node.textContent = format(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        node.textContent = format(Math.round(v));
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, format, reduce]);

  return <span ref={ref} className="tabular">{format(value)}</span>;
}

import { useState } from 'react';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Point {
  date: string;
  revenue: number;
  orders: number;
}

const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' });
const longDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' });

/**
 * Single-series column chart (one hue, no legend — the title names it).
 * Thin columns (≤24 px) with a 4 px rounded cap, square at the baseline; recessive
 * baseline; labels only on today and the peak; per-column hover/focus tooltip;
 * a visually hidden table carries the same data for screen readers.
 */
export function RevenueChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const peak = data.reduce((best, d, i) => (d.revenue > (data[best]?.revenue ?? 0) ? i : best), 0);
  const todayIndex = data.length - 1;

  return (
    <figure>
      <div className="relative flex h-52 items-end gap-0 border-b border-line" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => {
          const height = (d.revenue / max) * 100;
          const labelled = (i === todayIndex || i === peak) && d.revenue > 0;
          const date = new Date(`${d.date}T12:00:00Z`);
          return (
            <button
              key={d.date}
              type="button"
              className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${longDate.format(date)}: ${formatBRL(d.revenue)} em ${d.orders} pedidos`}
            >
              {labelled && (
                <span className="tabular mb-1.5 text-[0.6875rem] font-semibold text-ink-soft">{formatBRL(d.revenue).replace(/,\d{2}$/, '')}</span>
              )}
              <span
                className={cn(
                  'block w-full max-w-6 origin-bottom rounded-t-[4px] transition-[opacity,transform] duration-500 ease-[var(--ease-out-soft)]',
                  i === todayIndex ? 'bg-tomato' : 'bg-tomato/45',
                  hover !== null && hover !== i && 'opacity-50',
                  'group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-tomato',
                )}
                style={{ height: `${Math.max(d.revenue > 0 ? 2 : 0, height * 0.82)}%` }}
              />
              {hover === i && (
                <span
                  role="tooltip"
                  className={cn(
                    'pointer-events-none absolute bottom-[calc(100%-1rem)] z-10 w-max rounded-[var(--radius-sm)] bg-oven px-3 py-2 text-left text-xs text-flour shadow-lift',
                    i > data.length / 2 ? 'right-1/2' : 'left-1/2',
                  )}
                >
                  <span className="block font-semibold capitalize">{longDate.format(date)}</span>
                  <span className="tabular mt-0.5 block text-ash">
                    {formatBRL(d.revenue)} · {d.orders} {d.orders === 1 ? 'pedido' : 'pedidos'}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex" aria-hidden>
        {data.map((d, i) => (
          <span key={d.date} className={cn('flex-1 text-center text-[0.6875rem] capitalize', i === todayIndex ? 'font-semibold text-ink' : 'text-ink-muted')}>
            {i === todayIndex ? 'Hoje' : weekday.format(new Date(`${d.date}T12:00:00Z`)).replace('.', '')}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Faturamento dos últimos 7 dias</caption>
        <thead>
          <tr>
            <th>Dia</th>
            <th>Faturamento</th>
            <th>Pedidos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{longDate.format(new Date(`${d.date}T12:00:00Z`))}</td>
              <td>{formatBRL(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

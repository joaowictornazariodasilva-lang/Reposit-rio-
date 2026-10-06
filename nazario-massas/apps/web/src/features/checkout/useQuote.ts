import { useEffect, useState } from 'react';
import type { CartLineInput, Quote } from '@nazario/shared';
import { ApiError } from '@/lib/api';

/** Server-side quote (authoritative totals + coupon validation), debounced. */
export function useQuote(items: CartLineInput[], fulfillment: 'delivery' | 'pickup', couponCode: string) {
  const [quote, setQuote] = useState<Quote>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify([items, fulfillment, couponCode]);

  useEffect(() => {
    if (items.length === 0) return;
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(() => {
      fetch('/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items, fulfillment, couponCode: couponCode || undefined }),
        signal: controller.signal,
      })
        .then(async (res) => {
          const body = await res.json();
          if (!res.ok) throw new ApiError(body.error ?? 'Erro ao calcular o total.', res.status);
          setQuote(body as Quote);
          setError(undefined);
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          setError(e instanceof Error ? e.message : 'Erro ao calcular o total.');
        })
        .finally(() => !controller.signal.aborted && setLoading(false));
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // `key` captures items/fulfillment/coupon by value; the arrays themselves change identity every render.
  }, [key]);

  return { quote, error, loading };
}

import { useCallback, useEffect, useState } from 'react';
import type { PublicOrder } from '@nazario/shared';
import { api, ApiError } from '@/lib/api';

const FINAL = new Set(['completed', 'cancelled']);

/** Polls the order every 5 s while it's in progress and the tab is visible. */
export function useOrderTracking(token: string | undefined) {
  const [order, setOrder] = useState<PublicOrder>();
  const [error, setError] = useState<{ message: string; status: number }>();

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const next = await api.get<PublicOrder>(`/orders/${token}`, { cache: 'no-store' });
      setOrder(next);
      setError(undefined);
    } catch (e) {
      if (e instanceof ApiError) setError({ message: e.message, status: e.status });
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const done = order ? FINAL.has(order.status) : false;
  useEffect(() => {
    if (!token || done) return;
    let timer: number | undefined;
    const tick = () => {
      timer = window.setTimeout(async () => {
        if (document.visibilityState === 'visible') await refresh();
        tick();
      }, 5000);
    };
    tick();
    const onVisible = () => document.visibilityState === 'visible' && void refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token, done, refresh]);

  return { order, setOrder, error, refresh };
}

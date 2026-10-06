import { useEffect } from 'react';
import { create } from 'zustand';
import type { Order } from '@nazario/shared';
import { toast } from '@/stores/ui';
import { adminApi, useAdminSession } from './session';

interface FeedState {
  orders: Order[];
  loaded: boolean;
  error?: string;
  seen: Set<string>;
  refresh(): Promise<void>;
  upsert(order: Order): void;
}

/** Short "ding" via WebAudio (no asset download). Silently ignored if autoplay is blocked. */
function chime() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.45);
    });
  } catch {
    /* no audio */
  }
}

export const useOrdersFeed = create<FeedState>((set, get) => ({
  orders: [],
  loaded: false,
  seen: new Set(),
  async refresh() {
    try {
      const orders = await adminApi.orders();
      const { seen, loaded } = get();
      const fresh = orders.filter((o) => o.status === 'new' && !seen.has(o.id));
      if (loaded && fresh.length > 0) {
        chime();
        for (const o of fresh) toast({ tone: 'success', title: `Novo pedido #${o.number}`, description: `${o.customer.name} · ${o.items.length} ${o.items.length === 1 ? 'item' : 'itens'}` });
      }
      set({ orders, loaded: true, error: undefined, seen: new Set(orders.map((o) => o.id)) });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Falha ao carregar pedidos' });
    }
  },
  upsert(order) {
    set((s) => ({ orders: s.orders.map((o) => (o.id === order.id ? order : o)) }));
  },
}));

/** Polls every 8 s while the admin is signed in; new orders chime and show in the tab title. */
export function useOrdersPolling() {
  const authed = useAdminSession((s) => s.status === 'authenticated');
  const refresh = useOrdersFeed((s) => s.refresh);
  const newCount = useOrdersFeed((s) => s.orders.filter((o) => o.status === 'new').length);

  useEffect(() => {
    if (!authed) return;
    void refresh();
    const timer = window.setInterval(() => document.visibilityState === 'visible' && void refresh(), 8000);
    return () => window.clearInterval(timer);
  }, [authed, refresh]);

  useEffect(() => {
    const base = 'Painel · Nazário Massas';
    document.title = newCount > 0 ? `(${newCount}) ${base}` : base;
  }, [newCount]);
}

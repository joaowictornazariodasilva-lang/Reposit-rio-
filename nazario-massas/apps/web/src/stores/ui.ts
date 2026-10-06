import { create } from 'zustand';

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone?: 'success' | 'error' | 'neutral';
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface UiState {
  cartOpen: boolean;
  /** Increments on every add-to-cart; the header cart button animates on change. */
  cartPulse: number;
  toasts: Toast[];
  openCart(): void;
  closeCart(): void;
  pulseCart(): void;
  toast(toast: Omit<Toast, 'id'>): number;
  dismiss(id: number): void;
}

let nextId = 1;

export const useUi = create<UiState>((set, get) => ({
  cartOpen: false,
  cartPulse: 0,
  toasts: [],
  // Opening the cart answers any pending "added to cart" toast — clear them so they don't cover the totals.
  openCart: () => set({ cartOpen: true, toasts: [] }),
  closeCart: () => set({ cartOpen: false }),
  pulseCart: () => set((s) => ({ cartPulse: s.cartPulse + 1 })),
  toast(toast) {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id }] }));
    window.setTimeout(() => get().dismiss(id), toast.duration ?? 4200);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (t: Omit<Toast, 'id'>) => useUi.getState().toast(t);

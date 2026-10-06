import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CartLineInput } from '@nazario/shared';

export interface CartLine extends Required<CartLineInput> {
  key: string;
}

/** Same product + size + addons + notes → same line (quantities merge). */
export function lineKey(line: Omit<CartLineInput, 'quantity'>): string {
  return [line.productId, line.variantId, [...(line.addonOptionIds ?? [])].sort().join('+'), (line.notes ?? '').trim().toLowerCase()].join('|');
}

interface CartState {
  lines: CartLine[];
  couponCode: string;
  add(line: CartLineInput): void;
  setQuantity(key: string, quantity: number): void;
  setNotes(key: string, notes: string): void;
  remove(key: string): CartLine | undefined;
  restore(line: CartLine, index: number): void;
  setCoupon(code: string): void;
  clear(): void;
}

const safeStorage = createJSONStorage(() => {
  try {
    const probe = '__nz';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => void memory.set(k, v),
      removeItem: (k: string) => void memory.delete(k),
    };
  }
});

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      couponCode: '',
      add(input) {
        const normalized = { ...input, addonOptionIds: input.addonOptionIds ?? [], notes: (input.notes ?? '').trim() };
        const key = lineKey(normalized);
        set((s) => {
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: s.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, l.quantity + input.quantity) } : l)),
            };
          }
          return { lines: [...s.lines, { ...normalized, key }] };
        });
      },
      setQuantity(key, quantity) {
        set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(20, quantity)) } : l)) }));
      },
      setNotes(key, notes) {
        set((s) => {
          const line = s.lines.find((l) => l.key === key);
          if (!line) return s;
          const nextKey = lineKey({ ...line, notes });
          const clash = s.lines.find((l) => l.key === nextKey && l.key !== key);
          if (clash) {
            return {
              lines: s.lines
                .filter((l) => l.key !== key)
                .map((l) => (l.key === nextKey ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l)),
            };
          }
          return { lines: s.lines.map((l) => (l.key === key ? { ...l, notes: notes.trim(), key: nextKey } : l)) };
        });
      },
      remove(key) {
        const line = get().lines.find((l) => l.key === key);
        set((s) => ({ lines: s.lines.filter((l) => l.key !== key) }));
        return line;
      },
      restore(line, index) {
        set((s) => {
          if (s.lines.some((l) => l.key === line.key)) return s;
          const lines = [...s.lines];
          lines.splice(Math.min(index, lines.length), 0, line);
          return { lines };
        });
      },
      setCoupon(couponCode) {
        set({ couponCode: couponCode.trim().toUpperCase() });
      },
      clear() {
        set({ lines: [], couponCode: '' });
      },
    }),
    { name: 'nazario-cart', version: 1, storage: safeStorage },
  ),
);

export const useCartCount = () => useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));

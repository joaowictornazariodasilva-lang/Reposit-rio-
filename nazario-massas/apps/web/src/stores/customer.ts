import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PaymentMethod } from '@nazario/shared';

export interface SavedCustomer {
  name: string;
  phone: string;
  document: string;
  fulfillment: 'delivery' | 'pickup';
  address: { cep: string; street: string; number: string; complement: string; neighborhood: string; city: string; reference: string };
  paymentMethod: PaymentMethod;
}

interface CustomerState extends SavedCustomer {
  recentOrders: { token: string; number: number; createdAt: string }[];
  save(data: Partial<SavedCustomer>): void;
  rememberOrder(order: { token: string; number: number; createdAt: string }): void;
}

/** Convenience only: lets returning customers skip retyping. Stored on this device. */
export const useCustomer = create<CustomerState>()(
  persist(
    (set) => ({
      name: '',
      phone: '',
      document: '',
      fulfillment: 'delivery',
      address: { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', reference: '' },
      paymentMethod: 'pix',
      recentOrders: [],
      save: (data) => set(data),
      rememberOrder: (order) =>
        set((s) => ({ recentOrders: [order, ...s.recentOrders.filter((o) => o.token !== order.token)].slice(0, 5) })),
    }),
    {
      name: 'nazario-customer',
      version: 1,
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          return sessionStorage;
        }
      }),
    },
  ),
);

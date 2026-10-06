import { create } from 'zustand';
import type { AddonGroup, Catalog, Category, DashboardStats, Order, OrderStatus, PaymentStatus, Product, ProductInput, StoreSettings } from '@nazario/shared';
import { api, ApiError } from '@/lib/api';

interface SessionState {
  status: 'checking' | 'authenticated' | 'anonymous';
  email?: string;
  check(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  expire(): void;
}

/**
 * UI-side session mirror. The real guard is the httpOnly cookie verified by the
 * API on every /api/admin request — this only decides what to render.
 */
export const useAdminSession = create<SessionState>((set) => ({
  status: 'checking',
  async check() {
    try {
      const me = await api.get<{ email: string }>('/admin/me');
      set({ status: 'authenticated', email: me.email });
    } catch {
      set({ status: 'anonymous', email: undefined });
    }
  },
  async login(email, password) {
    const me = await api.post<{ email: string }>('/admin/login', { email, password });
    set({ status: 'authenticated', email: me.email });
  },
  async logout() {
    await api.post('/admin/logout').catch(() => {});
    set({ status: 'anonymous', email: undefined });
  },
  expire: () => set({ status: 'anonymous', email: undefined }),
}));

/** Wraps admin calls: a 401 anywhere sends the user back to the login screen. */
async function call<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) useAdminSession.getState().expire();
    throw error;
  }
}

export const adminApi = {
  orders: (status?: OrderStatus[]) => call(() => api.get<Order[]>(`/admin/orders${status ? `?status=${status.join(',')}` : ''}`)),
  order: (id: string) => call(() => api.get<Order>(`/admin/orders/${id}`)),
  setStatus: (id: string, status: OrderStatus) => call(() => api.patch<Order>(`/admin/orders/${id}/status`, { status })),
  setPayment: (id: string, status: PaymentStatus) => call(() => api.patch<Order>(`/admin/orders/${id}/payment`, { status })),
  stats: () => call(() => api.get<DashboardStats>('/admin/stats')),
  catalog: () => call(() => api.get<Catalog>('/admin/catalog')),
  createProduct: (input: ProductInput) => call(() => api.post<Product>('/admin/products', input as unknown as Record<string, unknown>)),
  updateProduct: (id: string, patch: Partial<ProductInput>) => call(() => api.patch<Product>(`/admin/products/${id}`, patch as Record<string, unknown>)),
  deleteProduct: (id: string) => call(() => api.delete(`/admin/products/${id}`)),
  saveCategory: (c: Category) => call(() => api.put<Category>(`/admin/categories/${c.id}`, c as unknown as Record<string, unknown>)),
  saveAddonGroup: (g: AddonGroup) => call(() => api.put<AddonGroup>(`/admin/addon-groups/${g.id}`, g as unknown as Record<string, unknown>)),
  deleteAddonGroup: (id: string) => call(() => api.delete(`/admin/addon-groups/${id}`)),
  saveSettings: (s: StoreSettings) => call(() => api.put<StoreSettings>('/admin/settings', s as unknown as Record<string, unknown>)),
  upload: (file: File) => {
    const body = new FormData();
    body.append('file', file);
    return call(() => api.post<{ url: string }>('/admin/uploads', body));
  },
};

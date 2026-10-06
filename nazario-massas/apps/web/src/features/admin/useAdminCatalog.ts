import { create } from 'zustand';
import type { Catalog } from '@nazario/shared';
import { useCatalog } from '@/stores/catalog';
import { adminApi } from './session';

interface AdminCatalogState {
  data?: Catalog;
  error?: string;
  load(): Promise<void>;
  set(update: (c: Catalog) => Catalog): void;
}

/** Full catalog (including inactive items and coupons). Mutations also refresh the storefront cache. */
export const useAdminCatalog = create<AdminCatalogState>((set, get) => ({
  async load() {
    try {
      set({ data: await adminApi.catalog(), error: undefined });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Erro ao carregar o cardápio' });
    }
  },
  set(update) {
    const data = get().data;
    if (!data) return;
    set({ data: update(data) });
    void useCatalog.getState().load(true);
  },
}));

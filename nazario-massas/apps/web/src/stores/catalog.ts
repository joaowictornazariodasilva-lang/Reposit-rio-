import { create } from 'zustand';
import type { AddonGroup, Product, PublicCatalog } from '@nazario/shared';
import { api, ApiError } from '@/lib/api';

interface CatalogState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data?: PublicCatalog;
  error?: string;
  productsById: Map<string, Product>;
  groupsById: Map<string, AddonGroup>;
  load(force?: boolean): Promise<void>;
}

let inflight: Promise<void> | undefined;

export const useCatalog = create<CatalogState>((set, get) => ({
  status: 'idle',
  productsById: new Map(),
  groupsById: new Map(),
  load(force = false) {
    if (!force && (get().status === 'ready' || inflight)) return inflight ?? Promise.resolve();
    if (get().status !== 'ready') set({ status: 'loading', error: undefined });
    inflight = api
      .get<PublicCatalog>('/catalog')
      .then((data) =>
        set({
          status: 'ready',
          data,
          productsById: new Map(data.products.map((p) => [p.id, p])),
          groupsById: new Map(data.addonGroups.map((g) => [g.id, g])),
        }),
      )
      .catch((error: unknown) => {
        if (get().status !== 'ready') {
          set({ status: 'error', error: error instanceof ApiError ? error.message : 'Não foi possível carregar o cardápio.' });
        }
      })
      .finally(() => {
        inflight = undefined;
      });
    return inflight;
  },
}));

/** Starts loading immediately at module import — the menu request races the JS chunks. */
void useCatalog.getState().load();

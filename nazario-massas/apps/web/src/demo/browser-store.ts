import type { AddonGroup, Category, Order, Product, StoreSettings } from '@nazario/shared';
import { seedAddonGroups, seedCategories, seedProducts, seedSettings } from '../../../api/src/data/seed';
import type { CatalogRepository, OrderFilter, OrderRepository, Repositories } from '../../../api/src/repositories/types';

interface Database {
  version: 1;
  categories: Category[];
  products: Product[];
  addonGroups: AddonGroup[];
  settings: StoreSettings;
  orders: Order[];
  lastOrderNumber: number;
}

const KEY = 'nazario-demo-db-v2';
const clone = <T>(v: T): T => structuredClone(v);

function fresh(): Database {
  return {
    version: 1,
    categories: clone(seedCategories),
    products: clone(seedProducts),
    addonGroups: clone(seedAddonGroups),
    settings: clone(seedSettings),
    orders: [],
    lastOrderNumber: 1040,
  };
}

/**
 * Demo persistence: the same repository contracts as the API's JsonStore,
 * kept in this browser's localStorage (falls back to memory if blocked).
 */
export class BrowserStore implements CatalogRepository, OrderRepository {
  db: Database;
  isNew = false;

  constructor() {
    let stored: Database | undefined;
    try {
      const raw = localStorage.getItem(KEY);
      stored = raw ? (JSON.parse(raw) as Database) : undefined;
    } catch {
      stored = undefined;
    }
    this.isNew = !stored;
    this.db = stored ?? fresh();
  }

  get repositories(): Repositories {
    return { catalog: this, orders: this };
  }

  persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.db));
    } catch {
      /* storage blocked: keep in memory */
    }
  }

  static reset() {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem('nazario-cart');
      localStorage.removeItem('nazario-customer');
      sessionStorage.removeItem('nazario-demo-admin');
    } catch {
      /* ignore */
    }
  }

  async listCategories() {
    return clone([...this.db.categories].sort((a, b) => a.sortOrder - b.sortOrder));
  }
  async saveCategory(category: Category) {
    const i = this.db.categories.findIndex((c) => c.id === category.id);
    if (i === -1) this.db.categories.push(clone(category));
    else this.db.categories[i] = clone(category);
    this.persist();
    return clone(category);
  }
  async listProducts() {
    return clone([...this.db.products].sort((a, b) => a.sortOrder - b.sortOrder));
  }
  async getProduct(id: string) {
    const p = this.db.products.find((x) => x.id === id);
    return p && clone(p);
  }
  async createProduct(product: Product) {
    this.db.products.push(clone(product));
    this.persist();
    return clone(product);
  }
  async updateProduct(id: string, patch: Partial<Product>) {
    const i = this.db.products.findIndex((p) => p.id === id);
    const current = this.db.products[i];
    if (!current) return undefined;
    this.db.products[i] = { ...current, ...clone(patch), id };
    this.persist();
    return clone(this.db.products[i]!);
  }
  async deleteProduct(id: string) {
    const before = this.db.products.length;
    this.db.products = this.db.products.filter((p) => p.id !== id);
    this.persist();
    return before !== this.db.products.length;
  }
  async listAddonGroups() {
    return clone(this.db.addonGroups);
  }
  async saveAddonGroup(group: AddonGroup) {
    const i = this.db.addonGroups.findIndex((g) => g.id === group.id);
    if (i === -1) this.db.addonGroups.push(clone(group));
    else this.db.addonGroups[i] = clone(group);
    this.persist();
    return clone(group);
  }
  async deleteAddonGroup(id: string) {
    const before = this.db.addonGroups.length;
    this.db.addonGroups = this.db.addonGroups.filter((g) => g.id !== id);
    for (const p of this.db.products) p.addonGroupIds = p.addonGroupIds.filter((g) => g !== id);
    this.persist();
    return before !== this.db.addonGroups.length;
  }
  async getSettings() {
    return clone(this.db.settings);
  }
  async saveSettings(settings: StoreSettings) {
    this.db.settings = clone(settings);
    this.persist();
    return clone(settings);
  }

  async nextOrderNumber() {
    this.db.lastOrderNumber += 1;
    return this.db.lastOrderNumber;
  }
  async createOrder(order: Order) {
    this.db.orders.push(clone(order));
    this.persist();
    return clone(order);
  }
  async getOrder(id: string) {
    const o = this.db.orders.find((x) => x.id === id);
    return o && clone(o);
  }
  async getOrderByToken(token: string) {
    const o = this.db.orders.find((x) => x.accessToken === token);
    return o && clone(o);
  }
  async getOrderByChargeId(chargeId: string) {
    const o = this.db.orders.find((x) => x.payment.providerChargeId === chargeId);
    return o && clone(o);
  }
  async listOrders(filter: OrderFilter = {}) {
    return clone(
      this.db.orders
        .filter((o) => !filter.status || filter.status.includes(o.status))
        .filter((o) => !filter.since || o.createdAt >= filter.since)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }
  async updateOrder(id: string, update: (order: Order) => Order) {
    const i = this.db.orders.findIndex((o) => o.id === id);
    const current = this.db.orders[i];
    if (!current) return undefined;
    const next = update(clone(current));
    next.updatedAt = new Date().toISOString();
    this.db.orders[i] = next;
    this.persist();
    return clone(next);
  }
}

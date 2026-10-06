import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { AddonGroup, Category, Order, Product, StoreSettings } from '@nazario/shared';
import { seedAddonGroups, seedCategories, seedProducts, seedSettings } from '../data/seed';
import type { CatalogRepository, OrderFilter, OrderRepository, Repositories } from './types';

interface Database {
  version: 1;
  categories: Category[];
  products: Product[];
  addonGroups: AddonGroup[];
  settings: StoreSettings;
  orders: Order[];
  lastOrderNumber: number;
}

const clone = <T>(value: T): T => structuredClone(value);

/**
 * Single-file JSON database for development and small single-instance
 * deployments. Writes are serialized and atomic (write temp file → rename).
 */
export class JsonStore implements CatalogRepository, OrderRepository {
  private db!: Database;
  private writeChain: Promise<void> = Promise.resolve();

  private constructor(private readonly file: string) {}

  static async open(file: string): Promise<JsonStore> {
    const store = new JsonStore(file);
    try {
      store.db = JSON.parse(await readFile(file, 'utf8')) as Database;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      store.db = {
        version: 1,
        categories: clone(seedCategories),
        products: clone(seedProducts),
        addonGroups: clone(seedAddonGroups),
        settings: clone(seedSettings),
        orders: [],
        lastOrderNumber: 1040,
      };
      await store.persist();
    }
    return store;
  }

  get repositories(): Repositories {
    return { catalog: this, orders: this };
  }

  private persist(): Promise<void> {
    const snapshot = JSON.stringify(this.db);
    this.writeChain = this.writeChain.then(async () => {
      await mkdir(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await writeFile(tmp, snapshot);
      await rename(tmp, this.file);
    });
    return this.writeChain;
  }

  /* ─── Catalog ─── */

  async listCategories() {
    return clone([...this.db.categories].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  async saveCategory(category: Category) {
    const index = this.db.categories.findIndex((c) => c.id === category.id);
    if (index === -1) this.db.categories.push(clone(category));
    else this.db.categories[index] = clone(category);
    await this.persist();
    return clone(category);
  }

  async listProducts() {
    return clone([...this.db.products].sort((a, b) => a.sortOrder - b.sortOrder));
  }

  async getProduct(id: string) {
    const product = this.db.products.find((p) => p.id === id);
    return product && clone(product);
  }

  async createProduct(product: Product) {
    this.db.products.push(clone(product));
    await this.persist();
    return clone(product);
  }

  async updateProduct(id: string, patch: Partial<Product>) {
    const index = this.db.products.findIndex((p) => p.id === id);
    const current = this.db.products[index];
    if (!current) return undefined;
    const next = { ...current, ...clone(patch), id };
    this.db.products[index] = next;
    await this.persist();
    return clone(next);
  }

  async deleteProduct(id: string) {
    const before = this.db.products.length;
    this.db.products = this.db.products.filter((p) => p.id !== id);
    if (this.db.products.length === before) return false;
    await this.persist();
    return true;
  }

  async listAddonGroups() {
    return clone(this.db.addonGroups);
  }

  async saveAddonGroup(group: AddonGroup) {
    const index = this.db.addonGroups.findIndex((g) => g.id === group.id);
    if (index === -1) this.db.addonGroups.push(clone(group));
    else this.db.addonGroups[index] = clone(group);
    await this.persist();
    return clone(group);
  }

  async deleteAddonGroup(id: string) {
    const before = this.db.addonGroups.length;
    this.db.addonGroups = this.db.addonGroups.filter((g) => g.id !== id);
    if (before === this.db.addonGroups.length) return false;
    for (const product of this.db.products) {
      product.addonGroupIds = product.addonGroupIds.filter((g) => g !== id);
    }
    await this.persist();
    return true;
  }

  async getSettings() {
    return clone(this.db.settings);
  }

  async saveSettings(settings: StoreSettings) {
    this.db.settings = clone(settings);
    await this.persist();
    return clone(settings);
  }

  /* ─── Orders ─── */

  async nextOrderNumber() {
    this.db.lastOrderNumber += 1;
    return this.db.lastOrderNumber;
  }

  async createOrder(order: Order) {
    this.db.orders.push(clone(order));
    await this.persist();
    return clone(order);
  }

  async getOrder(id: string) {
    const order = this.db.orders.find((o) => o.id === id);
    return order && clone(order);
  }

  async getOrderByToken(token: string) {
    const order = this.db.orders.find((o) => o.accessToken === token);
    return order && clone(order);
  }

  async getOrderByChargeId(chargeId: string) {
    const order = this.db.orders.find((o) => o.payment.providerChargeId === chargeId);
    return order && clone(order);
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
    const index = this.db.orders.findIndex((o) => o.id === id);
    const current = this.db.orders[index];
    if (!current) return undefined;
    const next = update(clone(current));
    next.updatedAt = new Date().toISOString();
    this.db.orders[index] = next;
    await this.persist();
    return clone(next);
  }
}

import type { AddonGroup, Category, Order, OrderStatus, Product, StoreSettings } from '@nazario/shared';

/**
 * Persistence contracts. `JsonStore` implements them for local/demo use;
 * a Supabase/PostgreSQL implementation only needs to satisfy these
 * interfaces (see supabase/schema.sql) — routes never touch storage directly.
 */
export interface CatalogRepository {
  listCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<Category>;

  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: Product): Promise<Product>;
  updateProduct(id: string, patch: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  listAddonGroups(): Promise<AddonGroup[]>;
  saveAddonGroup(group: AddonGroup): Promise<AddonGroup>;
  deleteAddonGroup(id: string): Promise<boolean>;

  getSettings(): Promise<StoreSettings>;
  saveSettings(settings: StoreSettings): Promise<StoreSettings>;
}

export interface OrderFilter {
  status?: OrderStatus[];
  since?: string;
}

export interface OrderRepository {
  nextOrderNumber(): Promise<number>;
  createOrder(order: Order): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByToken(token: string): Promise<Order | undefined>;
  getOrderByChargeId(chargeId: string): Promise<Order | undefined>;
  listOrders(filter?: OrderFilter): Promise<Order[]>;
  updateOrder(id: string, update: (order: Order) => Order): Promise<Order | undefined>;
}

export type Repositories = { catalog: CatalogRepository; orders: OrderRepository };

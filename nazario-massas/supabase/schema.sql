-- Nazário Massas — PostgreSQL / Supabase schema
-- Mirrors packages/shared/src/schemas.ts. Implement CatalogRepository and
-- OrderRepository (apps/api/src/repositories/types.ts) against these tables
-- using the service-role key ON THE SERVER ONLY.

create extension if not exists "pgcrypto";

create table categories (
  id          text primary key check (id in ('pizzas', 'massas', 'bebidas')),
  name        text not null,
  tagline     text not null default '',
  description text not null default '',
  sort_order  int  not null default 0,
  active      boolean not null default true
);

create table addon_groups (
  id          text primary key,
  name        text not null,
  description text,
  min_select  int not null default 0,
  max_select  int not null default 1 check (max_select >= min_select)
);

create table addon_options (
  id        text primary key,
  group_id  text not null references addon_groups(id) on delete cascade,
  name      text not null,
  price     int  not null check (price >= 0),          -- cents
  active    boolean not null default true
);

create table products (
  id                text primary key,
  slug              text not null unique,
  category_id       text not null references categories(id),
  name              text not null,
  short_description text not null,
  description       text not null default '',
  ingredients       text[] not null default '{}',
  image             text,
  image_alt         text,
  badges            text[] not null default '{}',
  featured          boolean not null default false,
  active            boolean not null default true,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table product_variants (
  id          text not null,
  product_id  text not null references products(id) on delete cascade,
  label       text not null,
  detail      text,
  price       int not null check (price >= 0),          -- cents
  sort_order  int not null default 0,
  primary key (product_id, id)
);

create table product_addon_groups (
  product_id text not null references products(id) on delete cascade,
  group_id   text not null references addon_groups(id) on delete cascade,
  primary key (product_id, group_id)
);

create table store_settings (
  id                  boolean primary key default true check (id), -- single row
  store_name          text not null,
  phone               text not null,
  whatsapp            text not null,
  address             text not null,
  hours               text not null,
  is_open             boolean not null default true,
  delivery_fee        int not null,
  free_delivery_from  int not null,
  min_order           int not null,
  delivery_estimate   text not null,
  pickup_estimate     text not null
);

create table coupons (
  code          text primary key,
  kind          text not null check (kind in ('percent', 'fixed')),
  value         int  not null check (value > 0),
  min_subtotal  int  not null default 0,
  active        boolean not null default true,
  description   text not null default ''
);

create sequence order_number_seq start 1041;

create table customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null unique,
  document   text,
  created_at timestamptz not null default now()
);

create table orders (
  id                  uuid primary key default gen_random_uuid(),
  number              int  not null unique default nextval('order_number_seq'),
  access_token        text not null unique,
  customer_id         uuid references customers(id),
  customer_name       text not null,
  customer_phone      text not null,
  fulfillment_type    text not null check (fulfillment_type in ('delivery', 'pickup')),
  address             jsonb,                               -- Address when delivery
  subtotal            int not null,
  delivery_fee        int not null,
  discount            int not null default 0,
  coupon_code         text references coupons(code),
  total               int not null,
  payment_method      text not null check (payment_method in ('pix', 'card', 'cash')),
  payment_status      text not null check (payment_status in ('awaiting_payment', 'paid', 'pay_on_delivery', 'failed', 'refunded')),
  payment_provider    text not null,
  provider_charge_id  text unique,
  pix                 jsonb,
  change_for          int,
  paid_at             timestamptz,
  status              text not null check (status in ('new', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index orders_status_idx on orders (status, created_at desc);
create index orders_created_idx on orders (created_at desc);

create table order_items (
  id            bigserial primary key,
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    text not null,          -- snapshot: product may change/be deleted later
  product_name  text not null,
  category_id   text not null,
  variant_id    text not null,
  variant_label text not null,
  unit_price    int not null,
  quantity      int not null check (quantity > 0),
  addons        jsonb not null default '[]',
  notes         text not null default '',
  line_total    int not null
);

create table order_status_history (
  id        bigserial primary key,
  order_id  uuid not null references orders(id) on delete cascade,
  status    text not null,
  at        timestamptz not null default now()
);

-- Row Level Security: the storefront never talks to these tables directly.
-- All reads/writes go through the API with the service role, which bypasses RLS.
alter table categories           enable row level security;
alter table addon_groups         enable row level security;
alter table addon_options        enable row level security;
alter table products             enable row level security;
alter table product_variants     enable row level security;
alter table product_addon_groups enable row level security;
alter table store_settings       enable row level security;
alter table coupons              enable row level security;
alter table customers            enable row level security;
alter table orders               enable row level security;
alter table order_items          enable row level security;
alter table order_status_history enable row level security;

-- Optional: allow anonymous read of the public menu if you later query it from the edge.
create policy "public menu" on products for select using (active);
create policy "public variants" on product_variants for select using (true);
create policy "public categories" on categories for select using (active);

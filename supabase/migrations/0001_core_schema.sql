-- =====================================================================
-- BITO ERP — Core Schema (Migration 0001)
-- Branches, roles/users, menu, inventory, recipes
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
create type user_role as enum ('owner', 'admin', 'manager', 'cashier', 'kitchen');
create type order_type as enum ('dine_in', 'take_away', 'delivery');
create type order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');
create type payment_method as enum ('cash', 'card', 'wallet', 'bank_transfer', 'split');
create type payment_status as enum ('unpaid', 'partial', 'paid', 'refunded', 'partial_refund');
create type stock_movement_type as enum ('in', 'out', 'adjustment', 'waste', 'transfer');
create type purchase_status as enum ('draft', 'ordered', 'partially_received', 'received', 'cancelled');
create type notification_type as enum ('low_stock', 'new_purchase', 'large_sale', 'daily_closing', 'monthly_closing', 'expiry', 'system');

-- ---------------------------------------------------------------------
-- BRANCHES
-- ---------------------------------------------------------------------
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  address text,
  city text,
  phone text,
  email text,
  timezone text not null default 'Asia/Karachi',
  currency text not null default 'PKR',
  tax_rate numeric(5,2) not null default 0,
  service_charge_rate numeric(5,2) not null default 0,
  business_hours jsonb default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- USERS (extends auth.users) + ROLES + PERMISSIONS
-- ---------------------------------------------------------------------
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  role user_role not null default 'cashier',
  avatar_url text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,          -- e.g. 'pos.void_order'
  description text not null,
  module text not null                -- e.g. 'pos', 'inventory', 'reports'
);

create table role_permissions (
  role user_role not null,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role, permission_id)
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  employee_code text unique not null,
  designation text,
  salary numeric(12,2),
  hired_at date,
  emergency_contact text,
  cnic text,
  address text,
  created_at timestamptz not null default now()
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  check_in timestamptz not null,
  check_out timestamptz,
  status text not null default 'present', -- present, absent, leave, late
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MENU: categories, products, variants, addons, combos
-- ---------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  sku text unique,
  barcode text,
  image_url text,
  base_price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  is_active boolean not null default true,
  track_inventory boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,           -- e.g. 'Small', 'Medium', 'Large'
  price_delta numeric(12,2) not null default 0,
  cost_delta numeric(12,2) not null default 0,
  is_default boolean not null default false,
  sort_order int not null default 0
);

create table addons (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null default 0,
  is_active boolean not null default true
);

create table product_addons (
  product_id uuid not null references products(id) on delete cascade,
  addon_id uuid not null references addons(id) on delete cascade,
  primary key (product_id, addon_id)
);

create table modifiers (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,             -- e.g. 'Spice Level'
  is_required boolean not null default false,
  min_select int not null default 0,
  max_select int not null default 1
);

create table modifier_options (
  id uuid primary key default gen_random_uuid(),
  modifier_id uuid not null references modifiers(id) on delete cascade,
  name text not null,             -- e.g. 'Mild', 'Medium', 'Hot'
  price_delta numeric(12,2) not null default 0,
  sort_order int not null default 0
);

create table product_modifiers (
  product_id uuid not null references products(id) on delete cascade,
  modifier_id uuid not null references modifiers(id) on delete cascade,
  primary key (product_id, modifier_id)
);

create table combo_deals (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null,
  is_active boolean not null default true,
  starts_at date,
  ends_at date
);

create table combo_items (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid not null references combo_deals(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity int not null default 1
);

create table happy_hour_pricing (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  discount_percent numeric(5,2) not null default 0,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------
-- INVENTORY: ingredients, recipes, stock, logs
-- ---------------------------------------------------------------------
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  name text not null,
  unit text not null,             -- kg, litre, piece, gram, ml
  reorder_level numeric(12,3) not null default 0,
  cost_per_unit numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity_required numeric(12,3) not null,   -- per single unit of product
  unique (product_id, ingredient_id)
);

create table inventory_stock (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity_on_hand numeric(14,3) not null default 0,
  batch_number text,
  expiry_date date,
  updated_at timestamptz not null default now(),
  unique (branch_id, ingredient_id, batch_number)
);

create table inventory_logs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  movement_type stock_movement_type not null,
  quantity numeric(14,3) not null,      -- positive number; sign implied by movement_type
  reference_type text,                  -- 'sale', 'purchase', 'manual', 'waste'
  reference_id uuid,
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table inventory_audits (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  counted_quantity numeric(14,3) not null,
  system_quantity numeric(14,3) not null,
  variance numeric(14,3) generated always as (counted_quantity - system_quantity) stored,
  audited_by uuid references users(id) on delete set null,
  audited_at timestamptz not null default now(),
  notes text
);

create index idx_inventory_stock_branch on inventory_stock(branch_id);
create index idx_inventory_logs_branch_ingredient on inventory_logs(branch_id, ingredient_id);
create index idx_products_branch_category on products(branch_id, category_id);
create index idx_recipes_product on recipes(product_id);

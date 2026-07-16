-- =====================================================================
-- BITO ERP — Sales, Purchasing, Customers, Expenses, Ops (Migration 0002)
-- =====================================================================

-- ---------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------
create table customers (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  full_name text not null,
  phone text unique,
  email text,
  address text,
  loyalty_points int not null default 0,
  total_spent numeric(14,2) not null default 0,
  visit_count int not null default 0,
  last_visit_at timestamptz,
  created_at timestamptz not null default now()
);

create table loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  sale_id uuid,
  points int not null,             -- positive = earned, negative = redeemed
  reason text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- SALES / POS
-- ---------------------------------------------------------------------
create table sales (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  order_number text not null,
  customer_id uuid references customers(id) on delete set null,
  cashier_id uuid references users(id) on delete set null,
  order_type order_type not null default 'dine_in',
  table_number text,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  payment_method payment_method,
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  service_charge_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  amount_paid numeric(14,2) not null default 0,
  change_due numeric(14,2) not null default 0,
  notes text,
  is_held boolean not null default false,
  voided_at timestamptz,
  voided_by uuid references users(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, order_number)
);

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  variant_id uuid references product_variants(id) on delete set null,
  combo_id uuid references combo_deals(id) on delete set null,
  product_name text not null,          -- snapshot at time of sale
  quantity int not null default 1,
  unit_price numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  line_total numeric(14,2) not null,
  notes text,
  addons jsonb default '[]'::jsonb,     -- [{id, name, price}]
  modifiers jsonb default '[]'::jsonb   -- [{id, name, price_delta}]
);

create table sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  method payment_method not null,
  amount numeric(14,2) not null,
  reference text,
  created_at timestamptz not null default now()
);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  sale_item_id uuid references sale_items(id) on delete set null,
  amount numeric(14,2) not null,
  reason text,
  processed_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- SUPPLIERS & PURCHASING
-- ---------------------------------------------------------------------
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  payment_terms text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  po_number text not null,
  status purchase_status not null default 'draft',
  order_date date not null default current_date,
  expected_date date,
  subtotal numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (branch_id, po_number)
);

create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  quantity_ordered numeric(14,3) not null,
  quantity_received numeric(14,3) not null default 0,
  unit_cost numeric(12,2) not null,
  line_total numeric(14,2) not null
);

create table goods_received (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  received_by uuid references users(id) on delete set null,
  received_at timestamptz not null default now(),
  notes text
);

create table purchase_returns (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  quantity numeric(14,3) not null,
  reason text,
  created_at timestamptz not null default now()
);

create table supplier_payments (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  amount numeric(14,2) not null,
  method payment_method not null,
  status payment_status not null default 'paid',
  paid_at timestamptz not null default now(),
  reference text
);

-- ---------------------------------------------------------------------
-- EXPENSES
-- ---------------------------------------------------------------------
create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null           -- Electricity, Gas, Rent, Salary, Internet, Marketing, Misc
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete cascade,
  category_id uuid not null references expense_categories(id) on delete restrict,
  description text,
  amount numeric(14,2) not null,
  expense_date date not null default current_date,
  payment_method payment_method,
  receipt_url text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ACTIVITY LOGS & NOTIFICATIONS & SETTINGS
-- ---------------------------------------------------------------------
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  action text not null,               -- 'sale.create', 'inventory.adjust', etc.
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table settings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid unique references branches(id) on delete cascade,
  restaurant_name text not null default 'BITO',
  logo_url text,
  receipt_template jsonb default '{}'::jsonb,
  currency text not null default 'PKR',
  tax_rate numeric(5,2) not null default 0,
  business_hours jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index idx_sales_branch_created on sales(branch_id, created_at desc);
create index idx_sale_items_sale on sale_items(sale_id);
create index idx_purchase_orders_branch on purchase_orders(branch_id, status);
create index idx_expenses_branch_date on expenses(branch_id, expense_date desc);
create index idx_activity_logs_branch_created on activity_logs(branch_id, created_at desc);
create index idx_notifications_user_unread on notifications(user_id, is_read);
create index idx_customers_phone on customers(phone);

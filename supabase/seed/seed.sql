-- =====================================================================
-- BITO ERP — Seed Data
-- Run after migrations. Creates one branch with a realistic menu,
-- ingredients, recipes and reference data. Auth users are created
-- separately via Supabase Auth (see README "Seeding auth users").
-- =====================================================================

insert into branches (id, name, code, address, city, phone, email, tax_rate, service_charge_rate)
values ('00000000-0000-0000-0000-000000000001', 'BITO — Gulberg', 'GLB', 'MM Alam Road, Gulberg III', 'Lahore', '+92 42 111 000 111', 'gulberg@bito.pk', 16, 5)
on conflict (id) do nothing;

insert into expense_categories (name) values
  ('Electricity'), ('Gas'), ('Rent'), ('Salary'), ('Internet'), ('Marketing'), ('Miscellaneous')
on conflict (name) do nothing;

insert into permissions (code, description, module) values
  ('pos.access', 'Access POS terminal', 'pos'),
  ('pos.void_order', 'Void an order', 'pos'),
  ('pos.refund', 'Process refunds', 'pos'),
  ('inventory.manage', 'Add/adjust inventory', 'inventory'),
  ('purchasing.manage', 'Create purchase orders', 'purchasing'),
  ('reports.view', 'View reports', 'reports'),
  ('settings.manage', 'Modify restaurant settings', 'settings'),
  ('employees.manage', 'Manage employees', 'employees'),
  ('kitchen.view', 'View kitchen display', 'kitchen')
on conflict (code) do nothing;

insert into role_permissions (role, permission_id)
select 'owner', id from permissions
on conflict do nothing;
insert into role_permissions (role, permission_id)
select 'admin', id from permissions where code != 'settings.manage'
on conflict do nothing;
insert into role_permissions (role, permission_id)
select 'manager', id from permissions where code in
  ('pos.access', 'pos.void_order', 'inventory.manage', 'purchasing.manage', 'reports.view', 'employees.manage')
on conflict do nothing;
insert into role_permissions (role, permission_id)
select 'cashier', id from permissions where code in ('pos.access')
on conflict do nothing;
insert into role_permissions (role, permission_id)
select 'kitchen', id from permissions where code in ('kitchen.view')
on conflict do nothing;

-- Categories
insert into categories (id, branch_id, name, sort_order) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Burgers', 1),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Fried Chicken', 2),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Beverages', 3),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Sides', 4)
on conflict (id) do nothing;

-- Ingredients
insert into ingredients (id, branch_id, name, unit, reorder_level, cost_per_unit) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Chicken Patty', 'piece', 20, 120),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Burger Bun', 'piece', 30, 25),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Cheddar Cheese Slice', 'piece', 40, 15),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Chicken Wing', 'piece', 50, 45),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Cola Syrup', 'litre', 5, 350),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Potato (Fries Cut)', 'kg', 10, 90)
on conflict (id) do nothing;

insert into inventory_stock (branch_id, ingredient_id, quantity_on_hand) values
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 150),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 200),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 300),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 400),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', 40),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', 80)
on conflict (branch_id, ingredient_id, batch_number) do nothing;

-- Products
insert into products (id, branch_id, category_id, name, description, base_price, cost_price, tax_rate, sku) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'BITO Zinger Burger', 'Crispy chicken fillet, cheese, house sauce', 650, 220, 16, 'BRG-001'),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Fried Chicken Wings (6pc)', 'Golden fried wings tossed in signature spice', 750, 270, 16, 'FCH-001'),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Cola (Regular)', 'Ice-cold cola', 150, 35, 16, 'BEV-001'),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Regular Fries', 'Crispy golden fries, salted', 280, 90, 16, 'SID-001')
on conflict (id) do nothing;

-- Recipes (auto stock-deduction depends on these)
insert into recipes (product_id, ingredient_id, quantity_required) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1),
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 1),
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 1),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', 6),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 0.25),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000006', 0.2)
on conflict (product_id, ingredient_id) do nothing;

-- Suppliers
insert into suppliers (id, branch_id, name, contact_person, phone, payment_terms) values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Metro Poultry Suppliers', 'Bilal Ahmed', '+92 300 1234567', 'Net 15'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Lahore Fresh Produce Co.', 'Sana Tariq', '+92 321 7654321', 'Net 7')
on conflict (id) do nothing;

-- Customers
insert into customers (id, branch_id, full_name, phone, loyalty_points, total_spent, visit_count) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ahmed Raza', '+92 300 1112233', 45, 4500, 6),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Fatima Khan', '+92 333 4445566', 120, 12000, 14)
on conflict (id) do nothing;

-- Settings
insert into settings (branch_id, restaurant_name, currency, tax_rate)
values ('00000000-0000-0000-0000-000000000001', 'BITO', 'PKR', 16)
on conflict (branch_id) do nothing;

-- NOTE: auth users (owner/admin/manager/cashier/kitchen logins) must be created
-- via Supabase Auth (supabase.auth.admin.createUser or the dashboard), because
-- auth.users cannot be seeded with plain SQL inserts (passwords are hashed by
-- GoTrue). See README.md → "Seeding demo logins" for a ready-to-run script.

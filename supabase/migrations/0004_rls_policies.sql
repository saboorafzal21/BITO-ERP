-- =====================================================================
-- BITO ERP — Row Level Security (Migration 0004)
-- Model: Owner/Admin see everything. Manager/Cashier/Kitchen are scoped
-- to their own branch. Writes are additionally gated by role per table.
-- =====================================================================

-- Helper functions, run as SECURITY DEFINER so they can read `users`
-- regardless of the calling role's own RLS.
create or replace function current_user_role()
returns user_role language sql stable security definer as $$
  select role from users where id = auth.uid();
$$;

create or replace function current_user_branch()
returns uuid language sql stable security definer as $$
  select branch_id from users where id = auth.uid();
$$;

create or replace function is_owner_or_admin()
returns boolean language sql stable security definer as $$
  select current_user_role() in ('owner', 'admin');
$$;

-- Enable RLS everywhere
alter table branches enable row level security;
alter table users enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table employees enable row level security;
alter table attendance enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table addons enable row level security;
alter table product_addons enable row level security;
alter table modifiers enable row level security;
alter table modifier_options enable row level security;
alter table product_modifiers enable row level security;
alter table combo_deals enable row level security;
alter table combo_items enable row level security;
alter table happy_hour_pricing enable row level security;
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table inventory_stock enable row level security;
alter table inventory_logs enable row level security;
alter table inventory_audits enable row level security;
alter table customers enable row level security;
alter table loyalty_transactions enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table sale_payments enable row level security;
alter table refunds enable row level security;
alter table suppliers enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_items enable row level security;
alter table goods_received enable row level security;
alter table purchase_returns enable row level security;
alter table supplier_payments enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;
alter table activity_logs enable row level security;
alter table notifications enable row level security;
alter table settings enable row level security;

-- ---------------------------------------------------------------------
-- BRANCHES: everyone can read their own branch; only owner/admin write
-- ---------------------------------------------------------------------
create policy branches_select on branches for select
  using (is_owner_or_admin() or id = current_user_branch());
create policy branches_write on branches for all
  using (is_owner_or_admin()) with check (is_owner_or_admin());

-- ---------------------------------------------------------------------
-- USERS: users see themselves + owner/admin see all + managers see own branch
-- ---------------------------------------------------------------------
create policy users_select on users for select
  using (
    id = auth.uid()
    or is_owner_or_admin()
    or (current_user_role() = 'manager' and branch_id = current_user_branch())
  );
create policy users_update_self on users for update
  using (id = auth.uid() or is_owner_or_admin());
create policy users_insert on users for insert
  with check (is_owner_or_admin());
create policy users_delete on users for delete
  using (is_owner_or_admin());

-- ---------------------------------------------------------------------
-- PERMISSIONS / ROLE_PERMISSIONS: read-only reference data, owner-managed
-- ---------------------------------------------------------------------
create policy permissions_select on permissions for select using (true);
create policy permissions_write on permissions for all
  using (current_user_role() = 'owner') with check (current_user_role() = 'owner');
create policy role_permissions_select on role_permissions for select using (true);
create policy role_permissions_write on role_permissions for all
  using (current_user_role() = 'owner') with check (current_user_role() = 'owner');

-- ---------------------------------------------------------------------
-- EMPLOYEES / ATTENDANCE: branch scoped, manager+ can write
-- ---------------------------------------------------------------------
create policy employees_select on employees for select
  using (is_owner_or_admin() or branch_id = current_user_branch());
create policy employees_write on employees for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or (current_user_role() = 'manager' and branch_id = current_user_branch()));

create policy attendance_select on attendance for select
  using (is_owner_or_admin() or branch_id = current_user_branch());
create policy attendance_write on attendance for all
  using (is_owner_or_admin() or current_user_role() in ('manager', 'cashier'))
  with check (is_owner_or_admin() or branch_id = current_user_branch());

-- ---------------------------------------------------------------------
-- MENU DATA: readable branch-wide (kitchen/cashier need it for POS/KDS);
-- writes restricted to manager and above
-- ---------------------------------------------------------------------
create policy categories_select on categories for select
  using (is_owner_or_admin() or branch_id = current_user_branch() or branch_id is null);
create policy categories_write on categories for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy products_select on products for select
  using (is_owner_or_admin() or branch_id = current_user_branch() or branch_id is null);
create policy products_write on products for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy product_variants_select on product_variants for select using (true);
create policy product_variants_write on product_variants for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy addons_select on addons for select using (true);
create policy addons_write on addons for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy product_addons_select on product_addons for select using (true);
create policy product_addons_write on product_addons for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy modifiers_select on modifiers for select using (true);
create policy modifiers_write on modifiers for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy modifier_options_select on modifier_options for select using (true);
create policy modifier_options_write on modifier_options for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy product_modifiers_select on product_modifiers for select using (true);
create policy product_modifiers_write on product_modifiers for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy combo_deals_select on combo_deals for select using (true);
create policy combo_deals_write on combo_deals for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy combo_items_select on combo_items for select using (true);
create policy combo_items_write on combo_items for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy happy_hour_select on happy_hour_pricing for select using (true);
create policy happy_hour_write on happy_hour_pricing for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

-- ---------------------------------------------------------------------
-- INVENTORY: branch scoped read for manager/cashier/kitchen, write manager+
-- ---------------------------------------------------------------------
create policy ingredients_select on ingredients for select
  using (is_owner_or_admin() or branch_id = current_user_branch() or branch_id is null);
create policy ingredients_write on ingredients for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy recipes_select on recipes for select using (true);
create policy recipes_write on recipes for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy inventory_stock_select on inventory_stock for select
  using (is_owner_or_admin() or branch_id = current_user_branch());
create policy inventory_stock_write on inventory_stock for all
  using (is_owner_or_admin() or current_user_role() in ('manager', 'cashier'))
  with check (is_owner_or_admin() or branch_id = current_user_branch());

create policy inventory_logs_select on inventory_logs for select
  using (is_owner_or_admin() or branch_id = current_user_branch());
create policy inventory_logs_insert on inventory_logs for insert
  with check (is_owner_or_admin() or branch_id = current_user_branch());

create policy inventory_audits_select on inventory_audits for select
  using (is_owner_or_admin() or branch_id = current_user_branch());
create policy inventory_audits_write on inventory_audits for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or branch_id = current_user_branch());

-- ---------------------------------------------------------------------
-- CUSTOMERS & LOYALTY: branch scoped, cashier can create/update during POS
-- ---------------------------------------------------------------------
create policy customers_select on customers for select
  using (is_owner_or_admin() or branch_id = current_user_branch() or branch_id is null);
create policy customers_write on customers for all
  using (is_owner_or_admin() or current_user_role() in ('manager', 'cashier'))
  with check (is_owner_or_admin() or branch_id = current_user_branch() or branch_id is null);

create policy loyalty_select on loyalty_transactions for select using (true);
create policy loyalty_insert on loyalty_transactions for insert with check (true);

-- ---------------------------------------------------------------------
-- SALES / POS: branch scoped; cashier can create; void/refund manager+
-- ---------------------------------------------------------------------
create policy sales_select on sales for select
  using (is_owner_or_admin() or branch_id = current_user_branch());
create policy sales_insert on sales for insert
  with check (is_owner_or_admin() or (current_user_role() in ('manager', 'cashier') and branch_id = current_user_branch()));
create policy sales_update on sales for update
  using (is_owner_or_admin() or (current_user_role() in ('manager', 'cashier') and branch_id = current_user_branch()));

create policy sale_items_select on sale_items for select
  using (is_owner_or_admin() or exists (
    select 1 from sales s where s.id = sale_items.sale_id and s.branch_id = current_user_branch()
  ));
create policy sale_items_write on sale_items for all
  using (is_owner_or_admin() or current_user_role() in ('manager', 'cashier'))
  with check (is_owner_or_admin() or current_user_role() in ('manager', 'cashier'));

create policy sale_payments_select on sale_payments for select
  using (is_owner_or_admin() or exists (
    select 1 from sales s where s.id = sale_payments.sale_id and s.branch_id = current_user_branch()
  ));
create policy sale_payments_write on sale_payments for all
  using (is_owner_or_admin() or current_user_role() in ('manager', 'cashier'))
  with check (is_owner_or_admin() or current_user_role() in ('manager', 'cashier'));

create policy refunds_select on refunds for select
  using (is_owner_or_admin() or exists (
    select 1 from sales s where s.id = refunds.sale_id and s.branch_id = current_user_branch()
  ));
create policy refunds_write on refunds for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

-- ---------------------------------------------------------------------
-- PURCHASING: branch scoped, manager+ only
-- ---------------------------------------------------------------------
create policy suppliers_select on suppliers for select
  using (is_owner_or_admin() or branch_id = current_user_branch() or branch_id is null);
create policy suppliers_write on suppliers for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy purchase_orders_select on purchase_orders for select
  using (is_owner_or_admin() or branch_id = current_user_branch());
create policy purchase_orders_write on purchase_orders for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or (current_user_role() = 'manager' and branch_id = current_user_branch()));

create policy purchase_items_select on purchase_items for select
  using (is_owner_or_admin() or exists (
    select 1 from purchase_orders po where po.id = purchase_items.purchase_order_id and po.branch_id = current_user_branch()
  ));
create policy purchase_items_write on purchase_items for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy goods_received_select on goods_received for select using (true);
create policy goods_received_write on goods_received for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy purchase_returns_select on purchase_returns for select using (true);
create policy purchase_returns_write on purchase_returns for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

create policy supplier_payments_select on supplier_payments for select using (true);
create policy supplier_payments_write on supplier_payments for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or current_user_role() = 'manager');

-- ---------------------------------------------------------------------
-- EXPENSES: branch scoped, manager+ only
-- ---------------------------------------------------------------------
create policy expense_categories_select on expense_categories for select using (true);
create policy expense_categories_write on expense_categories for all
  using (is_owner_or_admin()) with check (is_owner_or_admin());

create policy expenses_select on expenses for select
  using (is_owner_or_admin() or branch_id = current_user_branch());
create policy expenses_write on expenses for all
  using (is_owner_or_admin() or current_user_role() = 'manager')
  with check (is_owner_or_admin() or (current_user_role() = 'manager' and branch_id = current_user_branch()));

-- ---------------------------------------------------------------------
-- ACTIVITY LOGS: read-only for owner/admin/manager (own branch); insert-only
-- for everyone (via server actions running as the authenticated user)
-- ---------------------------------------------------------------------
create policy activity_logs_select on activity_logs for select
  using (is_owner_or_admin() or (current_user_role() = 'manager' and branch_id = current_user_branch()));
create policy activity_logs_insert on activity_logs for insert with check (true);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS: users see their own + branch-wide ones for their branch
-- ---------------------------------------------------------------------
create policy notifications_select on notifications for select
  using (user_id = auth.uid() or is_owner_or_admin() or branch_id = current_user_branch());
create policy notifications_update on notifications for update
  using (user_id = auth.uid() or is_owner_or_admin());
create policy notifications_insert on notifications for insert with check (true);

-- ---------------------------------------------------------------------
-- SETTINGS: owner/admin write, branch-scoped read
-- ---------------------------------------------------------------------
create policy settings_select on settings for select
  using (is_owner_or_admin() or branch_id = current_user_branch());
create policy settings_write on settings for all
  using (is_owner_or_admin()) with check (is_owner_or_admin());

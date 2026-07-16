-- =====================================================================
-- BITO ERP — Functions & Triggers (Migration 0003)
-- =====================================================================

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_branches_updated_at before update on branches
  for each row execute function set_updated_at();
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_sales_updated_at before update on sales
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Order number generator: BR-YYYYMMDD-0001 per branch per day
-- ---------------------------------------------------------------------
create or replace function generate_order_number(p_branch_id uuid)
returns text language plpgsql as $$
declare
  v_prefix text;
  v_count int;
begin
  select code into v_prefix from branches where id = p_branch_id;
  select count(*) + 1 into v_count
  from sales
  where branch_id = p_branch_id
    and created_at::date = current_date;
  return coalesce(v_prefix, 'BR') || '-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(v_count::text, 4, '0');
end;
$$;

-- ---------------------------------------------------------------------
-- Automatic stock deduction when a sale is completed
-- Deducts recipe ingredients for every sale_item, logs an inventory_log row,
-- and raises a low_stock notification if the reorder level is breached.
-- ---------------------------------------------------------------------
create or replace function deduct_stock_for_sale_item()
returns trigger language plpgsql as $$
declare
  v_branch_id uuid;
  r record;
  v_new_qty numeric;
begin
  select branch_id into v_branch_id from sales where id = new.sale_id;

  if new.product_id is not null then
    for r in
      select ingredient_id, quantity_required * new.quantity as needed
      from recipes
      where product_id = new.product_id
    loop
      update inventory_stock
        set quantity_on_hand = quantity_on_hand - r.needed,
            updated_at = now()
        where branch_id = v_branch_id
          and ingredient_id = r.ingredient_id
        returning quantity_on_hand into v_new_qty;

      insert into inventory_logs (branch_id, ingredient_id, movement_type, quantity, reference_type, reference_id, notes)
      values (v_branch_id, r.ingredient_id, 'out', r.needed, 'sale', new.sale_id, 'Auto-deducted for sale item ' || new.id);

      if v_new_qty is not null and v_new_qty <= (
        select reorder_level from ingredients where id = r.ingredient_id
      ) then
        insert into notifications (branch_id, type, title, message, metadata)
        select v_branch_id, 'low_stock', 'Low stock alert',
               (select name from ingredients where id = r.ingredient_id) || ' is at or below reorder level',
               jsonb_build_object('ingredient_id', r.ingredient_id, 'quantity_on_hand', v_new_qty);
      end if;
    end loop;
  end if;

  return new;
end;
$$;

create trigger trg_deduct_stock_after_sale_item
  after insert on sale_items
  for each row execute function deduct_stock_for_sale_item();

-- ---------------------------------------------------------------------
-- Restock inventory when goods are received against a purchase order
-- ---------------------------------------------------------------------
create or replace function receive_purchase_order(p_po_id uuid, p_received_by uuid, p_notes text default null)
returns void language plpgsql as $$
declare
  v_branch_id uuid;
  r record;
begin
  select branch_id into v_branch_id from purchase_orders where id = p_po_id;

  insert into goods_received (purchase_order_id, received_by, notes)
  values (p_po_id, p_received_by, p_notes);

  for r in select * from purchase_items where purchase_order_id = p_po_id loop
    insert into inventory_stock (branch_id, ingredient_id, quantity_on_hand)
    values (v_branch_id, r.ingredient_id, r.quantity_ordered)
    on conflict (branch_id, ingredient_id, batch_number)
    do update set quantity_on_hand = inventory_stock.quantity_on_hand + excluded.quantity_on_hand,
                  updated_at = now();

    insert into inventory_logs (branch_id, ingredient_id, movement_type, quantity, reference_type, reference_id, notes)
    values (v_branch_id, r.ingredient_id, 'in', r.quantity_ordered, 'purchase', p_po_id, 'Goods received');

    update purchase_items set quantity_received = quantity_ordered where id = r.id;
  end loop;

  update purchase_orders set status = 'received' where id = p_po_id;

  insert into notifications (branch_id, type, title, message)
  values (v_branch_id, 'new_purchase', 'Purchase received',
          'Purchase order has been fully received and stock updated.');
end;
$$;

-- ---------------------------------------------------------------------
-- Loyalty points: 1 point per 100 currency units spent, accrued on
-- completed + paid sales tied to a customer.
-- ---------------------------------------------------------------------
create or replace function accrue_loyalty_points()
returns trigger language plpgsql as $$
declare
  v_points int;
begin
  if new.status = 'completed' and new.payment_status = 'paid'
     and new.customer_id is not null
     and (old.status is distinct from new.status or old.payment_status is distinct from new.payment_status) then

    v_points := floor(new.total_amount / 100);

    if v_points > 0 then
      update customers
        set loyalty_points = loyalty_points + v_points,
            total_spent = total_spent + new.total_amount,
            visit_count = visit_count + 1,
            last_visit_at = now()
        where id = new.customer_id;

      insert into loyalty_transactions (customer_id, sale_id, points, reason)
      values (new.customer_id, new.id, v_points, 'Earned from sale ' || new.order_number);
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_accrue_loyalty after update on sales
  for each row execute function accrue_loyalty_points();

-- ---------------------------------------------------------------------
-- Large-sale notification (threshold configurable per branch via settings later;
-- default flags sales over 10,000)
-- ---------------------------------------------------------------------
create or replace function notify_large_sale()
returns trigger language plpgsql as $$
begin
  if new.status = 'completed' and new.total_amount >= 10000 then
    insert into notifications (branch_id, type, title, message, metadata)
    values (new.branch_id, 'large_sale', 'Large sale recorded',
            'Order ' || new.order_number || ' totaled ' || new.total_amount,
            jsonb_build_object('sale_id', new.id));
  end if;
  return new;
end;
$$;

create trigger trg_notify_large_sale after update on sales
  for each row execute function notify_large_sale();

-- ---------------------------------------------------------------------
-- Generic activity logger helper (called from server actions, not a trigger,
-- since it needs request-level context like IP address)
-- ---------------------------------------------------------------------
create or replace function log_activity(
  p_branch_id uuid, p_user_id uuid, p_action text,
  p_entity_type text, p_entity_id uuid, p_metadata jsonb default '{}'::jsonb
) returns void language sql as $$
  insert into activity_logs (branch_id, user_id, action, entity_type, entity_id, metadata)
  values (p_branch_id, p_user_id, p_action, p_entity_type, p_entity_id, p_metadata);
$$;

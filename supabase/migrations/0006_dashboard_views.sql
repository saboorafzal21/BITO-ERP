-- =====================================================================
-- BITO ERP — Dashboard aggregation helpers (Migration 0006)
-- =====================================================================

create or replace function dashboard_metrics(p_branch_id uuid)
returns table (
  today_sales numeric,
  week_sales numeric,
  month_sales numeric,
  year_sales numeric,
  orders_today bigint,
  pending_orders bigint,
  completed_orders bigint,
  cancelled_orders bigint,
  average_order_value numeric,
  low_stock_count bigint,
  inventory_worth numeric,
  gross_profit_month numeric,
  expenses_month numeric
) language sql stable as $$
  select
    coalesce((select sum(total_amount) from sales
       where branch_id = p_branch_id and status = 'completed' and created_at::date = current_date), 0),
    coalesce((select sum(total_amount) from sales
       where branch_id = p_branch_id and status = 'completed' and created_at >= date_trunc('week', now())), 0),
    coalesce((select sum(total_amount) from sales
       where branch_id = p_branch_id and status = 'completed' and created_at >= date_trunc('month', now())), 0),
    coalesce((select sum(total_amount) from sales
       where branch_id = p_branch_id and status = 'completed' and created_at >= date_trunc('year', now())), 0),
    coalesce((select count(*) from sales
       where branch_id = p_branch_id and created_at::date = current_date), 0),
    coalesce((select count(*) from sales
       where branch_id = p_branch_id and status = 'pending'), 0),
    coalesce((select count(*) from sales
       where branch_id = p_branch_id and status = 'completed' and created_at::date = current_date), 0),
    coalesce((select count(*) from sales
       where branch_id = p_branch_id and status = 'cancelled' and created_at::date = current_date), 0),
    coalesce((select avg(total_amount) from sales
       where branch_id = p_branch_id and status = 'completed' and created_at >= date_trunc('month', now())), 0),
    coalesce((select count(*) from inventory_stock ist
       join ingredients i on i.id = ist.ingredient_id
       where ist.branch_id = p_branch_id and ist.quantity_on_hand <= i.reorder_level), 0),
    coalesce((select sum(ist.quantity_on_hand * i.cost_per_unit) from inventory_stock ist
       join ingredients i on i.id = ist.ingredient_id
       where ist.branch_id = p_branch_id), 0),
    coalesce((select sum(si.line_total - (si.quantity * p.cost_price))
       from sale_items si
       join sales s on s.id = si.sale_id
       left join products p on p.id = si.product_id
       where s.branch_id = p_branch_id and s.status = 'completed'
         and s.created_at >= date_trunc('month', now())), 0),
    coalesce((select sum(amount) from expenses
       where branch_id = p_branch_id and expense_date >= date_trunc('month', now())::date), 0);
$$;

create or replace function sales_trend(p_branch_id uuid, p_days int default 14)
returns table (day date, revenue numeric, orders bigint) language sql stable as $$
  select d::date as day,
         coalesce(sum(s.total_amount), 0) as revenue,
         coalesce(count(s.id), 0) as orders
  from generate_series(current_date - (p_days - 1), current_date, interval '1 day') d
  left join sales s on s.branch_id = p_branch_id
    and s.status = 'completed'
    and s.created_at::date = d::date
  group by d
  order by d;
$$;

create or replace function top_selling_products(p_branch_id uuid, p_limit int default 5)
returns table (product_id uuid, product_name text, units_sold bigint, revenue numeric) language sql stable as $$
  select si.product_id, si.product_name, sum(si.quantity), sum(si.line_total)
  from sale_items si
  join sales s on s.id = si.sale_id
  where s.branch_id = p_branch_id and s.status = 'completed'
    and s.created_at >= now() - interval '30 days'
  group by si.product_id, si.product_name
  order by sum(si.quantity) desc
  limit p_limit;
$$;

create or replace function low_stock_items(p_branch_id uuid, p_limit int default 10)
returns table (ingredient_id uuid, name text, quantity_on_hand numeric, reorder_level numeric, unit text)
language sql stable as $$
  select i.id, i.name, ist.quantity_on_hand, i.reorder_level, i.unit
  from inventory_stock ist
  join ingredients i on i.id = ist.ingredient_id
  where ist.branch_id = p_branch_id and ist.quantity_on_hand <= i.reorder_level
  order by (ist.quantity_on_hand / nullif(i.reorder_level, 0)) asc
  limit p_limit;
$$;

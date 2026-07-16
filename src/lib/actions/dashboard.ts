import { createClient } from "@/lib/supabase/server";

export interface DashboardMetricsRow {
  today_sales: number;
  week_sales: number;
  month_sales: number;
  year_sales: number;
  orders_today: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  average_order_value: number;
  low_stock_count: number;
  inventory_worth: number;
  gross_profit_month: number;
  expenses_month: number;
}

export interface TopProductRow {
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
}

export interface LowStockRow {
  ingredient_id: string;
  name: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit: string;
}

export interface RecentSaleRow {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  order_type: string;
  created_at: string;
}

export async function getDashboardData(branchId: string) {
  const supabase = await createClient();

  const [{ data: metrics }, { data: trend }, { data: topProducts }, { data: lowStock }, { data: recentSales }] =
    await Promise.all([
      supabase.rpc("dashboard_metrics", { p_branch_id: branchId }).single<DashboardMetricsRow>(),
      supabase.rpc("sales_trend", { p_branch_id: branchId, p_days: 14 }) as unknown as Promise<{
        data: { day: string; revenue: number; orders: number }[] | null;
      }>,
      supabase.rpc("top_selling_products", { p_branch_id: branchId, p_limit: 5 }) as unknown as Promise<{
        data: TopProductRow[] | null;
      }>,
      supabase.rpc("low_stock_items", { p_branch_id: branchId, p_limit: 6 }) as unknown as Promise<{
        data: LowStockRow[] | null;
      }>,
      supabase
        .from("sales")
        .select("id, order_number, total_amount, status, order_type, created_at")
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false })
        .limit(6) as unknown as Promise<{ data: RecentSaleRow[] | null }>,
    ]);

  return {
    metrics,
    trend: trend ?? [],
    topProducts: topProducts ?? [],
    lowStock: lowStock ?? [],
    recentSales: recentSales ?? [],
  };
}

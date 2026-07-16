import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/actions/dashboard";
import type { TopProductRow, LowStockRow } from "@/lib/actions/dashboard";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/primitives";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  PackageSearch,
  AlertTriangle,
  Receipt,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("branch_id")
    .eq("id", user.id)
    .single();

  if (!profile?.branch_id) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        No branch assigned to your account yet. Ask an owner/admin to assign one.
      </div>
    );
  }

  const { metrics, trend, topProducts, lowStock, recentSales } = await getDashboardData(
    profile.branch_id
  );

  const statusVariant = {
    completed: "success",
    pending: "warning",
    preparing: "warning",
    ready: "primary",
    cancelled: "danger",
  } as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted">Live overview of today&apos;s performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today's Sales"
          value={formatCurrency(metrics?.today_sales ?? 0)}
          icon={DollarSign}
        />
        <KpiCard
          label="Orders Today"
          value={String(metrics?.orders_today ?? 0)}
          icon={ShoppingBag}
        />
        <KpiCard
          label="Avg. Order Value"
          value={formatCurrency(metrics?.average_order_value ?? 0)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Inventory Worth"
          value={formatCurrency(metrics?.inventory_worth ?? 0)}
          icon={PackageSearch}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Weekly Sales" value={formatCurrency(metrics?.week_sales ?? 0)} icon={DollarSign} />
        <KpiCard label="Monthly Sales" value={formatCurrency(metrics?.month_sales ?? 0)} icon={DollarSign} />
        <KpiCard
          label="Gross Profit (Month)"
          value={formatCurrency(metrics?.gross_profit_month ?? 0)}
          icon={TrendingUp}
          tone="success"
        />
        <KpiCard
          label="Expenses (Month)"
          value={formatCurrency(metrics?.expenses_month ?? 0)}
          icon={Receipt}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <h3 className="font-semibold">Revenue — last 14 days</h3>
              <p className="text-xs text-muted">Completed sales only</p>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <RevenueTrendChart data={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="font-semibold">Top selling products</h3>
            <p className="text-xs text-muted">Last 30 days</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {topProducts.length === 0 && (
              <p className="text-sm text-muted">No sales recorded yet.</p>
            )}
            {topProducts.map((p: TopProductRow, i: number) => (
              <div key={p.product_id ?? i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted-bg text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="font-medium">{p.product_name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(p.revenue)}</div>
                  <div className="text-xs text-muted">{p.units_sold} sold</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <h3 className="font-semibold">Recent sales</h3>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted">
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-muted">
                        No orders yet today.
                      </td>
                    </tr>
                  )}
                  {recentSales.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 font-medium">{s.order_number}</td>
                      <td className="py-2.5 capitalize text-muted">{s.order_type.replace("_", " ")}</td>
                      <td className="py-2.5">
                        <Badge variant={statusVariant[s.status as keyof typeof statusVariant] ?? "neutral"}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-muted">{formatDate(s.created_at)}</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(s.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={16} className="text-warning" />
              Low stock
            </h3>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {lowStock.length === 0 && (
              <p className="text-sm text-muted">All ingredients are well stocked.</p>
            )}
            {lowStock.map((item: LowStockRow) => (
              <div key={item.ingredient_id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-danger">
                  {item.quantity_on_hand} / {item.reorder_level} {item.unit}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

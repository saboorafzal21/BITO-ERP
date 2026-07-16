import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/actions/dashboard";
import { Card, CardHeader, CardContent } from "@/components/ui/primitives";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: profile } = await supabase.from("users").select("branch_id").eq("id", authUser.id).single();
  if (!profile?.branch_id) return <p className="text-sm text-muted">No branch assigned.</p>;

  const { metrics, topProducts, lowStock } = await getDashboardData(profile.branch_id);

  const { data: expensesByCategory } = await supabase
    .from("expenses")
    .select("amount, expense_categories(name)")
    .eq("branch_id", profile.branch_id);

  const expenseTotals: Record<string, number> = {};
  (expensesByCategory ?? []).forEach((e) => {
    const cat = e.expense_categories as unknown as { name?: string } | null;
    const name = cat?.name ?? "Other";
    expenseTotals[name] = (expenseTotals[name] ?? 0) + Number(e.amount);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Reports</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent><p className="text-xs text-muted">This Month Sales</p><p className="text-xl font-bold">Rs {metrics?.month_sales ?? 0}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs text-muted">Gross Profit (Month)</p><p className="text-xl font-bold">Rs {metrics?.gross_profit_month ?? 0}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs text-muted">Expenses (Month)</p><p className="text-xl font-bold">Rs {metrics?.expenses_month ?? 0}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs text-muted">Inventory Worth</p><p className="text-xl font-bold">Rs {metrics?.inventory_worth ?? 0}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h2 className="font-semibold">Top Selling Products (30d)</h2></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {topProducts.map((p) => (
                <li key={p.product_id} className="flex justify-between">
                  <span>{p.product_name}</span>
                  <span className="text-muted">{p.units_sold} sold · Rs {p.revenue}</span>
                </li>
              ))}
              {topProducts.length === 0 && <p className="text-muted">No sales yet.</p>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold">Low Stock Items</h2></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {lowStock.map((i) => (
                <li key={i.ingredient_id} className="flex justify-between">
                  <span>{i.name}</span>
                  <span className="text-danger">{i.quantity_on_hand} / {i.reorder_level} {i.unit}</span>
                </li>
              ))}
              {lowStock.length === 0 && <p className="text-muted">All stocked.</p>}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><h2 className="font-semibold">Expenses by Category</h2></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Object.entries(expenseTotals).map(([name, amt]) => (
                <li key={name} className="flex justify-between">
                  <span>{name}</span>
                  <span className="text-muted">Rs {amt}</span>
                </li>
              ))}
              {Object.keys(expenseTotals).length === 0 && <p className="text-muted">No expenses recorded.</p>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

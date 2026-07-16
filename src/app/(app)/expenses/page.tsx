import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExpensesData, createExpense } from "@/lib/actions/expenses";
import { Card, CardContent, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: profile } = await supabase.from("users").select("branch_id, id").eq("id", authUser.id).single();
  if (!profile?.branch_id) return <p className="text-sm text-muted">No branch assigned.</p>;
  const branchId = profile.branch_id;
  const userId = profile.id;

  const { expenses, categories } = await getExpensesData(branchId);
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Expenses</h1>
      <Card>
        <CardContent>
          <p className="mb-3 text-sm text-muted">Total recorded: <span className="font-semibold text-foreground">Rs {total}</span></p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2">Date</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Description</th>
                <th className="pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e: any) => (
                <tr key={e.id} className="border-b border-border/50">
                  <td className="py-2">{e.expense_date}</td>
                  <td className="py-2">{e.expense_categories?.name}</td>
                  <td className="py-2">{e.description ?? "—"}</td>
                  <td className="py-2">Rs {e.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <form
            action={async (formData) => {
              "use server";
              await createExpense(branchId, userId, formData);
            }}
            className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4"
          >
            <select name="category_id" required className="h-10 rounded-[var(--radius-card)] border border-border bg-card px-3 text-sm">
              <option value="">Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Input name="description" placeholder="Description" />
            <Input name="amount" type="number" step="0.01" placeholder="Amount" required />
            <Button size="sm" type="submit">Add Expense</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

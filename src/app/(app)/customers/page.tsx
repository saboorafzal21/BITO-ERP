import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustomers, createCustomer } from "@/lib/actions/customers";
import { Card, CardContent, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: profile } = await supabase.from("users").select("branch_id").eq("id", authUser.id).single();
  if (!profile?.branch_id) return <p className="text-sm text-muted">No branch assigned.</p>;
  const branchId = profile.branch_id;

  const customers = await getCustomers(branchId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Customers</h1>
      <Card>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2">Name</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2">Loyalty Points</th>
                <th className="pb-2">Total Spent</th>
                <th className="pb-2">Visits</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2">{c.full_name}</td>
                  <td className="py-2">{c.phone ?? "—"}</td>
                  <td className="py-2">{c.loyalty_points}</td>
                  <td className="py-2">Rs {c.total_spent}</td>
                  <td className="py-2">{c.visit_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <form
            action={async (formData) => {
              "use server";
              await createCustomer(branchId, formData);
            }}
            className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-3"
          >
            <Input name="full_name" placeholder="Full name" required />
            <Input name="phone" placeholder="Phone" />
            <Button size="sm" type="submit">Add Customer</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

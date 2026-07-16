import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPurchasingData, createSupplier, createPurchaseOrder, receivePO } from "@/lib/actions/purchasing";
import { Card, CardHeader, CardContent, Input, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function PurchasingPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: profile } = await supabase.from("users").select("branch_id, id").eq("id", authUser.id).single();
  if (!profile?.branch_id) return <p className="text-sm text-muted">No branch assigned.</p>;
  const branchId = profile.branch_id;
  const userId = profile.id;

  const { suppliers, orders, ingredients } = await getPurchasingData(branchId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Purchasing</h1>

      <Card>
        <CardHeader><h2 className="font-semibold">Purchase Orders</h2></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2">PO #</th>
                <th className="pb-2">Supplier</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border/50">
                  <td className="py-2">{o.po_number}</td>
                  <td className="py-2">{o.suppliers?.name}</td>
                  <td className="py-2">Rs {o.total_amount}</td>
                  <td className="py-2"><Badge variant={o.status === "received" ? "success" : "warning"}>{o.status}</Badge></td>
                  <td className="py-2 text-right">
                    {o.status !== "received" && (
                      <form action={async () => { "use server"; await receivePO(o.id, userId); }}>
                        <Button size="sm" variant="outline">Receive</Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form
            action={async (formData) => {
              "use server";
              await createPurchaseOrder(branchId, userId, formData);
            }}
            className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4"
          >
            <select name="supplier_id" required className="h-10 rounded-[var(--radius-card)] border border-border bg-card px-3 text-sm">
              <option value="">Supplier</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select name="ingredient_id" required className="h-10 rounded-[var(--radius-card)] border border-border bg-card px-3 text-sm">
              <option value="">Ingredient</option>
              {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <Input name="quantity_ordered" type="number" step="0.01" placeholder="Quantity" required />
            <Input name="unit_cost" type="number" step="0.01" placeholder="Unit cost" required />
            <Button size="sm" type="submit" className="col-span-2 sm:col-span-4">Create PO</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">Suppliers</h2></CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1 text-sm">
            {suppliers.map((s) => (
              <li key={s.id} className="rounded-md bg-muted-bg px-3 py-1.5">
                {s.name} {s.contact_person ? `· ${s.contact_person}` : ""} {s.phone ? `· ${s.phone}` : ""}
              </li>
            ))}
          </ul>
          <form
            action={async (formData) => {
              "use server";
              await createSupplier(branchId, formData);
            }}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            <Input name="name" placeholder="Supplier name" required />
            <Input name="contact_person" placeholder="Contact person" />
            <Input name="phone" placeholder="Phone" />
            <Button size="sm" type="submit" className="col-span-2 sm:col-span-3">Add Supplier</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

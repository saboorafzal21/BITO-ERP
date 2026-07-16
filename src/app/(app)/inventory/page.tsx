import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInventoryData, createIngredient, adjustStock } from "@/lib/actions/inventory";
import { Card, CardHeader, CardContent, Input, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: profile } = await supabase.from("users").select("branch_id").eq("id", authUser.id).single();
  if (!profile?.branch_id) return <p className="text-sm text-muted">No branch assigned.</p>;
  const branchId = profile.branch_id;

  const stock = await getInventoryData(branchId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Inventory</h1>

      <Card>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2">Ingredient</th>
                <th className="pb-2">On Hand</th>
                <th className="pb-2">Reorder Level</th>
                <th className="pb-2">Cost/Unit</th>
                <th className="pb-2">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {stock.map((s) => {
                const ing = s.ingredients as { name?: string; unit?: string; reorder_level?: number; cost_per_unit?: number } | null;
                const low = s.quantity_on_hand <= (ing?.reorder_level ?? 0);
                return (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2">{ing?.name}</td>
                    <td className="py-2">{s.quantity_on_hand} {ing?.unit}</td>
                    <td className="py-2">{ing?.reorder_level} {ing?.unit}</td>
                    <td className="py-2">Rs {ing?.cost_per_unit}</td>
                    <td className="py-2"><Badge variant={low ? "danger" : "success"}>{low ? "Low stock" : "OK"}</Badge></td>
                    <td className="py-2 text-right space-x-1">
                      <form className="inline" action={async () => { "use server"; await adjustStock(s.id, branchId, s.ingredient_id, 10); }}>
                        <Button size="sm" variant="outline">+10</Button>
                      </form>
                      <form className="inline" action={async () => { "use server"; await adjustStock(s.id, branchId, s.ingredient_id, -10); }}>
                        <Button size="sm" variant="outline">-10</Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">Add Ingredient</h2></CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await createIngredient(branchId, formData);
            }}
            className="grid grid-cols-2 gap-2 sm:grid-cols-5"
          >
            <Input name="name" placeholder="Name" required />
            <Input name="unit" placeholder="Unit (kg, piece...)" required />
            <Input name="reorder_level" type="number" step="0.01" placeholder="Reorder level" />
            <Input name="cost_per_unit" type="number" step="0.01" placeholder="Cost/unit" />
            <Input name="initial_qty" type="number" step="0.01" placeholder="Initial qty" />
            <Button size="sm" type="submit" className="col-span-2 sm:col-span-5">Add Ingredient</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

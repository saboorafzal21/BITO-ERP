import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMenuData, createCategory, createProduct, toggleProductActive } from "@/lib/actions/menu";
import { Card, CardHeader, CardContent, Input, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function MenuPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: profile } = await supabase.from("users").select("branch_id").eq("id", authUser.id).single();
  if (!profile?.branch_id) return <p className="text-sm text-muted">No branch assigned.</p>;
  const branchId = profile.branch_id;

  const { categories, products } = await getMenuData(branchId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Menu</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><h2 className="font-semibold">Categories</h2></CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1 text-sm">
              {categories.map((c) => (
                <li key={c.id} className="rounded-md bg-muted-bg px-3 py-1.5">{c.name}</li>
              ))}
            </ul>
            <form
              action={async (formData) => {
                "use server";
                await createCategory(branchId, formData);
              }}
              className="flex gap-2 pt-2"
            >
              <Input name="name" placeholder="New category" required />
              <Button size="sm" type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><h2 className="font-semibold">Products</h2></CardHeader>
          <CardContent className="space-y-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const catName = categories.find((c) => c.id === p.category_id)?.name ?? "—";
                  return (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2">{catName}</td>
                      <td className="py-2">Rs {p.base_price}</td>
                      <td className="py-2">
                        <Badge variant={p.is_active ? "success" : "neutral"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="py-2 text-right">
                        <form
                          action={async () => {
                            "use server";
                            await toggleProductActive(p.id, p.is_active);
                          }}
                        >
                          <Button size="sm" variant="outline">{p.is_active ? "Disable" : "Enable"}</Button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <form
              action={async (formData) => {
                "use server";
                await createProduct(branchId, formData);
              }}
              className="grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4"
            >
              <Input name="name" placeholder="Product name" required />
              <select name="category_id" className="h-10 rounded-[var(--radius-card)] border border-border bg-card px-3 text-sm">
                <option value="">Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Input name="base_price" type="number" step="0.01" placeholder="Price" required />
              <Input name="cost_price" type="number" step="0.01" placeholder="Cost" />
              <Button size="sm" type="submit" className="col-span-2 sm:col-span-4">Add Product</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

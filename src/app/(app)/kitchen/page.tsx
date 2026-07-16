import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getKitchenOrders, advanceOrderStatus } from "@/lib/actions/kitchen";
import { Card, CardHeader, CardContent, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

const NEXT_STATUS: Record<string, "preparing" | "ready" | "completed" | null> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
  completed: null,
};

export default async function KitchenPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: profile } = await supabase.from("users").select("branch_id").eq("id", authUser.id).single();
  if (!profile?.branch_id) return <p className="text-sm text-muted">No branch assigned.</p>;

  const orders = await getKitchenOrders(profile.branch_id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Kitchen Display</h1>
      {orders.length === 0 && <p className="text-sm text-muted">No active orders.</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order: any) => {
          const next = NEXT_STATUS[order.status];
          return (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <p className="font-semibold">{order.order_number}</p>
                  <p className="text-xs text-muted">
                    {order.order_type.replace("_", " ")} {order.table_number ? `· Table ${order.table_number}` : ""}
                  </p>
                </div>
                <Badge variant={order.status === "ready" ? "success" : order.status === "preparing" ? "warning" : "neutral"}>
                  {order.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <ul className="space-y-1 text-sm">
                  {order.sale_items?.map((item: any) => (
                    <li key={item.id}>
                      {item.quantity}x {item.product_name}
                      {item.notes ? <span className="text-muted"> — {item.notes}</span> : null}
                    </li>
                  ))}
                </ul>
                {next && (
                  <form
                    action={async () => {
                      "use server";
                      await advanceOrderStatus(order.id, next);
                    }}
                  >
                    <Button size="sm" className="w-full">
                      Mark {next}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getKitchenOrders(branchId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sales")
    .select("id, order_number, order_type, table_number, status, created_at, sale_items(id, product_name, quantity, notes)")
    .eq("branch_id", branchId)
    .in("status", ["pending", "preparing", "ready"])
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function advanceOrderStatus(saleId: string, nextStatus: "preparing" | "ready" | "completed") {
  const supabase = await createClient();
  await supabase.from("sales").update({ status: nextStatus }).eq("id", saleId);
  revalidatePath("/kitchen");
}

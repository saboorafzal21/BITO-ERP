"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getInventoryData(branchId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_stock")
    .select("id, quantity_on_hand, ingredient_id, ingredients(id, name, unit, reorder_level, cost_per_unit)")
    .eq("branch_id", branchId);
  return data ?? [];
}

export async function createIngredient(branchId: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const unit = String(formData.get("unit") || "piece");
  const reorder_level = Number(formData.get("reorder_level") || 0);
  const cost_per_unit = Number(formData.get("cost_per_unit") || 0);
  const initial_qty = Number(formData.get("initial_qty") || 0);
  if (!name) return;

  const { data: ingredient } = await supabase
    .from("ingredients")
    .insert({ branch_id: branchId, name, unit, reorder_level, cost_per_unit })
    .select("id")
    .single();

  if (ingredient) {
    await supabase.from("inventory_stock").insert({
      branch_id: branchId,
      ingredient_id: ingredient.id,
      quantity_on_hand: initial_qty,
    });
  }
  revalidatePath("/inventory");
}

export async function adjustStock(stockId: string, branchId: string, ingredientId: string, delta: number) {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("inventory_stock")
    .select("quantity_on_hand")
    .eq("id", stockId)
    .single();
  const newQty = (current?.quantity_on_hand ?? 0) + delta;
  await supabase.from("inventory_stock").update({ quantity_on_hand: newQty }).eq("id", stockId);
  await supabase.from("inventory_logs").insert({
    branch_id: branchId,
    ingredient_id: ingredientId,
    movement_type: delta > 0 ? "in" : "adjustment",
    quantity: Math.abs(delta),
    reference_type: "manual",
    notes: "Manual adjustment from Inventory page",
  });
  revalidatePath("/inventory");
}

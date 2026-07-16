"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getMenuData(branchId: string) {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name, sort_order").or(`branch_id.eq.${branchId},branch_id.is.null`).order("sort_order"),
    supabase
      .from("products")
      .select("id, name, description, base_price, cost_price, category_id, is_active")
      .or(`branch_id.eq.${branchId},branch_id.is.null`)
      .order("name"),
  ]);
  return { categories: categories ?? [], products: products ?? [] };
}

export async function createCategory(branchId: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await supabase.from("categories").insert({ branch_id: branchId, name });
  revalidatePath("/menu");
}

export async function createProduct(branchId: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const category_id = String(formData.get("category_id") || "") || null;
  const base_price = Number(formData.get("base_price") || 0);
  const cost_price = Number(formData.get("cost_price") || 0);
  if (!name) return;
  await supabase.from("products").insert({ branch_id: branchId, name, category_id, base_price, cost_price });
  revalidatePath("/menu");
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const supabase = await createClient();
  await supabase.from("products").update({ is_active: !isActive }).eq("id", productId);
  revalidatePath("/menu");
}

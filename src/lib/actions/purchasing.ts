"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getPurchasingData(branchId: string) {
  const supabase = await createClient();
  const [{ data: suppliers }, { data: orders }, { data: ingredients }] = await Promise.all([
    supabase.from("suppliers").select("id, name, contact_person, phone").or(`branch_id.eq.${branchId},branch_id.is.null`),
    supabase
      .from("purchase_orders")
      .select("id, po_number, status, total_amount, order_date, suppliers(name)")
      .eq("branch_id", branchId)
      .order("created_at", { ascending: false }),
    supabase.from("ingredients").select("id, name, unit").or(`branch_id.eq.${branchId},branch_id.is.null`),
  ]);
  return { suppliers: suppliers ?? [], orders: orders ?? [], ingredients: ingredients ?? [] };
}

export async function createSupplier(branchId: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const contact_person = String(formData.get("contact_person") || "");
  const phone = String(formData.get("phone") || "");
  if (!name) return;
  await supabase.from("suppliers").insert({ branch_id: branchId, name, contact_person, phone });
  revalidatePath("/purchasing");
}

export async function createPurchaseOrder(branchId: string, userId: string, formData: FormData) {
  const supabase = await createClient();
  const supplier_id = String(formData.get("supplier_id") || "");
  const ingredient_id = String(formData.get("ingredient_id") || "");
  const quantity_ordered = Number(formData.get("quantity_ordered") || 0);
  const unit_cost = Number(formData.get("unit_cost") || 0);
  if (!supplier_id || !ingredient_id || !quantity_ordered) return;

  const po_number = "PO-" + Date.now().toString().slice(-8);
  const line_total = quantity_ordered * unit_cost;

  const { data: po } = await supabase
    .from("purchase_orders")
    .insert({
      branch_id: branchId,
      supplier_id,
      po_number,
      status: "ordered",
      subtotal: line_total,
      total_amount: line_total,
      created_by: userId,
    })
    .select("id")
    .single();

  if (po) {
    await supabase.from("purchase_items").insert({
      purchase_order_id: po.id,
      ingredient_id,
      quantity_ordered,
      unit_cost,
      line_total,
    });
  }
  revalidatePath("/purchasing");
}

export async function receivePO(poId: string, userId: string) {
  const supabase = await createClient();
  await supabase.rpc("receive_purchase_order", { p_po_id: poId, p_received_by: userId });
  revalidatePath("/purchasing");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/pos";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function getMenuData(branchId: string) {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, sort_order")
      .or(`branch_id.eq.${branchId},branch_id.is.null`)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("products")
      .select("id, category_id, name, base_price, tax_rate, image_url, track_inventory")
      .or(`branch_id.eq.${branchId},branch_id.is.null`)
      .eq("is_active", true)
      .order("name"),
  ]);
  return { categories: categories ?? [], products: products ?? [] };
}

export async function checkoutAction(input: CheckoutInput): Promise<ActionResult<{ saleId: string; orderNumber: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".") ?? "unknown";
    return { success: false, error: `Invalid field "${path}": ${issue?.message ?? "unknown error"}` };
  }
  const data = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity + item.addons.reduce((a, x) => a + x.price, 0) * item.quantity,
    0
  );
  const taxAmount = data.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity * (item.tax_rate / 100),
    0
  );
  const totalAmount = subtotal + taxAmount - data.discount_amount;

  const { data: orderNumberData } = await supabase.rpc("generate_order_number", {
    p_branch_id: data.branch_id,
  });
  const orderNumber = orderNumberData as string;

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      branch_id: data.branch_id,
      order_number: orderNumber,
      customer_id: data.customer_id ?? null,
      cashier_id: user.id,
      order_type: data.order_type,
      table_number: data.table_number ?? null,
      status: "completed",
      payment_status: data.amount_paid >= totalAmount ? "paid" : "partial",
      payment_method: data.payment_method,
      subtotal,
      discount_amount: data.discount_amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      amount_paid: data.amount_paid,
      change_due: Math.max(0, data.amount_paid - totalAmount),
      notes: data.notes,
    })
    .select("id, order_number")
    .single();

  if (saleError || !sale) {
    return { success: false, error: saleError?.message ?? "Failed to create sale" };
  }

  const saleItemsPayload = data.items.map((item) => ({
    sale_id: sale.id,
    product_id: item.product_id,
    variant_id: item.variant_id ?? null,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_amount: item.discount_amount,
    tax_amount: item.unit_price * item.quantity * (item.tax_rate / 100),
    line_total:
      item.unit_price * item.quantity +
      item.addons.reduce((a, x) => a + x.price, 0) * item.quantity -
      item.discount_amount,
    notes: item.notes,
    addons: item.addons,
  }));

  const { error: itemsError } = await supabase.from("sale_items").insert(saleItemsPayload);
  if (itemsError) {
    return { success: false, error: `Sale created but items failed: ${itemsError.message}` };
  }

  await supabase.from("sale_payments").insert({
    sale_id: sale.id,
    method: data.payment_method,
    amount: data.amount_paid,
  });

  await supabase.rpc("log_activity", {
    p_branch_id: data.branch_id,
    p_user_id: user.id,
    p_action: "pos.checkout",
    p_entity_type: "sales",
    p_entity_id: sale.id,
    p_metadata: { total_amount: totalAmount },
  });

  revalidatePath("/dashboard");
  revalidatePath("/pos");

  return { success: true, data: { saleId: sale.id, orderNumber: sale.order_number } };
}

export async function voidSaleAction(saleId: string, reason: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("sales")
    .update({ status: "cancelled", voided_at: new Date().toISOString(), voided_by: user.id, void_reason: reason })
    .eq("id", saleId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/pos");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getCustomers(branchId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, full_name, phone, loyalty_points, total_spent, visit_count")
    .or(`branch_id.eq.${branchId},branch_id.is.null`)
    .order("total_spent", { ascending: false });
  return data ?? [];
}

export async function createCustomer(branchId: string, formData: FormData) {
  const supabase = await createClient();
  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!full_name) return;
  await supabase.from("customers").insert({ branch_id: branchId, full_name, phone: phone || null });
  revalidatePath("/customers");
}

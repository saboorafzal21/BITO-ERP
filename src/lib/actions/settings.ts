"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getSettingsData(branchId: string) {
  const supabase = await createClient();
  const [{ data: branch }, { data: settings }] = await Promise.all([
    supabase.from("branches").select("*").eq("id", branchId).single(),
    supabase.from("settings").select("*").eq("branch_id", branchId).single(),
  ]);
  return { branch, settings };
}

export async function updateSettings(branchId: string, formData: FormData) {
  const supabase = await createClient();
  const restaurant_name = String(formData.get("restaurant_name") || "BITO");
  const currency = String(formData.get("currency") || "PKR");
  const tax_rate = Number(formData.get("tax_rate") || 0);
  const service_charge_rate = Number(formData.get("service_charge_rate") || 0);

  await supabase.from("settings").upsert({ branch_id: branchId, restaurant_name, currency, tax_rate }, { onConflict: "branch_id" });
  await supabase.from("branches").update({ tax_rate, service_charge_rate }).eq("id", branchId);
  revalidatePath("/settings");
}

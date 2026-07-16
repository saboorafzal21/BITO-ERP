"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getExpensesData(branchId: string) {
  const supabase = await createClient();
  const [{ data: expenses }, { data: categories }] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, description, amount, expense_date, expense_categories(name)")
      .eq("branch_id", branchId)
      .order("expense_date", { ascending: false }),
    supabase.from("expense_categories").select("id, name"),
  ]);
  return { expenses: expenses ?? [], categories: categories ?? [] };
}

export async function createExpense(branchId: string, userId: string, formData: FormData) {
  const supabase = await createClient();
  const category_id = String(formData.get("category_id") || "");
  const description = String(formData.get("description") || "");
  const amount = Number(formData.get("amount") || 0);
  if (!category_id || !amount) return;
  await supabase.from("expenses").insert({ branch_id: branchId, category_id, description, amount, created_by: userId });
  revalidatePath("/expenses");
}

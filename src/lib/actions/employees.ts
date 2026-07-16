"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getEmployeesData(branchId: string) {
  const supabase = await createClient();
  const [{ data: employees }, { data: users }] = await Promise.all([
    supabase
      .from("employees")
      .select("id, employee_code, designation, salary, hired_at, users(full_name, email, role)")
      .eq("branch_id", branchId),
    supabase.from("users").select("id, full_name, email, role").eq("branch_id", branchId),
  ]);
  return { employees: employees ?? [], users: users ?? [] };
}

export async function createEmployee(branchId: string, formData: FormData) {
  const supabase = await createClient();
  const user_id = String(formData.get("user_id") || "");
  const designation = String(formData.get("designation") || "");
  const salary = Number(formData.get("salary") || 0);
  if (!user_id) return;
  const employee_code = "EMP-" + Date.now().toString().slice(-6);
  await supabase.from("employees").insert({ branch_id: branchId, user_id, designation, salary, employee_code });
  revalidatePath("/employees");
}

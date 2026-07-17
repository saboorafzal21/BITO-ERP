"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getProfileData(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, email, phone, role, branch_id, avatar_url, last_login_at, created_at")
    .eq("id", userId)
    .single();

  const { data: branch } = profile?.branch_id
    ? await supabase.from("branches").select("name, code").eq("id", profile.branch_id).single()
    : { data: null };

  return { profile, branch };
}

export async function updateProfile(userId: string, formData: FormData) {
  const supabase = await createClient();
  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!full_name) {
    return { success: false, error: "Full name is required" };
  }

  const { error } = await supabase
    .from("users")
    .update({ full_name, phone: phone || null })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/profile");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient();
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

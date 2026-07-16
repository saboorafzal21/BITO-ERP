"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getNotifications(userId: string, branchId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, message, is_read, created_at")
    .or(`user_id.eq.${userId},branch_id.eq.${branchId}`)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  revalidatePath("/notifications");
}

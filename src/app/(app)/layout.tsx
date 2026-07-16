import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { AppUser } from "@/lib/types/database";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, branch_id, full_name, email, role, avatar_url, is_active")
    .eq("id", authUser.id)
    .single<AppUser>();

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  const { data: branch } = profile.branch_id
    ? await supabase.from("branches").select("name").eq("id", profile.branch_id).single()
    : { data: null };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={profile.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={profile} branchName={branch?.name ?? "All Branches"} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

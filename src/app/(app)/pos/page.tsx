import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMenuData } from "@/lib/actions/pos";
import { PosTerminal } from "@/components/pos/pos-terminal";

export default async function PosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("branch_id")
    .eq("id", user.id)
    .single();

  if (!profile?.branch_id) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        No branch assigned to your account yet. Ask an owner/admin to assign one.
      </div>
    );
  }

  const { categories, products } = await getMenuData(profile.branch_id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Point of Sale</h1>
        <p className="text-sm text-muted">Fast checkout for dine-in, take away, and delivery.</p>
      </div>
      <PosTerminal branchId={profile.branch_id} categories={categories} products={products} />
    </div>
  );
}

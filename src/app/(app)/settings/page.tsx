import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettingsData, updateSettings } from "@/lib/actions/settings";
import { Card, CardHeader, CardContent, Input } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: profile } = await supabase.from("users").select("branch_id, role").eq("id", authUser.id).single();
  if (!profile?.branch_id) return <p className="text-sm text-muted">No branch assigned.</p>;
  if (!["owner", "admin"].includes(profile.role)) redirect("/dashboard");

  const { branch, settings } = await getSettingsData(profile.branch_id);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Settings</h1>
      <Card>
        <CardHeader><h2 className="font-semibold">Branch &amp; Restaurant Settings</h2></CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await updateSettings(profile.branch_id!, formData);
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-xs text-muted">Restaurant Name</label>
              <Input name="restaurant_name" defaultValue={settings?.restaurant_name ?? branch?.name} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Currency</label>
              <Input name="currency" defaultValue={settings?.currency ?? "PKR"} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Tax Rate (%)</label>
              <Input name="tax_rate" type="number" step="0.01" defaultValue={branch?.tax_rate ?? 0} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Service Charge Rate (%)</label>
              <Input name="service_charge_rate" type="number" step="0.01" defaultValue={branch?.service_charge_rate ?? 0} />
            </div>
            <Button type="submit" className="sm:col-span-2 w-fit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

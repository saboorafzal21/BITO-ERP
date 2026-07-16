import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNotifications, markNotificationRead } from "@/lib/actions/notifications";
import { Card, CardContent, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: profile } = await supabase.from("users").select("branch_id, id").eq("id", authUser.id).single();
  if (!profile?.branch_id) return <p className="text-sm text-muted">No branch assigned.</p>;

  const notifications = await getNotifications(profile.id, profile.branch_id);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Notifications</h1>
      <Card>
        <CardContent className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-3 border-b border-border/50 py-2 last:border-0">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.is_read && <Badge variant="primary">New</Badge>}
                </div>
                <p className="text-xs text-muted">{n.message}</p>
              </div>
              {!n.is_read && (
                <form action={async () => { "use server"; await markNotificationRead(n.id); }}>
                  <Button size="sm" variant="outline">Mark read</Button>
                </form>
              )}
            </div>
          ))}
          {notifications.length === 0 && <p className="text-sm text-muted">No notifications.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

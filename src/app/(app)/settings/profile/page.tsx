import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileData } from "@/lib/actions/profile";
import { ProfileForm, ChangePasswordForm } from "@/components/settings/profile-forms";
import { Card, CardHeader, CardContent, Badge } from "@/components/ui/primitives";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { profile, branch } = await getProfileData(authUser.id);
  if (!profile) redirect("/dashboard");

  const fullName: string = profile.full_name;
  const initials = fullName
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold">My Profile</h1>
        <p className="text-sm text-muted">Manage your account details and password.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-foreground">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold">{profile.full_name}</p>
            <p className="text-sm text-muted">{profile.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="primary" className="capitalize">{profile.role}</Badge>
              {branch && <Badge variant="neutral">{branch.name}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">Profile details</h2></CardHeader>
        <CardContent>
          <ProfileForm userId={profile.id} fullName={profile.full_name} phone={profile.phone} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold">Change password</h2></CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

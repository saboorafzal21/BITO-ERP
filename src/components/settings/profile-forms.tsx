"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { updateProfile, changePassword } from "@/lib/actions/profile";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface ProfileFormProps {
  userId: string;
  fullName: string;
  phone: string | null;
}

export function ProfileForm({ userId, fullName, phone }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const result = await updateProfile(userId, formData);
        if (!result.success) {
          setError(result.error || "Could not update profile");
          return;
        }
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update profile");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-[var(--radius-card)] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 size={16} />
          Profile updated
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-muted">Full name</label>
        <Input name="full_name" defaultValue={fullName} required />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Phone</label>
        <Input name="phone" defaultValue={phone ?? ""} placeholder="+92 300 1234567" />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 size={16} className="animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const result = await changePassword(formData);
        if (!result.success) {
          setError(result.error || "Could not change password");
          return;
        }
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not change password");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-[var(--radius-card)] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 size={16} />
          Password changed
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-muted">New password</label>
        <div className="relative">
          <Input
            name="newPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Confirm new password</label>
        <Input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 size={16} className="animate-spin" />}
        Update password
      </Button>
    </form>
  );
}

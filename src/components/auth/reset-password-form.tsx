"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { resetPasswordAction } from "@/lib/actions/auth";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await resetPasswordAction(formData);
        if (!result.success) {
          setError(result.error || "Could not reset password. Please try again.");
          return;
        }
        setDone(true);
        setTimeout(() => {
          router.replace("/login");
        }, 2000);
      } catch (err) {
        console.error("Reset password error:", err);
        setError(err instanceof Error ? err.message : "Could not reset password. Please try again.");
      }
    });
  }

  if (done) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-card)] border border-success/30 bg-success/10 p-4 text-sm text-success">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
        <div>Password updated. Redirecting you to sign in…</div>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      {error && (
        <div className="rounded-[var(--radius-card)] border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          New password
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
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

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm new password
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="••••••••"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 size={16} className="animate-spin" />}
        Update password
      </Button>
    </form>
  );
}

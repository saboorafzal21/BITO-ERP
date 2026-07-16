"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await forgotPasswordAction(formData);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-[var(--radius-card)] border border-success/30 bg-success/10 p-4 text-sm text-success">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
        <div>
          If an account exists for that email, a reset link is on its way.
          <div className="mt-2">
            <Link href="/login" className="font-medium underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input id="email" name="email" type="email" placeholder="you@bito.pk" required />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 size={16} className="animate-spin" />}
        Send reset link
      </Button>
      <Link href="/login" className="block text-center text-sm text-muted hover:text-foreground">
        Back to sign in
      </Link>
    </form>
  );
}

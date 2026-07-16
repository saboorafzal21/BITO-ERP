import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <span className="text-2xl font-bold tracking-tight text-primary">BITO ERP</span>
        <h2 className="mt-6 text-2xl font-semibold text-foreground">Reset your password</h2>
        <p className="mt-1 text-sm text-muted">
          Enter your account email and we&apos;ll send you a reset link.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, #FFC72C 0, transparent 40%), radial-gradient(circle at 80% 80%, #FFC72C 0, transparent 40%)",
          }}
        />
        <div className="relative z-10 text-2xl font-bold tracking-tight">BITO ERP</div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Run every branch from one screen.
          </h1>
          <p className="mt-4 text-white/80">
            Sales, inventory, purchasing and staff — synced in real time across
            every branch you operate.
          </p>
        </div>
        <div className="relative z-10 text-sm text-white/60">
          © {new Date().getFullYear()} BITO. All rights reserved.
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="text-2xl font-bold tracking-tight text-primary">BITO ERP</span>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Create your account</h2>
          <p className="mt-1 text-sm text-muted">Get started with BITO ERP</p>
          <Suspense fallback={null}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

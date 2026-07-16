"use client";

import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import { logoutAction } from "@/lib/actions/auth";
import type { AppUser } from "@/lib/types/database";

export function Topbar({ user, branchName }: { user: AppUser; branchName: string }) {
  const initials = user.full_name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-5">
      <div className="flex items-center gap-3">
        <div className="hidden text-sm text-muted md:block">
          <span className="font-medium text-foreground">{branchName}</span>
        </div>
        <div className="relative hidden w-72 sm:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input placeholder="Search orders, products, customers…" className="pl-9" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-muted hover:bg-muted-bg hover:text-foreground">
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="group relative">
          <button className="flex items-center gap-2 rounded-[var(--radius-card)] p-1.5 hover:bg-muted-bg">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {initials}
            </div>
            <div className="hidden text-left text-sm md:block">
              <div className="font-medium leading-tight">{user.full_name}</div>
              <div className="text-xs capitalize leading-tight text-muted">{user.role}</div>
            </div>
          </button>

          <div className="invisible absolute right-0 mt-1 w-44 rounded-[var(--radius-card)] border border-border bg-card p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
            <a href="/settings/profile" className="block rounded-md px-3 py-2 text-sm hover:bg-muted-bg">
              My profile
            </a>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}

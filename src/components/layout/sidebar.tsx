"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types/database";
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Boxes,
  Truck,
  Users,
  UserCog,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  ChefHat,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "admin", "manager", "cashier"] },
  { label: "POS", href: "/pos", icon: ShoppingCart, roles: ["owner", "admin", "manager", "cashier"] },
  { label: "Kitchen", href: "/kitchen", icon: ChefHat, roles: ["owner", "admin", "manager", "kitchen"] },
  { label: "Menu", href: "/menu", icon: UtensilsCrossed, roles: ["owner", "admin", "manager"] },
  { label: "Inventory", href: "/inventory", icon: Boxes, roles: ["owner", "admin", "manager"] },
  { label: "Purchasing", href: "/purchasing", icon: Truck, roles: ["owner", "admin", "manager"] },
  { label: "Customers", href: "/customers", icon: Users, roles: ["owner", "admin", "manager", "cashier"] },
  { label: "Employees", href: "/employees", icon: UserCog, roles: ["owner", "admin", "manager"] },
  { label: "Expenses", href: "/expenses", icon: Receipt, roles: ["owner", "admin", "manager"] },
  { label: "Reports", href: "/reports", icon: BarChart3, roles: ["owner", "admin", "manager"] },
  { label: "Notifications", href: "/notifications", icon: Bell, roles: ["owner", "admin", "manager", "cashier", "kitchen"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["owner", "admin"] },
];

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white">
          B
        </div>
        <span className="text-lg font-bold tracking-tight">BITO ERP</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-card)] px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-muted-bg hover:text-foreground"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

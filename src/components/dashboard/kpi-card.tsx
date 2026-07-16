import { Card, CardContent } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  tone?: "default" | "success" | "danger";
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                tone === "success" && "text-success",
                tone === "danger" && "text-danger",
                tone === "default" && "text-muted"
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon size={20} />
        </div>
      </CardContent>
    </Card>
  );
}

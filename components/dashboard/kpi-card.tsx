import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive";
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "tabular text-2xl font-semibold",
              tone === "success" && "text-success",
              tone === "warning" && "text-warning",
              tone === "destructive" && "text-destructive"
            )}
          >
            {value}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md",
            tone === "default" && "bg-primary/10 text-primary",
            tone === "success" && "bg-success/10 text-success",
            tone === "warning" && "bg-warning/10 text-warning",
            tone === "destructive" && "bg-destructive/10 text-destructive"
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

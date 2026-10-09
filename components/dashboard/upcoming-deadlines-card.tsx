import { CheckSquare, Receipt } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { UpcomingDeadline } from "@/services/dashboard.service";

export function UpcomingDeadlinesCard({ deadlines }: { deadlines: UpcomingDeadline[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Prossime scadenze</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {deadlines.length === 0 && <p className="text-sm text-muted-foreground">Nessuna scadenza imminente.</p>}
        {deadlines.map((item) => {
          const Icon = item.type === "task" ? CheckSquare : Receipt;
          return (
            <div key={`${item.type}-${item.id}`} className="flex items-center gap-3">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <p className="min-w-0 flex-1 truncate text-sm">{item.label}</p>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.date)}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

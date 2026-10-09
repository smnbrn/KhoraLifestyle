import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { ActivityEntry } from "@/services/dashboard.service";

export function ActivityFeedCard({ activity }: { activity: ActivityEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attività recenti</CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 && <p className="text-sm text-muted-foreground">Nessuna attività ancora.</p>}
        <ol className="space-y-3">
          {activity.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="flex-1">{entry.description}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(entry.date)}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

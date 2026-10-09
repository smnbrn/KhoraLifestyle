"use client";

import Link from "next/link";
import { Bell, CheckSquare, Receipt, FolderKanban, Layers, Home, Car, Plane } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/services/notifications.service";

const ICONS = {
  task: CheckSquare,
  invoice: Receipt,
  project: FolderKanban,
  phase: Layers,
  rental: Home,
  vehicle: Car,
  trip: Plane,
} as const;

export function NotificationsBell({ notifications }: { notifications: Notification[] }) {
  const overdueCount = notifications.filter((n) => n.overdue).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          {notifications.length > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium text-white ${
                overdueCount > 0 ? "bg-destructive" : "bg-warning"
              }`}
            >
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
          <span className="sr-only">Notifiche</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Scadenze imminenti</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">Nessuna scadenza nei prossimi giorni.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <DropdownMenuItem key={n.id} asChild>
                  <Link href={n.href} className="flex items-start gap-2">
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{n.label}</span>
                    <Badge variant={n.overdue ? "destructive" : "warning"} className="shrink-0">
                      {formatDate(n.date)}
                    </Badge>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

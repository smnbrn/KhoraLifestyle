"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskFormDialog } from "./task-form-dialog";
import { deleteTask } from "./actions";
import type { TaskListItem } from "@/services/tasks.service";
import { toTaskStatus, toPriority } from "@/lib/enum-guards";

export function TaskRowActions({
  task,
  clients,
  projects,
}: {
  task: TaskListItem;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTask(task.id);
      if (result.success) {
        toast.success("Task eliminato");
        router.refresh();
      } else {
        toast.error(result.error);
      }
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontal />
            <span className="sr-only">Azioni</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <TaskFormDialog
            clients={clients}
            projects={projects}
            legacyEnd={task.duration_days == null ? task.due_date : null}
            task={{
              id: task.id,
              title: task.title,
              description: task.description ?? undefined,
              projectId: task.project_id ?? undefined,
              clientId: task.client_id ?? undefined,
              status: toTaskStatus(task.status),
              priority: toPriority(task.priority),
              startDate: task.start_date ?? undefined,
              durationDays: task.duration_days != null ? String(task.duration_days) : undefined,
              timelineRunning: task.timeline_running,
              notes: task.notes ?? undefined,
            }}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil />
                Modifica
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <Trash2 />
            Elimina
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo task?</AlertDialogTitle>
            <AlertDialogDescription>L&apos;operazione non si può annullare.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

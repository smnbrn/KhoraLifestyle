"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
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
import { ProjectFormDialog } from "./project-form-dialog";
import { toggleArchiveProject, deleteProject } from "./actions";
import type { ProjectListItem } from "@/services/projects.service";
import { projectToFormDefaults } from "@/lib/project-defaults";

export function ProjectRowActions({
  project,
  clients,
}: {
  project: ProjectListItem;
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isArchived = Boolean(project.archived_at);

  function handleToggleArchive() {
    startTransition(async () => {
      const result = await toggleArchiveProject(project.id, !isArchived);
      if (result.success) {
        toast.success(isArchived ? "Progetto ripristinato" : "Progetto archiviato");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.success) {
        toast.success("Progetto eliminato");
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
          <ProjectFormDialog
            clients={clients}
            project={projectToFormDefaults(project)}
            legacyEnd={project.duration_days == null ? project.expected_end_date : null}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil />
                Modifica
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem onSelect={handleToggleArchive} disabled={isPending}>
            {isArchived ? <ArchiveRestore /> : <Archive />}
            {isArchived ? "Ripristina" : "Archivia"}
          </DropdownMenuItem>
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
            <AlertDialogTitle>Eliminare questo progetto?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;operazione non si può annullare. Se il progetto ha task, preventivi o
              fatture collegati, l&apos;eliminazione verrà bloccata — in quel caso usa
              &quot;Archivia&quot; invece.
            </AlertDialogDescription>
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

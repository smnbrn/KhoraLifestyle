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
import { ClientFormDialog } from "./client-form-dialog";
import { toggleArchiveClient, deleteClient } from "./actions";
import type { ClientListItem } from "@/services/clients.service";

export function ClientRowActions({ client }: { client: ClientListItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isArchived = Boolean(client.archived_at);

  function handleToggleArchive() {
    startTransition(async () => {
      const result = await toggleArchiveClient(client.id, !isArchived);
      if (result.success) {
        toast.success(isArchived ? "Cliente ripristinato" : "Cliente archiviato");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteClient(client.id);
      if (result.success) {
        toast.success("Cliente eliminato");
        router.refresh();
      } else {
        toast.error(result.error);
      }
      setConfirmOpen(false);
    });
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontal />
            <span className="sr-only">Azioni</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ClientFormDialog
            onClose={() => setMenuOpen(false)}
            client={{
              id: client.id,
              name: client.name,
              referentName: client.referent_name ?? undefined,
              email: client.email ?? undefined,
              phone: client.phone ?? undefined,
            }}
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
            <AlertDialogTitle>Eliminare questo cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;operazione non si può annullare. Se il cliente ha progetti, preventivi o
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

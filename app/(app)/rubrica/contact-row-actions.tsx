"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { ContactFormDialog } from "./contact-form-dialog";
import { deleteContact, toggleArchiveContact } from "./actions";
import type { ContactListItem } from "@/services/contacts.service";

export function ContactRowActions({
  contact,
  clients,
}: {
  contact: ContactListItem;
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const archived = Boolean(contact.archived_at);

  function run(action: () => Promise<{ success: boolean } & { error?: string }>, ok: string) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(ok);
        router.refresh();
      } else {
        toast.error(result.error ?? "Operazione non riuscita.");
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
          <ContactFormDialog
            clients={clients}
            contact={{
              id: contact.id,
              name: contact.name,
              kind: contact.kind,
              company: contact.company ?? undefined,
              role: contact.role ?? undefined,
              email: contact.email ?? undefined,
              phone: contact.phone ?? undefined,
              clientId: contact.client_id ?? undefined,
              notes: contact.notes ?? undefined,
            }}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Pencil />
                Modifica
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem
            disabled={isPending}
            onSelect={() => run(() => toggleArchiveContact(contact.id, !archived), archived ? "Contatto ripristinato" : "Contatto archiviato")}
          >
            {archived ? <ArchiveRestore /> : <Archive />}
            {archived ? "Ripristina" : "Archivia"}
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
            <AlertDialogTitle>Eliminare {contact.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Verrà tolto anche dai progetti in cui è coinvolto. L&apos;operazione non si può annullare.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => run(() => deleteContact(contact.id), "Contatto eliminato")}
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

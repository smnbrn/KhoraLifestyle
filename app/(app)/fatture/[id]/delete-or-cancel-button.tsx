"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Ban } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteOrCancel } from "../actions";

export function DeleteOrCancelButton({ invoiceId, status }: { invoiceId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const isDraft = status === "draft";

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteOrCancel(invoiceId, status);
      if (result.success) {
        toast.success(isDraft ? "Fattura eliminata" : "Fattura annullata");
        router.push(isDraft ? "/fatture" : `/fatture/${invoiceId}`);
        if (!isDraft) router.refresh();
      } else {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }

  if (status === "cancelled") return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          {isDraft ? <Trash2 /> : <Ban />}
          {isDraft ? "Elimina" : "Annulla"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isDraft ? "Eliminare questa fattura?" : "Annullare questa fattura?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isDraft
              ? "L'operazione non si può annullare."
              : "Una volta emessa, una fattura non si elimina fisicamente per non rompere la sequenza di numerazione — verrà solo marcata come annullata."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDraft ? "Elimina" : "Conferma annullamento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

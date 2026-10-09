"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import type { ActionResult } from "@/lib/action-result";

type Note = { id: string; content: string; created_at: string };

// Generico: usato sia dalla pagina Cliente che dalla pagina Progetto,
// passando le rispettive Server Action per aggiungere/eliminare.
export function NotesTab({
  notes,
  onAdd,
  onRemove,
}: {
  notes: Note[];
  onAdd: (content: string) => Promise<ActionResult>;
  onRemove: (noteId: string) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    const content = String(formData.get("content") ?? "");
    startTransition(async () => {
      const result = await onAdd(content);
      if (result.success) {
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      const result = await onRemove(noteId);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Textarea name="content" placeholder="Scrivi una nota…" rows={2} className="flex-1" required />
        <Button type="submit" disabled={isPending}>
          Aggiungi
        </Button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessuna nota ancora.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(note.created_at)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={isPending}
                onClick={() => handleDelete(note.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

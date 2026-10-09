"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadDocumentAction } from "@/app/(app)/documenti/actions";
import type { DocumentLink } from "@/services/documents.service";

export function DocumentUploadDialog({ trigger, link }: { trigger: ReactNode; link: DocumentLink }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Seleziona un file.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadDocumentAction(formData, link);
      if (result.success) {
        toast.success("Documento caricato");
        setOpen(false);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Carica documento</DialogTitle>
            <DialogDescription>PDF, JPG, PNG, DOCX o XLSX — massimo 10 MB.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="file-upload" className="sr-only">
              File
            </Label>
            <Input
              id="file-upload"
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.doc,.xls"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              <UploadCloud />
              {isPending ? "Caricamento…" : "Carica"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

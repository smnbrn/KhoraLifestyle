"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { FileTypeIcon } from "@/components/shared/file-type-icon";
import { getDownloadUrl, removeDocument } from "./actions";
import type { DocumentListItem } from "@/services/documents.service";

export function DocumentRow({ doc }: { doc: DocumentListItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const linkedTo = doc.clients
    ? { label: doc.clients.name, href: null }
    : doc.projects
      ? { label: doc.projects.name, href: null }
      : doc.quotes
        ? { label: `Preventivo ${doc.quotes.quote_number}`, href: null }
        : doc.invoices
          ? { label: `Fattura ${doc.invoices.invoice_number}`, href: null }
          : null;

  function handleDownload() {
    startTransition(async () => {
      const result = await getDownloadUrl(doc.storage_path);
      if (result.success) {
        window.open(result.data.url, "_blank");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await removeDocument(doc.id);
      if (result.success) {
        toast.success("Documento eliminato");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <FileTypeIcon mimeType={doc.mime_type} className="size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{doc.file_name}</p>
          <p className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {linkedTo && <Badge variant="outline">{linkedTo.label}</Badge>}
        <Button variant="ghost" size="icon" className="size-8" disabled={isPending} onClick={handleDownload}>
          <Download className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          disabled={isPending}
          onClick={handleDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getDownloadUrl, removeDocument } from "@/app/(app)/documenti/actions";
import { FileTypeIcon } from "./file-type-icon";

type Doc = { id: string; file_name: string; mime_type: string | null; file_size: number | null; storage_path: string; created_at: string };

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({ documents }: { documents: Doc[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDownload(storagePath: string) {
    startTransition(async () => {
      const result = await getDownloadUrl(storagePath);
      if (result.success) {
        window.open(result.data.url, "_blank");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await removeDocument(id);
      if (result.success) {
        toast.success("Documento eliminato");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessun documento caricato.</p>;
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => {
        return (
          <li key={doc.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileTypeIcon mimeType={doc.mime_type} className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(doc.created_at)}
                  {doc.file_size ? ` · ${formatSize(doc.file_size)}` : ""}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={isPending}
                onClick={() => handleDownload(doc.storage_path)}
              >
                <Download className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                disabled={isPending}
                onClick={() => handleDelete(doc.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

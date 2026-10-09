"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageDialog } from "@/components/layout/page-dialog";
import type { PageSection } from "@/lib/constants/second-brain";
import { removePage } from "../actions";

export function PageHeaderActions({ page }: { page: { id: string; title: string; icon: string | null; section: PageSection } }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Eliminare la pagina "${page.title}" con tutto il suo contenuto? L'operazione non si può annullare.`)) return;
    startTransition(async () => {
      const result = await removePage(page.id);
      if (result.success) {
        toast.success("Pagina eliminata");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <PageDialog
        page={page}
        trigger={
          <Button variant="outline" size="sm">
            <Pencil />
            Rinomina
          </Button>
        }
      />
      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete} disabled={isPending}>
        <Trash2 />
        Elimina
      </Button>
    </div>
  );
}

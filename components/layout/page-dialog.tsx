"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAGE_SECTION, type PageSection } from "@/lib/constants/second-brain";
import { createNewPage, editPage } from "@/app/(app)/pagine/actions";

/** Crea (o, con `page`, modifica) una pagina personalizzata: titolo, icona (emoji) e sezione del menu. */
export function PageDialog({
  trigger,
  defaultSection = "general",
  page,
  onDone,
}: {
  trigger: ReactNode;
  defaultSection?: PageSection;
  page?: { id: string; title: string; icon: string | null; section: PageSection };
  onDone?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(page?.title ?? "");
  const [icon, setIcon] = useState(page?.icon ?? "");
  const [section, setSection] = useState<PageSection>(page?.section ?? defaultSection);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      if (page) {
        const result = await editPage(page.id, { title, icon, section });
        if (!result.success) return void toast.error(result.error);
        toast.success("Pagina aggiornata");
        setOpen(false);
        onDone?.();
        router.refresh();
        return;
      }
      const result = await createNewPage({ title, icon, section });
      if (!result.success) return void toast.error(result.error);
      toast.success("Pagina creata");
      setOpen(false);
      setTitle("");
      setIcon("");
      onDone?.();
      router.push(`/pagine/${result.data.id}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{page ? "Modifica pagina" : "Nuova pagina"}</DialogTitle>
            <DialogDescription>
              Dentro la pagina potrai aggiungere testo, elenchi di spunte e tabelle.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <div className="space-y-2">
                <Label htmlFor="page-icon">Icona</Label>
                <Input id="page-icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} placeholder="📘" className="text-center" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-title">Titolo *</Label>
                <Input id="page-title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sezione del menu</Label>
              <Select value={section} onValueChange={(v) => setSection(v as PageSection)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAGE_SECTION).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? "Salvataggio…" : page ? "Salva" : "Crea pagina"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

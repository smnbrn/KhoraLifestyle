"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCategory } from "./actions";

export function CategoryQuickAdd({
  type,
  open,
  onOpenChange,
  onCreated,
}: {
  type: "income" | "expense";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: { id: string; name: string }) => void;
}) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!name.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("type", type);
      const result = await addCategory(formData);
      if (result.success) {
        onCreated(result.data);
        setName("");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova categoria</DialogTitle>
          <DialogDescription>Verrà aggiunta alle tue categorie di {type === "income" ? "entrata" : "uscita"}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="new-category-name">Nome</Label>
          <Input
            id="new-category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSubmit())}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending ? "Creazione…" : "Crea categoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

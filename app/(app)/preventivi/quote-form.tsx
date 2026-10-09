"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { QUOTE_STATUS } from "@/lib/constants";
import { quoteSchema, type QuoteInput, calculateLineTotal, calculateDocumentTotals } from "@/schemas/quote.schema";

const NONE = "none";

export function QuoteForm({
  defaultValues,
  clients,
  projects,
  action,
  submitLabel,
}: {
  defaultValues?: Partial<QuoteInput> & { id?: string };
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  action: (formData: FormData) => Promise<{ success: boolean; error?: string } | void>;
  submitLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuoteInput>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      status: "draft",
      issueDate: new Date().toISOString().slice(0, 10),
      items: [{ description: "", quantity: "1", unitPrice: "0", discountPercent: "0", vatRate: "22" }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const totals = calculateDocumentTotals(watchedItems ?? []);

  function onSubmit(values: QuoteInput) {
    startTransition(async () => {
      const formData = new FormData();
      if (defaultValues?.id) formData.set("id", defaultValues.id);
      formData.set("clientId", values.clientId);
      formData.set("projectId", values.projectId === NONE ? "" : values.projectId ?? "");
      formData.set("issueDate", values.issueDate);
      formData.set("expiryDate", values.expiryDate ?? "");
      formData.set("status", values.status);
      formData.set("notes", values.notes ?? "");
      formData.set("itemsJson", JSON.stringify(values.items));

      const result = await action(formData);
      if (result && !result.success) {
        toast.error(result.error ?? "Si è verificato un errore.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dati generali</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Cliente *</Label>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.clientId && <p className="text-sm text-destructive">{errors.clientId.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Progetto</Label>
            <Controller
              name="projectId"
              control={control}
              render={({ field }) => (
                <Select value={field.value || NONE} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nessuno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Nessuno</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">Data *</Label>
            <Input id="issueDate" type="date" {...register("issueDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Data scadenza</Label>
            <Input id="expiryDate" type="date" {...register("expiryDate")} />
          </div>
          <div className="space-y-2">
            <Label>Stato</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUOTE_STATUS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Voci</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ description: "", quantity: "1", unitPrice: "0", discountPercent: "0", vatRate: "22" })}
          >
            <Plus />
            Aggiungi riga
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.items?.message && <p className="text-sm text-destructive">{errors.items.message}</p>}
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-2 rounded-md border p-3">
              <div className="col-span-12 sm:col-span-4">
                <Label className="text-xs text-muted-foreground">Descrizione</Label>
                <Input {...register(`items.${index}.description`)} />
              </div>
              <div className="col-span-4 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Qtà</Label>
                <Input type="number" step="0.01" min="0" {...register(`items.${index}.quantity`)} />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Prezzo unit.</Label>
                <Input type="number" step="0.01" min="0" {...register(`items.${index}.unitPrice`)} />
              </div>
              <div className="col-span-4 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Sconto %</Label>
                <Input type="number" step="0.01" min="0" max="100" {...register(`items.${index}.discountPercent`)} />
              </div>
              <div className="col-span-4 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">IVA %</Label>
                <Input type="number" step="0.01" min="0" {...register(`items.${index}.vatRate`)} />
              </div>
              <div className="col-span-6 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Totale riga</Label>
                <p className="tabular flex h-9 items-center text-sm font-medium">
                  {formatCurrency(calculateLineTotal(watchedItems?.[index] ?? field))}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-end justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length <= 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="ml-auto max-w-xs space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Imponibile</span>
            <span className="tabular">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA</span>
            <span className="tabular">{formatCurrency(totals.vatAmount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Totale</span>
            <span className="tabular">{formatCurrency(totals.total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Note</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={3} {...register("notes")} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annulla
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvataggio…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

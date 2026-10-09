"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { profileSchema, type ProfileInput } from "@/schemas/profile.schema";
import { saveProfile } from "./actions";

export function SettingsForm({ defaultValues }: { defaultValues: Partial<ProfileInput> }) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { country: "Italia", defaultVatRate: 22, ...defaultValues },
  });

  function onSubmit(values: ProfileInput) {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.set(key, value === undefined || value === null ? "" : String(value));
      });
      const result = await saveProfile(formData);
      if (result.success) {
        toast.success("Impostazioni salvate");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome e cognome</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Ragione sociale</Label>
          <Input id="companyName" {...register("companyName")} />
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vatNumber">Partita IVA</Label>
          <Input id="vatNumber" {...register("vatNumber")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxCode">Codice fiscale</Label>
          <Input id="taxCode" {...register("taxCode")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Indirizzo</Label>
          <Input id="address" {...register("address")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Città</Label>
          <Input id="city" {...register("city")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">CAP</Label>
          <Input id="postalCode" {...register("postalCode")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="province">Provincia</Label>
          <Input id="province" {...register("province")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Paese</Label>
          <Input id="country" {...register("country")} />
          {errors.country && <p className="text-sm text-destructive">{errors.country.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefono</Label>
          <Input id="phone" {...register("phone")} />
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="defaultVatRate">Aliquota IVA predefinita (%)</Label>
          <Input id="defaultVatRate" type="number" step="0.01" {...register("defaultVatRate")} />
          {errors.defaultVatRate && (
            <p className="text-sm text-destructive">{errors.defaultVatRate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quoteNumberPrefix">Prefisso preventivi</Label>
          <Input id="quoteNumberPrefix" placeholder="es. PRE-" {...register("quoteNumberPrefix")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoiceNumberPrefix">Prefisso fatture</Label>
          <Input id="invoiceNumberPrefix" placeholder="es. FT-" {...register("invoiceNumberPrefix")} />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvataggio…" : "Salva impostazioni"}
      </Button>
    </form>
  );
}

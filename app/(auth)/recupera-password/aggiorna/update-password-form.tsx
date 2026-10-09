"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/schemas/auth.schema";
import { updatePassword } from "./actions";

export function UpdatePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({ resolver: zodResolver(updatePasswordSchema) });

  function onSubmit(values: UpdatePasswordInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("password", values.password);
      formData.set("confirmPassword", values.confirmPassword);
      const result = await updatePassword(formData);
      if (result && !result.success) {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">Nuova password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Conferma nuova password</Label>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Aggiornamento…" : "Imposta nuova password"}
      </Button>
    </form>
  );
}

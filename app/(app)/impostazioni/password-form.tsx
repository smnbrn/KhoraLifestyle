"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordSchema, type ChangePasswordInput } from "@/schemas/auth.schema";
import { changePassword } from "./actions";

export function PasswordForm() {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  function onSubmit(values: ChangePasswordInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("currentPassword", values.currentPassword);
      formData.set("password", values.password);
      formData.set("confirmPassword", values.confirmPassword);
      const result = await changePassword(formData);
      if (result.success) {
        toast.success("Password aggiornata");
        reset({ currentPassword: "", password: "", confirmPassword: "" });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Password attuale</Label>
        <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
        {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nuova password</Label>
          <Input id="newPassword" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Conferma nuova password</Label>
          <Input id="confirmNewPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Aggiornamento…" : "Cambia password"}
      </Button>
    </form>
  );
}

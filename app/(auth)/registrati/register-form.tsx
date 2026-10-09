"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/schemas/auth.schema";
import { register as registerAction } from "./actions";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [emailSent, setEmailSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  function onSubmit(values: RegisterInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("fullName", values.fullName);
      formData.set("email", values.email);
      formData.set("password", values.password);
      formData.set("confirmPassword", values.confirmPassword);

      const result = await registerAction(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.data.emailConfirmationRequired) {
        setEmailSent(true);
      } else {
        router.push("/dashboard");
      }
    });
  }

  if (emailSent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <MailCheck className="size-8 text-success" />
        <p className="text-sm text-muted-foreground">
          Controlla la tua email per confermare l&apos;account prima di accedere.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="fullName">Nome e cognome</Label>
        <Input id="fullName" autoComplete="name" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Conferma password</Label>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creazione account…" : "Crea account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Hai già un account?{" "}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Accedi
        </Link>
      </p>
    </form>
  );
}

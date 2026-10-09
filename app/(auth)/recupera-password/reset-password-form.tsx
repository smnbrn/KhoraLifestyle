"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth.schema";
import { requestPasswordReset } from "./actions";

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  function onSubmit(values: ResetPasswordInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", values.email);
      const result = await requestPasswordReset(formData);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <MailCheck className="size-8 text-success" />
        <p className="text-sm text-muted-foreground">
          Se l&apos;indirizzo è registrato, riceverai a breve un&apos;email con le istruzioni.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Invio in corso…" : "Invia istruzioni"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Torna al login
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logout } from "@/app/(app)/actions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => logout())}
    >
      <LogOut />
      {isPending ? "Uscita…" : "Esci"}
    </Button>
  );
}

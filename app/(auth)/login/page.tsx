import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants/brand";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confermato?: string; errore?: string }>;
}) {
  const params = await searchParams;
  const confirmed = params.confermato === "1";
  const invalidLink = params.errore === "link_non_valido";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accedi</CardTitle>
        <CardDescription>Entra in {APP_NAME}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {confirmed && (
          <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            Email confermata. Ora puoi accedere.
          </p>
        )}
        {invalidLink && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Il link non è valido o è scaduto. Richiedine uno nuovo.
          </p>
        )}
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Non hai un account?{" "}
          <Link href="/registrati" className="font-medium text-foreground hover:underline">
            Registrati
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants/brand";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accedi</CardTitle>
        <CardDescription>Entra in {APP_NAME}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

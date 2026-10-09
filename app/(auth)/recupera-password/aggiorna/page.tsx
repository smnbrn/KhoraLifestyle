import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdatePasswordForm } from "./update-password-form";

export default function AggiornaPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Imposta una nuova password</CardTitle>
        <CardDescription>Scegline una che non usi già altrove</CardDescription>
      </CardHeader>
      <CardContent>
        <UpdatePasswordForm />
      </CardContent>
    </Card>
  );
}

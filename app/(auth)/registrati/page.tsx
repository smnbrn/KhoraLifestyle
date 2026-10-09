import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crea un account</CardTitle>
        <CardDescription>Inizia a gestire la tua attività</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}

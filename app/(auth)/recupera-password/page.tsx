import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

export default function RecuperaPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recupera password</CardTitle>
        <CardDescription>Ti invieremo un link per reimpostarla</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}

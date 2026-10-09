import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/services/auth.service";
import { getProfile } from "@/services/profiles.service";
import { SettingsForm } from "./settings-form";

export default async function ImpostazioniPage() {
  const user = await getCurrentUser();
  const { data: profile } = user ? await getProfile(user.id) : { data: null };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Impostazioni</CardTitle>
          <CardDescription>
            Questi dati compariranno su preventivi e fatture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            defaultValues={{
              fullName: profile?.full_name ?? "",
              companyName: profile?.company_name ?? "",
              vatNumber: profile?.vat_number ?? "",
              taxCode: profile?.tax_code ?? "",
              address: profile?.address ?? "",
              city: profile?.city ?? "",
              postalCode: profile?.postal_code ?? "",
              province: profile?.province ?? "",
              country: profile?.country ?? "Italia",
              phone: profile?.phone ?? "",
              defaultVatRate: profile?.default_vat_rate ?? 22,
              invoiceNumberPrefix: profile?.invoice_number_prefix ?? "",
              quoteNumberPrefix: profile?.quote_number_prefix ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

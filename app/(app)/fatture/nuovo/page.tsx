import { getCurrentUser } from "@/services/auth.service";
import { listActiveClientsForSelect, listActiveProjectsForSelect } from "@/services/projects.service";
import { InvoiceForm } from "../invoice-form";
import { createInvoiceAndRedirect } from "../actions";

export default async function NuovaFatturaPage() {
  const user = await getCurrentUser();
  const [clients, projects] = await Promise.all([
    listActiveClientsForSelect(user!.id),
    listActiveProjectsForSelect(user!.id),
  ]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nuova fattura</h1>
        <p className="text-sm text-muted-foreground">Il numero verrà assegnato automaticamente al salvataggio.</p>
      </div>
      <InvoiceForm clients={clients} projects={projects} action={createInvoiceAndRedirect} submitLabel="Crea fattura" />
    </div>
  );
}

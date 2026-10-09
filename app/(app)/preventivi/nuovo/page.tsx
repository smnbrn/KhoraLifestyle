import { getCurrentUser } from "@/services/auth.service";
import { listActiveClientsForSelect, listActiveProjectsForSelect } from "@/services/projects.service";
import { QuoteForm } from "../quote-form";
import { createQuoteAndRedirect } from "../actions";

export default async function NuovoPreventivoPage() {
  const user = await getCurrentUser();
  const [clients, projects] = await Promise.all([
    listActiveClientsForSelect(user!.id),
    listActiveProjectsForSelect(user!.id),
  ]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nuovo preventivo</h1>
        <p className="text-sm text-muted-foreground">Il numero verrà assegnato automaticamente al salvataggio.</p>
      </div>
      <QuoteForm clients={clients} projects={projects} action={createQuoteAndRedirect} submitLabel="Crea preventivo" />
    </div>
  );
}

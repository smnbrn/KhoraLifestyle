import { notFound } from "next/navigation";

import { getCurrentUser } from "@/services/auth.service";
import { getQuoteWithItems } from "@/services/quotes.service";
import { listActiveClientsForSelect, listActiveProjectsForSelect } from "@/services/projects.service";
import { QuoteForm } from "../../quote-form";
import { updateQuoteAndRedirect } from "../../actions";
import { toQuoteStatus } from "@/lib/enum-guards";

export default async function ModificaPreventivoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const [result, clients, projects] = await Promise.all([
    getQuoteWithItems(user!.id, id),
    listActiveClientsForSelect(user!.id),
    listActiveProjectsForSelect(user!.id),
  ]);

  if (!result) notFound();
  const { quote, items } = result;

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Modifica preventivo {quote.quote_number}</h1>
      </div>
      <QuoteForm
        clients={clients}
        projects={projects}
        action={updateQuoteAndRedirect}
        submitLabel="Salva modifiche"
        defaultValues={{
          id: quote.id,
          clientId: quote.client_id,
          projectId: quote.project_id ?? undefined,
          issueDate: quote.issue_date,
          expiryDate: quote.expiry_date ?? undefined,
          status: toQuoteStatus(quote.status),
          notes: quote.notes ?? undefined,
          items: items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unit_price),
            discountPercent: String(item.discount_percent),
            vatRate: String(item.vat_rate),
          })),
        }}
      />
    </div>
  );
}

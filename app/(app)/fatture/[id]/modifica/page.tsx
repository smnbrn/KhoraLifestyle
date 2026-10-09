import { notFound } from "next/navigation";

import { getCurrentUser } from "@/services/auth.service";
import { getInvoiceWithItems } from "@/services/invoices.service";
import { listActiveClientsForSelect, listActiveProjectsForSelect } from "@/services/projects.service";
import { InvoiceForm } from "../../invoice-form";
import { updateInvoiceAndRedirect } from "../../actions";
import { toInvoiceStatus } from "@/lib/enum-guards";

export default async function ModificaFatturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const [result, clients, projects] = await Promise.all([
    getInvoiceWithItems(user!.id, id),
    listActiveClientsForSelect(user!.id),
    listActiveProjectsForSelect(user!.id),
  ]);

  if (!result) notFound();
  const { invoice, items } = result;

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Modifica fattura {invoice.invoice_number}</h1>
      </div>
      <InvoiceForm
        clients={clients}
        projects={projects}
        action={updateInvoiceAndRedirect}
        submitLabel="Salva modifiche"
        defaultValues={{
          id: invoice.id,
          clientId: invoice.client_id,
          projectId: invoice.project_id ?? undefined,
          quoteId: invoice.quote_id ?? undefined,
          issueDate: invoice.issue_date,
          dueDate: invoice.due_date ?? undefined,
          status: toInvoiceStatus(invoice.status),
          notes: invoice.notes ?? undefined,
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

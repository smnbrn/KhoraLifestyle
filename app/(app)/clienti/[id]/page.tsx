import { notFound } from "next/navigation";
import { Pencil, Mail, Phone, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { getCurrentUser } from "@/services/auth.service";
import { getClientById, getClientFinancials } from "@/services/clients.service";
import { listClientNotes } from "@/services/notes.service";
import {
  listProjectsByClient,
  listQuotesByClient,
  listInvoicesByClient,
  listPaymentsByClient,
} from "@/services/relations.service";
import { ClientFormDialog } from "../client-form-dialog";
import { NotesTab } from "@/components/shared/notes-tab";
import { ProjectsList, QuotesList, InvoicesList, PaymentsList } from "@/components/shared/relation-lists";
import { DocumentList } from "@/components/shared/document-list";
import { DocumentUploadDialog } from "@/components/shared/document-upload-dialog";
import { listDocumentsByClient } from "@/services/documents.service";
import { createClientNote, removeClientNote } from "./actions";
import { Plus } from "lucide-react";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const client = await getClientById(user!.id, id);

  if (!client) notFound();

  const [financials, notes, projects, quotes, invoices, payments, documents] = await Promise.all([
    getClientFinancials(id),
    listClientNotes(user!.id, id),
    listProjectsByClient(user!.id, id),
    listQuotesByClient(user!.id, id),
    listInvoicesByClient(user!.id, id),
    listPaymentsByClient(user!.id, id),
    listDocumentsByClient(user!.id, id),
  ]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground">{client.name}</h1>
            {client.archived_at && <Badge variant="secondary">Archiviato</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {client.referent_name && <span>{client.referent_name}</span>}
            {client.email && (
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" /> {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="size-3.5" /> {client.phone}
              </span>
            )}
            {client.city && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {client.city}
              </span>
            )}
          </div>
        </div>
        <ClientFormDialog
          client={{
            id: client.id,
            name: client.name,
            referentName: client.referent_name ?? undefined,
            email: client.email ?? undefined,
            phone: client.phone ?? undefined,
            vatNumber: client.vat_number ?? undefined,
            taxCode: client.tax_code ?? undefined,
            address: client.address ?? undefined,
            city: client.city ?? undefined,
            postalCode: client.postal_code ?? undefined,
            province: client.province ?? undefined,
            country: client.country ?? undefined,
            notes: client.notes ?? undefined,
          }}
          trigger={
            <Button variant="outline">
              <Pencil />
              Modifica
            </Button>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Totale fatturato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-xl font-semibold">{formatCurrency(financials.total_invoiced ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Totale incassato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-xl font-semibold text-success">{formatCurrency(financials.total_collected ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-muted-foreground">Da incassare</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tabular text-xl font-semibold text-warning">{formatCurrency(financials.total_outstanding ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progetti">
        <TabsList>
          <TabsTrigger value="progetti">Progetti ({projects.length})</TabsTrigger>
          <TabsTrigger value="preventivi">Preventivi ({quotes.length})</TabsTrigger>
          <TabsTrigger value="fatture">Fatture ({invoices.length})</TabsTrigger>
          <TabsTrigger value="pagamenti">Pagamenti ({payments.length})</TabsTrigger>
          <TabsTrigger value="documenti">Documenti ({documents.length})</TabsTrigger>
          <TabsTrigger value="note">Note ({notes.length})</TabsTrigger>
        </TabsList>
        <Card className="mt-3">
          <CardContent className="pt-6">
            <TabsContent value="progetti">
              <ProjectsList projects={projects} />
            </TabsContent>
            <TabsContent value="preventivi">
              <QuotesList quotes={quotes} />
            </TabsContent>
            <TabsContent value="fatture">
              <InvoicesList invoices={invoices} />
            </TabsContent>
            <TabsContent value="pagamenti">
              <PaymentsList payments={payments} />
            </TabsContent>
            <TabsContent value="documenti" className="space-y-3">
              <div className="flex justify-end">
                <DocumentUploadDialog
                  link={{ clientId: id }}
                  trigger={
                    <Button size="sm">
                      <Plus />
                      Carica documento
                    </Button>
                  }
                />
              </div>
              <DocumentList documents={documents} />
            </TabsContent>
            <TabsContent value="note">
              <NotesTab
                notes={notes}
                onAdd={createClientNote.bind(null, id)}
                onRemove={removeClientNote.bind(null, id)}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

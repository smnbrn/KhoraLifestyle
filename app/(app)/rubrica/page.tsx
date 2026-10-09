import Link from "next/link";
import { Mail, Phone, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSearchInput } from "@/components/shared/table-search-input";
import { StatusFilter } from "@/components/shared/status-filter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CONTACT_KIND } from "@/lib/constants/second-brain";
import { getCurrentUser } from "@/services/auth.service";
import { listContacts } from "@/services/contacts.service";
import { listActiveClientsForSelect } from "@/services/projects.service";
import { ContactFormDialog } from "./contact-form-dialog";
import { ContactRowActions } from "./contact-row-actions";

export default async function RubricaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; archiviati?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const showArchived = params.archiviati === "1";

  const [contacts, clients] = await Promise.all([
    listContacts(user!.id, { search: params.q, kind: params.tipo, showArchived }),
    listActiveClientsForSelect(user!.id),
  ]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Rubrica</h1>
          <p className="text-sm text-muted-foreground">
            {contacts.length} {contacts.length === 1 ? "persona" : "persone"} — da coinvolgere nei progetti.
          </p>
        </div>
        <ContactFormDialog
          clients={clients}
          trigger={
            <Button>
              <Plus />
              Nuovo contatto
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <TableSearchInput placeholder="Cerca per nome, azienda, email…" />
          <StatusFilter options={CONTACT_KIND} paramName="tipo" placeholder="Tutti i tipi" />
        </div>
        <Link
          href={showArchived ? "/rubrica" : "/rubrica?archiviati=1"}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          {showArchived ? "Mostra contatti attivi" : "Mostra archiviati"}
        </Link>
      </div>

      <Card className="py-0">
        {contacts.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Nessun contatto trovato.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Azienda / Ruolo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Contatti</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.name}
                    {c.clients?.name && <p className="text-xs font-normal text-muted-foreground">Cliente: {c.clients.name}</p>}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {[c.company, c.role].filter(Boolean).join(" · ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{CONTACT_KIND[c.kind as keyof typeof CONTACT_KIND] ?? c.kind}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    <div className="space-y-0.5">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-foreground">
                          <Mail className="size-3" /> {c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-foreground">
                          <Phone className="size-3" /> {c.phone}
                        </a>
                      )}
                      {!c.email && !c.phone && "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ContactRowActions contact={c} clients={clients} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

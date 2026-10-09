import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSearchInput } from "@/components/shared/table-search-input";
import { TablePagination } from "@/components/shared/table-pagination";
import { getCurrentUser } from "@/services/auth.service";
import { listClients } from "@/services/clients.service";
import { ClientsTable } from "./clients-table";
import { ClientFormDialog } from "./client-form-dialog";

export default async function ClientiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; archiviati?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const page = Number(params.page) || 1;
  const showArchived = params.archiviati === "1";

  const { clients, total, pageSize } = await listClients(user!.id, {
    search: params.q,
    page,
    showArchived,
  });

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clienti</h1>
          <p className="text-sm text-muted-foreground">{total} clienti {showArchived ? "archiviati" : "attivi"}</p>
        </div>
        <ClientFormDialog
          trigger={
            <Button>
              <Plus />
              Nuovo cliente
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TableSearchInput placeholder="Cerca per nome, referente o email…" />
        <Link
          href={showArchived ? "/clienti" : "/clienti?archiviati=1"}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          {showArchived ? "Mostra clienti attivi" : "Mostra archiviati"}
        </Link>
      </div>

      <Card className="py-0">
        <ClientsTable clients={clients} />
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/clienti"
          searchParams={params}
        />
      </Card>
    </div>
  );
}

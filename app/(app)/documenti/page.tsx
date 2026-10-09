import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSearchInput } from "@/components/shared/table-search-input";
import { TablePagination } from "@/components/shared/table-pagination";
import { DocumentUploadDialog } from "@/components/shared/document-upload-dialog";
import { getCurrentUser } from "@/services/auth.service";
import { listAllDocuments } from "@/services/documents.service";
import { DocumentRow } from "./document-row";

export default async function DocumentiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const page = Number(params.page) || 1;

  const { documents, total, pageSize } = await listAllDocuments(user!.id, { search: params.q, page });

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Documenti</h1>
          <p className="text-sm text-muted-foreground">{total} documenti</p>
        </div>
        <DocumentUploadDialog
          link={{}}
          trigger={
            <Button>
              <Plus />
              Carica documento
            </Button>
          }
        />
      </div>

      <TableSearchInput placeholder="Cerca per nome file…" />

      <Card className="divide-y py-0">
        {documents.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Nessun documento trovato.
          </div>
        ) : (
          documents.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
        )}
      </Card>
      <TablePagination page={page} pageSize={pageSize} total={total} basePath="/documenti" searchParams={params} />
    </div>
  );
}

import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSearchInput } from "@/components/shared/table-search-input";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusFilter } from "@/components/shared/status-filter";
import { INVOICE_STATUS } from "@/lib/constants";
import { getCurrentUser } from "@/services/auth.service";
import { listInvoices } from "@/services/invoices.service";
import { InvoicesTable } from "./invoices-table";

export default async function FatturePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; stato?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const page = Number(params.page) || 1;

  const { invoices, total, pageSize } = await listInvoices(user!.id, {
    search: params.q,
    status: params.stato,
    page,
  });

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Fatture</h1>
          <p className="text-sm text-muted-foreground">{total} fatture</p>
        </div>
        <Button asChild>
          <Link href="/fatture/nuovo">
            <Plus />
            Nuova fattura
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TableSearchInput placeholder="Cerca per numero…" />
        <StatusFilter options={INVOICE_STATUS} paramName="stato" placeholder="Tutti gli stati" />
      </div>

      <Card className="py-0">
        <InvoicesTable invoices={invoices} />
        <TablePagination page={page} pageSize={pageSize} total={total} basePath="/fatture" searchParams={params} />
      </Card>
    </div>
  );
}

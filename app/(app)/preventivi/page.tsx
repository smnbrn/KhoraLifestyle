import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSearchInput } from "@/components/shared/table-search-input";
import { TablePagination } from "@/components/shared/table-pagination";
import { StatusFilter } from "@/components/shared/status-filter";
import { QUOTE_STATUS } from "@/lib/constants";
import { getCurrentUser } from "@/services/auth.service";
import { listQuotes } from "@/services/quotes.service";
import { QuotesTable } from "./quotes-table";

export default async function PreventiviPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; stato?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const page = Number(params.page) || 1;

  const { quotes, total, pageSize } = await listQuotes(user!.id, {
    search: params.q,
    status: params.stato,
    page,
  });

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Preventivi</h1>
          <p className="text-sm text-muted-foreground">{total} preventivi</p>
        </div>
        <Button asChild>
          <Link href="/preventivi/nuovo">
            <Plus />
            Nuovo preventivo
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <TableSearchInput placeholder="Cerca per numero…" />
        <StatusFilter options={QUOTE_STATUS} paramName="stato" placeholder="Tutti gli stati" />
      </div>

      <Card className="py-0">
        <QuotesTable quotes={quotes} />
        <TablePagination page={page} pageSize={pageSize} total={total} basePath="/preventivi" searchParams={params} />
      </Card>
    </div>
  );
}

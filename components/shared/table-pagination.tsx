import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function TablePagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
  paramName = "page",
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  paramName?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v !== undefined) as [string, string][]
    );
    params.set(paramName, String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between border-t px-3 py-3 text-sm text-muted-foreground">
      <span>
        {from}–{to} di {total}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" disabled={page <= 1} asChild={page > 1}>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)}>
              <ChevronLeft />
            </Link>
          ) : (
            <ChevronLeft />
          )}
        </Button>
        <span className="px-2 tabular">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="icon" disabled={page >= totalPages} asChild={page < totalPages}>
          {page < totalPages ? (
            <Link href={hrefFor(page + 1)}>
              <ChevronRight />
            </Link>
          ) : (
            <ChevronRight />
          )}
        </Button>
      </div>
    </div>
  );
}

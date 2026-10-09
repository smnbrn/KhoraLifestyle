import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageDialog } from "@/components/layout/page-dialog";
import { PAGE_SECTION } from "@/lib/constants/second-brain";
import { getCurrentUser } from "@/services/auth.service";
import { listPages } from "@/services/pages.service";

export default async function PagesIndex() {
  const user = await getCurrentUser();
  const pages = await listPages(user!.id);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pagine</h1>
          <p className="text-sm text-muted-foreground">Le tue pagine personalizzate: testo, elenchi e tabelle.</p>
        </div>
        <PageDialog
          trigger={
            <Button>
              <Plus />
              Nuova pagina
            </Button>
          }
        />
      </div>
      {pages.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Nessuna pagina ancora: creane una per iniziare.</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <Link key={p.id} href={`/pagine/${p.id}`}>
              <Card className="flex-row items-center gap-3 px-4 py-4 transition-colors hover:bg-accent/40">
                <span className="text-xl">{p.icon ?? <FileText className="size-5 text-muted-foreground" />}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{PAGE_SECTION[p.section]}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

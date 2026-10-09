import Link from "next/link";
import { LineChart, Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalsPanel } from "@/components/shared/goals-panel";
import { TablePagination } from "@/components/shared/table-pagination";
import { formatCurrency } from "@/lib/utils";
import { getCurrentUser } from "@/services/auth.service";
import { getGoalsProgress } from "@/services/goals.service";
import { listActiveClientsForSelect, listActiveProjectsForSelect } from "@/services/projects.service";
import {
  ensureDefaultCategories,
  listCategories,
  listTransactions,
  getFinanceSummary,
} from "@/services/finance.service";
import { listCommissions } from "@/services/commissions.service";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { TransactionsTable } from "./transactions-table";
import { CommissionFormDialog } from "./commission-form-dialog";
import { CommissionsTable } from "./commissions-table";

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

export default async function FinanzePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; commissioniPage?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const userId = user!.id;
  const page = Number(params.page) || 1;
  const commissioniPage = Number(params.commissioniPage) || 1;

  await ensureDefaultCategories(userId);
  const { start, end } = monthRange();

  const year = new Date().getFullYear();
  const [summary, categories, { transactions, total, pageSize }, clients, projects, commissionsResult, financeGoals] =
    await Promise.all([
      getFinanceSummary(userId, start, end),
      listCategories(userId),
      listTransactions(userId, { page }),
      listActiveClientsForSelect(userId),
      listActiveProjectsForSelect(userId),
      listCommissions(userId, { page: commissioniPage }),
      getGoalsProgress(userId, year, { category: "finance" }),
    ]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        <h1 className="text-2xl font-semibold text-foreground">Finanze</h1>
        <p className="text-sm text-muted-foreground">Entrate, uscite e commissioni.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/finanze/investimenti">
            <LineChart /> Investimenti
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Entrate (mese)</p>
              <p className="tabular text-xl font-semibold text-success">{formatCurrency(summary.income)}</p>
            </div>
            <TrendingUp className="size-6 text-success" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Uscite (mese)</p>
              <p className="tabular text-xl font-semibold text-destructive">{formatCurrency(summary.expenses)}</p>
            </div>
            <TrendingDown className="size-6 text-destructive" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Profitto netto (mese)</p>
              <p className={`tabular text-xl font-semibold ${summary.profit >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(summary.profit)}
              </p>
            </div>
            <Wallet className="size-6 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <GoalsPanel goals={financeGoals} year={year} category="finance" emptyText="Aggiungi un obiettivo di guadagno (es. 25.000 € l'anno) per vedere quanto manca." />

      <Tabs defaultValue="movimenti">
        <TabsList>
          <TabsTrigger value="movimenti">Movimenti</TabsTrigger>
          <TabsTrigger value="commissioni">Commissioni</TabsTrigger>
        </TabsList>

        <TabsContent value="movimenti" className="space-y-4">
          <div className="flex justify-end">
            <TransactionFormDialog
              categories={categories}
              clients={clients}
              projects={projects}
              trigger={
                <Button>
                  <Plus />
                  Nuovo movimento
                </Button>
              }
            />
          </div>
          <Card className="py-0">
            <TransactionsTable transactions={transactions} />
            <TablePagination page={page} pageSize={pageSize} total={total} basePath="/finanze" searchParams={params} />
          </Card>
        </TabsContent>

        <TabsContent value="commissioni" className="space-y-4">
          <div className="flex justify-end">
            <CommissionFormDialog
              clients={clients}
              projects={projects}
              trigger={
                <Button>
                  <Plus />
                  Nuova commissione
                </Button>
              }
            />
          </div>
          <Card className="py-0">
            <CommissionsTable commissions={commissionsResult.commissions} />
            <TablePagination
              page={commissioniPage}
              pageSize={commissionsResult.pageSize}
              total={commissionsResult.total}
              basePath="/finanze"
              searchParams={params}
              paramName="commissioniPage"
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

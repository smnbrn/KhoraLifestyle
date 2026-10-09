import { FileCheck, FileClock, FileWarning } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityFilter } from "@/components/shared/entity-filter";
import { IncomeExpenseChart } from "@/components/dashboard/income-expense-chart";
import { formatCurrency } from "@/lib/utils";
import { resolvePeriod } from "@/lib/report-periods";
import { getCurrentUser } from "@/services/auth.service";
import { listActiveClientsForSelect, listActiveProjectsForSelect } from "@/services/projects.service";
import { listCategories } from "@/services/finance.service";
import {
  getFinancialOverview,
  getInvoiceStatusBreakdown,
  getProjectProfitability,
  getIncomeByClient,
  getPeriodTrend,
} from "@/services/reports.service";
import { PeriodFilter } from "./period-filter";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; dal?: string; al?: string; cliente?: string; progetto?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const userId = user!.id;

  const { start, end } = resolvePeriod(params.periodo, params.dal, params.al);
  const filters = { start, end, clientId: params.cliente, projectId: params.progetto, categoryId: params.categoria };

  const [overview, invoiceStatus, profitability, incomeByClient, trend, clients, projects, categories] =
    await Promise.all([
      getFinancialOverview(userId, filters),
      getInvoiceStatusBreakdown(userId, filters),
      getProjectProfitability(userId, filters),
      getIncomeByClient(userId, filters),
      getPeriodTrend(userId, filters),
      listActiveClientsForSelect(userId),
      listActiveProjectsForSelect(userId),
      listCategories(userId),
    ]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 md:py-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Report</h1>
        <p className="text-sm text-muted-foreground">
          Dal {start} al {end}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PeriodFilter />
        <EntityFilter options={clients} paramName="cliente" placeholder="Tutti i clienti" />
        <EntityFilter options={projects} paramName="progetto" placeholder="Tutti i progetti" />
        <EntityFilter
          options={categories.map((c) => ({ id: c.id, name: c.name }))}
          paramName="categoria"
          placeholder="Tutte le categorie"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Fatturato</p>
            <p className="tabular text-xl font-semibold">{formatCurrency(overview.fatturato)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Entrate</p>
            <p className="tabular text-xl font-semibold text-success">{formatCurrency(overview.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Uscite</p>
            <p className="tabular text-xl font-semibold text-destructive">{formatCurrency(overview.expenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Profitto netto</p>
            <p className={`tabular text-xl font-semibold ${overview.profit >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(overview.profit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fatture pagate</p>
              <p className="tabular text-lg font-semibold">
                {invoiceStatus.paid.count} · {formatCurrency(invoiceStatus.paid.amount)}
              </p>
            </div>
            <FileCheck className="size-6 text-success" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fatture non pagate</p>
              <p className="tabular text-lg font-semibold">
                {invoiceStatus.unpaid.count} · {formatCurrency(invoiceStatus.unpaid.amount)}
              </p>
            </div>
            <FileClock className="size-6 text-warning" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Fatture scadute</p>
              <p className="tabular text-lg font-semibold">
                {invoiceStatus.overdue.count} · {formatCurrency(invoiceStatus.overdue.amount)}
              </p>
            </div>
            <FileWarning className="size-6 text-destructive" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrate vs uscite nel periodo</CardTitle>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun movimento nel periodo selezionato.</p>
          ) : (
            <IncomeExpenseChart data={trend} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle className="text-base">Redditività progetti</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Progetto</TableHead>
                <TableHead className="text-right">Valore</TableHead>
                <TableHead className="text-right">Costi (periodo)</TableHead>
                <TableHead className="text-right">Profitto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profitability.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Nessun progetto trovato.
                  </TableCell>
                </TableRow>
              ) : (
                profitability.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="tabular text-right">{formatCurrency(p.value)}</TableCell>
                    <TableCell className="tabular text-right text-destructive">{formatCurrency(p.costs)}</TableCell>
                    <TableCell className={`tabular text-right font-medium ${p.profit >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(p.profit)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Card className="py-0">
          <CardHeader className="pt-6">
            <CardTitle className="text-base">Entrate per cliente</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Entrate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeByClient.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                    Nessuna entrata collegata a un cliente nel periodo.
                  </TableCell>
                </TableRow>
              ) : (
                incomeByClient.map((c) => (
                  <TableRow key={c.clientId}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="tabular text-right text-success">{formatCurrency(c.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

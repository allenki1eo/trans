import Link from "next/link";
import { desc, eq, ne, sql } from "drizzle-orm";
import { AlertTriangle } from "lucide-react";
import { db } from "@/lib/db/client";
import { customers, expenses, invoices, payments, shipments, vehicles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { listShipments } from "@/lib/queries/shipments";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatTZS } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ShipmentStatusBadge } from "@/components/status-badge";
import { ProfitByCustomerChart, RevenueExpensesChart } from "./charts";

export default async function DashboardPage() {
  await requireRole("owner", "accountant");
  const t = getT();

  const [revenueByVehicle, expensesByVehicle, revenueByCustomer, costByCustomer, unpaidRow, overdueRow, recent] =
    await Promise.all([
      db
        .select({
          vehicleId: vehicles.id,
          plate: vehicles.plateNumber,
          revenue: sql<number>`coalesce(sum(${shipments.price}), 0)`,
        })
        .from(shipments)
        .innerJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
        .where(ne(shipments.status, "cancelled"))
        .groupBy(vehicles.id, vehicles.plateNumber),
      db
        .select({
          vehicleId: expenses.vehicleId,
          plate: vehicles.plateNumber,
          total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
        })
        .from(expenses)
        .innerJoin(vehicles, eq(expenses.vehicleId, vehicles.id))
        .groupBy(expenses.vehicleId, vehicles.plateNumber),
      db
        .select({
          customerId: shipments.customerId,
          name: customers.name,
          revenue: sql<number>`coalesce(sum(${shipments.price}), 0)`,
        })
        .from(shipments)
        .innerJoin(customers, eq(shipments.customerId, customers.id))
        .where(ne(shipments.status, "cancelled"))
        .groupBy(shipments.customerId, customers.name),
      // Trip-linked expenses attributed back to the shipment's customer.
      db
        .select({
          customerId: shipments.customerId,
          cost: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
        })
        .from(expenses)
        .innerJoin(shipments, eq(expenses.shipmentId, shipments.id))
        .groupBy(shipments.customerId),
      db
        .select({
          unpaid: sql<number>`coalesce(sum(${invoices.amount} - coalesce((select sum(${payments.amount}) from ${payments} where ${payments.invoiceId} = ${invoices.id}), 0)), 0)`,
        })
        .from(invoices)
        .where(ne(invoices.status, "paid")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(
          sql`${invoices.status} != 'paid' and ${invoices.dueDate} is not null and ${invoices.dueDate} < unixepoch()`
        ),
      listShipments(),
    ]);

  const totalRevenue = revenueByVehicle.reduce((sum, r) => sum + r.revenue, 0);
  const totalExpenses = expensesByVehicle.reduce((sum, r) => sum + r.total, 0);
  const profit = totalRevenue - totalExpenses;
  const overdueCount = overdueRow[0]?.count ?? 0;

  const expensesByVehicleId = new Map(expensesByVehicle.map((r) => [r.vehicleId, r]));
  const vehicleChartData = revenueByVehicle.map((r) => ({
    name: r.plate,
    revenue: r.revenue,
    expenses: expensesByVehicleId.get(r.vehicleId)?.total ?? 0,
  }));
  for (const e of expensesByVehicle) {
    if (!revenueByVehicle.some((r) => r.vehicleId === e.vehicleId)) {
      vehicleChartData.push({ name: e.plate, revenue: 0, expenses: e.total });
    }
  }

  const costByCustomerId = new Map(costByCustomer.map((c) => [c.customerId, c.cost]));
  const customerChartData = revenueByCustomer
    .map((c) => ({ name: c.name, profit: c.revenue - (costByCustomerId.get(c.customerId) ?? 0) }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 8);

  const stats = [
    { label: t.dashboard.revenue, value: formatTZS(totalRevenue), tone: "text-foreground" },
    { label: t.dashboard.expenses, value: formatTZS(totalExpenses), tone: "text-foreground" },
    {
      label: t.dashboard.profit,
      value: formatTZS(profit),
      tone: profit >= 0 ? "text-accent" : "text-danger",
    },
    {
      label: t.dashboard.unpaidInvoices,
      value: formatTZS(Math.max(unpaidRow[0]?.unpaid ?? 0, 0)),
      tone: "text-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t.dashboard.title} />

      {overdueCount > 0 && (
        <Link
          href="/invoices"
          className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger transition-colors hover:bg-danger/20"
        >
          <AlertTriangle className="h-4 w-4" />
          {overdueCount} {t.dashboard.overdueAlert}
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted">{s.label}</p>
              <p className={`mt-1 font-mono text-2xl font-bold ${s.tone}`}>{s.value}</p>
              <p className="mt-1 text-xs text-muted">{t.dashboard.allTime}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.revenueVsExpenses}</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueExpensesChart
              data={vehicleChartData}
              labels={{ revenue: t.dashboard.revenue, expenses: t.dashboard.expenses }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.profitByCustomer}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitByCustomerChart data={customerChartData} label={t.dashboard.profit} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.recentShipments}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>{t.shipments.customer}</TH>
                <TH>{t.shipments.origin}</TH>
                <TH>{t.shipments.destination}</TH>
                <TH>{t.common.status}</TH>
                <TH className="text-right">{t.shipments.price}</TH>
                <TH>{t.common.date}</TH>
              </TR>
            </THead>
            <TBody>
              {recent.slice(0, 8).map(({ shipment: s, customerName }) => (
                <TR key={s.id}>
                  <TD className="font-medium">{customerName}</TD>
                  <TD className="text-muted">{s.origin}</TD>
                  <TD className="text-muted">{s.destination}</TD>
                  <TD>
                    <ShipmentStatusBadge status={s.status} label={t.shipments.statuses[s.status]} />
                  </TD>
                  <TD className="text-right font-mono">{formatTZS(s.price)}</TD>
                  <TD className="text-muted">{formatDate(s.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

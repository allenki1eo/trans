import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { Route, Wallet } from "lucide-react";
import { db } from "@/lib/db/client";
import { expenses, profiles, shipments, vehicles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { listCustody } from "@/lib/queries/stock";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatTZS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShipmentStatusBadge, VehicleStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();

  const vehicle = await db.query.vehicles.findFirst({ where: eq(vehicles.id, params.id) });
  if (!vehicle) notFound();

  const [statsRow, expenseTotalRow, tripRows, expenseRows, custodyRows] = await Promise.all([
    db
      .select({
        revenue: sql<number>`coalesce(sum(${shipments.price}), 0)`,
        distanceKm: sql<number>`coalesce(sum(${shipments.distanceKm}), 0)`,
      })
      .from(shipments)
      .where(sql`${shipments.vehicleId} = ${vehicle.id} and ${shipments.status} != 'cancelled'`),
    db
      .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
      .from(expenses)
      .where(eq(expenses.vehicleId, vehicle.id)),
    db
      .select()
      .from(shipments)
      .where(eq(shipments.vehicleId, vehicle.id))
      .orderBy(desc(shipments.createdAt))
      .limit(50),
    db
      .select({ expense: expenses, recorderName: profiles.fullName })
      .from(expenses)
      .innerJoin(profiles, eq(expenses.recordedBy, profiles.id))
      .where(eq(expenses.vehicleId, vehicle.id))
      .orderBy(desc(expenses.createdAt))
      .limit(50),
    listCustody(vehicle.id),
  ]);

  const revenue = statsRow[0]?.revenue ?? 0;
  const cost = expenseTotalRow[0]?.total ?? 0;
  const profit = revenue - cost;
  const distanceKm = statsRow[0]?.distanceKm ?? 0;
  const canSeeExpenses = can(user.role, "expenses.read");

  const tiles = [
    { label: t.dashboard.revenue, value: formatTZS(revenue), tone: "text-foreground" },
    ...(canSeeExpenses
      ? [
          { label: t.dashboard.expenses, value: formatTZS(cost), tone: "text-foreground" },
          {
            label: t.dashboard.profit,
            value: formatTZS(profit),
            tone: profit >= 0 ? "text-accent" : "text-danger",
          },
          {
            label: t.dashboard.costPerKm,
            value: distanceKm > 0 ? formatTZS(cost / distanceKm) : "—",
            tone: "text-foreground",
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${vehicle.plateNumber} · ${vehicle.makeModel}`}
        action={
          <div className="flex items-center gap-3">
            <VehicleStatusBadge status={vehicle.status} label={t.vehicles.statuses[vehicle.status]} />
            {can(user.role, "vehicles.write") && (
              <Link
                href={`/vehicles/${vehicle.id}/edit`}
                className={buttonVariants({ variant: "secondary" })}
              >
                {t.common.edit}
              </Link>
            )}
          </div>
        }
      />

      <div className={cn("grid gap-4 sm:grid-cols-2", canSeeExpenses && "lg:grid-cols-4")}>
        {tiles.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted">{s.label}</p>
              <p className={`mt-1 font-mono text-2xl font-bold ${s.tone}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {custodyRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.stock.custodyTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{t.stock.item}</TH>
                  <TH className="text-right">{t.stock.quantity}</TH>
                  <TH>{t.stock.trip}</TH>
                </TR>
              </THead>
              <TBody>
                {custodyRows.map((c) => (
                  <TR key={`${c.shipmentId}-${c.itemId}`}>
                    <TD>{c.itemName}</TD>
                    <TD className="text-right font-mono">
                      {c.quantity.toLocaleString("en-US")} {c.unit}
                    </TD>
                    <TD>
                      <Link href={`/shipments/${c.shipmentId}`} className="text-accent hover:underline">
                        {c.origin} → {c.destination}
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.shipments.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {tripRows.length === 0 ? (
            <EmptyState icon={Route} message={t.common.noResults} />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t.shipments.origin}</TH>
                  <TH>{t.shipments.destination}</TH>
                  <TH>{t.common.status}</TH>
                  <TH className="text-right">{t.shipments.price}</TH>
                  <TH className="text-right">{t.dashboard.distance} (km)</TH>
                  <TH>{t.common.date}</TH>
                </TR>
              </THead>
              <TBody>
                {tripRows.map((s) => (
                  <TR key={s.id}>
                    <TD className="text-muted">{s.origin}</TD>
                    <TD className="text-muted">{s.destination}</TD>
                    <TD>
                      <ShipmentStatusBadge status={s.status} label={t.shipments.statuses[s.status]} />
                    </TD>
                    <TD className="text-right font-mono">{formatTZS(s.price)}</TD>
                    <TD className="text-right font-mono">
                      {s.distanceKm ? s.distanceKm.toLocaleString("en-US") : "—"}
                    </TD>
                    <TD className="text-muted">{formatDate(s.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canSeeExpenses && (
        <Card>
          <CardHeader>
            <CardTitle>{t.expenses.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseRows.length === 0 ? (
              <EmptyState icon={Wallet} message={t.common.noResults} />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>{t.common.date}</TH>
                    <TH>{t.expenses.category}</TH>
                    <TH>{t.common.description}</TH>
                    <TH>{t.expenses.recordedBy}</TH>
                    <TH className="text-right">{t.common.amount}</TH>
                  </TR>
                </THead>
                <TBody>
                  {expenseRows.map(({ expense: e, recorderName }) => (
                    <TR key={e.id}>
                      <TD className="text-muted">{formatDate(e.createdAt)}</TD>
                      <TD>
                        <Badge tone="neutral">{t.expenses.categories[e.category]}</Badge>
                      </TD>
                      <TD className="text-muted">{e.description ?? "—"}</TD>
                      <TD className="text-muted">{recorderName}</TD>
                      <TD className="text-right font-mono">{formatTZS(e.amount)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Link href="/vehicles" className="inline-block text-sm text-muted hover:text-foreground">
        ← {t.common.back}
      </Link>
    </div>
  );
}

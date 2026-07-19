import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { Boxes } from "lucide-react";
import { db } from "@/lib/db/client";
import { customers, invoices, payments, profiles, shipments, tripAssignments, vehicles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { listItemsForShipment } from "@/lib/queries/stock";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatTZS } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { InvoiceStatusBadge, ShipmentStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

const driverProfile = alias(profiles, "detail_driver_profile");

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();

  const [row] = await db
    .select({
      shipment: shipments,
      customerId: customers.id,
      customerName: customers.name,
      plateNumber: vehicles.plateNumber,
      vehicleId: vehicles.id,
      driverName: driverProfile.fullName,
    })
    .from(shipments)
    .innerJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
    .leftJoin(tripAssignments, eq(tripAssignments.shipmentId, shipments.id))
    .leftJoin(driverProfile, eq(tripAssignments.driverId, driverProfile.id))
    .where(eq(shipments.id, params.id));
  if (!row) notFound();

  const [itemRows, invoiceRows] = await Promise.all([
    listItemsForShipment(row.shipment.id),
    db
      .select({
        invoice: invoices,
        paid: sql<number>`coalesce((select sum(${payments.amount}) from ${payments} where ${payments.invoiceId} = ${invoices.id}), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.shipmentId, row.shipment.id))
      .orderBy(desc(invoices.createdAt)),
  ]);

  const s = row.shipment;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`${s.origin} → ${s.destination}`}
        action={
          can(user.role, "shipments.write") && (
            <Link href={`/shipments/${s.id}/edit`} className={buttonVariants({ variant: "secondary" })}>
              {t.common.edit}
            </Link>
          )
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{row.customerName}</CardTitle>
          <ShipmentStatusBadge status={s.status} label={t.shipments.statuses[s.status]} />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted">{t.shipments.goods}: </span>
              {s.goodsDescription}
              {s.weightOrUnits ? ` (${s.weightOrUnits})` : ""}
            </p>
            <p>
              <span className="text-muted">{t.shipments.vehicle}: </span>
              <span className="font-mono">{row.plateNumber ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted">{t.shipments.driver}: </span>
              {row.driverName ?? "—"}
            </p>
            <p>
              <span className="text-muted">{t.common.date}: </span>
              {formatDate(s.createdAt)}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-mono text-lg font-bold text-accent">{formatTZS(s.price)}</p>
            {s.receivedAt ? (
              <div>
                <Badge tone="green">{t.shipments.received}</Badge>
                <p className="mt-1 text-xs text-muted">
                  {s.receivedBy} · {formatDate(s.receivedAt)}
                </p>
              </div>
            ) : (
              <Badge tone="neutral">{t.shipments.notReceived}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.nav.items}</CardTitle>
        </CardHeader>
        <CardContent>
          {itemRows.length === 0 ? (
            <EmptyState icon={Boxes} message={t.common.noResults} />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t.stock.item}</TH>
                  <TH className="text-right">{t.stock.quantity}</TH>
                  <TH>{t.stock.unit}</TH>
                </TR>
              </THead>
              <TBody>
                {itemRows.map((line) => (
                  <TR key={line.id}>
                    <TD>{line.name}</TD>
                    <TD className="text-right font-mono">{line.quantity.toLocaleString("en-US")}</TD>
                    <TD className="text-muted">{line.unit}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {invoiceRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.invoices.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>{t.invoices.number}</TH>
                  <TH>{t.common.status}</TH>
                  <TH className="text-right">{t.common.amount}</TH>
                  <TH className="text-right">{t.invoices.balance}</TH>
                </TR>
              </THead>
              <TBody>
                {invoiceRows.map(({ invoice: inv, paid }) => {
                  const overdue =
                    inv.status !== "paid" && inv.dueDate !== null && inv.dueDate < new Date();
                  const effectiveStatus = overdue ? "overdue" : inv.status;
                  return (
                    <TR key={inv.id}>
                      <TD>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-mono font-medium text-accent hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </TD>
                      <TD>
                        <InvoiceStatusBadge
                          status={effectiveStatus}
                          label={t.invoices.statuses[effectiveStatus]}
                        />
                      </TD>
                      <TD className="text-right font-mono">{formatTZS(inv.amount)}</TD>
                      <TD className="text-right font-mono">{formatTZS(inv.amount - paid)}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Link href="/shipments" className="inline-block text-sm text-muted hover:text-foreground">
        ← {t.common.back}
      </Link>
    </div>
  );
}

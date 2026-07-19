import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { FileText, Route } from "lucide-react";
import { db } from "@/lib/db/client";
import { customers, invoices, payments, shipments } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatTZS } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { InvoiceStatusBadge, ShipmentStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();

  const customer = await db.query.customers.findFirst({ where: eq(customers.id, params.id) });
  if (!customer) notFound();

  const [shipmentRows, invoiceRows, revenueRow] = await Promise.all([
    db
      .select()
      .from(shipments)
      .where(eq(shipments.customerId, customer.id))
      .orderBy(desc(shipments.createdAt))
      .limit(50),
    db
      .select({
        invoice: invoices,
        paid: sql<number>`coalesce((select sum(${payments.amount}) from ${payments} where ${payments.invoiceId} = ${invoices.id}), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.customerId, customer.id))
      .orderBy(desc(invoices.createdAt))
      .limit(50),
    db
      .select({ revenue: sql<number>`coalesce(sum(${shipments.price}), 0)` })
      .from(shipments)
      .where(sql`${shipments.customerId} = ${customer.id} and ${shipments.status} != 'cancelled'`),
  ]);

  const unpaid = invoiceRows
    .filter((r) => r.invoice.status !== "paid")
    .reduce((sum, r) => sum + Math.max(r.invoice.amount - r.paid, 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.name}
        action={
          can(user.role, "customers.write") && (
            <Link
              href={`/customers/${customer.id}/edit`}
              className={buttonVariants({ variant: "secondary" })}
            >
              {t.common.edit}
            </Link>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted">{t.customers.totalRevenue}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-accent">
              {formatTZS(revenueRow[0]?.revenue ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted">{t.customers.unpaid}</p>
            <p className="mt-1 font-mono text-2xl font-bold">{formatTZS(unpaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted">{t.customers.details}</p>
            <p className="mt-1 text-sm">{customer.phone ?? "—"}</p>
            <p className="text-sm text-muted">{customer.email ?? "—"}</p>
            <p className="text-sm text-muted">{customer.address ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.shipments.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {shipmentRows.length === 0 ? (
            <EmptyState icon={Route} message={t.common.noResults} />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t.shipments.origin}</TH>
                  <TH>{t.shipments.destination}</TH>
                  <TH>{t.shipments.goods}</TH>
                  <TH>{t.common.status}</TH>
                  <TH className="text-right">{t.shipments.price}</TH>
                  <TH>{t.common.date}</TH>
                </TR>
              </THead>
              <TBody>
                {shipmentRows.map((s) => (
                  <TR key={s.id}>
                    <TD className="text-muted">{s.origin}</TD>
                    <TD className="text-muted">{s.destination}</TD>
                    <TD>{s.goodsDescription}</TD>
                    <TD>
                      <ShipmentStatusBadge status={s.status} label={t.shipments.statuses[s.status]} />
                    </TD>
                    <TD className="text-right font-mono">{formatTZS(s.price)}</TD>
                    <TD className="text-muted">{formatDate(s.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.invoices.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {invoiceRows.length === 0 ? (
            <EmptyState icon={FileText} message={t.common.noResults} />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t.invoices.number}</TH>
                  <TH>{t.common.status}</TH>
                  <TH>{t.invoices.dueDate}</TH>
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
                      <TD className="text-muted">{formatDate(inv.dueDate)}</TD>
                      <TD className="text-right font-mono">{formatTZS(inv.amount)}</TD>
                      <TD className="text-right font-mono">{formatTZS(inv.amount - paid)}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Link href="/customers" className="inline-block text-sm text-muted hover:text-foreground">
        ← {t.common.back}
      </Link>
    </div>
  );
}

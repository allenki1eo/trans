import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/lib/db/client";
import { customers, invoices, payments, shipments } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatDateTime, formatTZS } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { PaymentForm } from "./payment-form";
import { InvoiceStatusActions } from "./status-actions";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();

  const [row] = await db
    .select({
      invoice: invoices,
      customerName: customers.name,
      customerAddress: customers.address,
      origin: shipments.origin,
      destination: shipments.destination,
      goods: shipments.goodsDescription,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .innerJoin(shipments, eq(invoices.shipmentId, shipments.id))
    .where(eq(invoices.id, params.id));
  if (!row) notFound();

  const paymentRows = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, row.invoice.id))
    .orderBy(desc(payments.paidAt));

  const paid = paymentRows.reduce((sum, p) => sum + p.amount, 0);
  const balance = row.invoice.amount - paid;
  const overdue =
    row.invoice.status !== "paid" && row.invoice.dueDate !== null && row.invoice.dueDate < new Date();
  const effectiveStatus = overdue ? "overdue" : row.invoice.status;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={row.invoice.invoiceNumber}
        action={
          <a
            href={`/api/invoices/${row.invoice.id}/pdf`}
            className={buttonVariants({ variant: "secondary" })}
          >
            <Download className="h-4 w-4" />
            {t.invoices.downloadPdf}
          </a>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{row.customerName}</CardTitle>
          <InvoiceStatusBadge status={effectiveStatus} label={t.invoices.statuses[effectiveStatus]} />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="text-sm text-muted">
            <p>{row.customerAddress ?? ""}</p>
            <p className="mt-2">
              {row.origin} → {row.destination}
            </p>
            <p>{row.goods}</p>
            <p className="mt-2">
              {t.invoices.dueDate}: {formatDate(row.invoice.dueDate)}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm text-muted">{t.common.amount}</p>
            <p className="font-mono text-2xl font-bold text-accent">{formatTZS(row.invoice.amount)}</p>
            <p className="text-sm text-muted">
              {t.invoices.paid}: <span className="font-mono text-success">{formatTZS(paid)}</span>
            </p>
            <p className="text-sm text-muted">
              {t.invoices.balance}: <span className="font-mono text-foreground">{formatTZS(balance)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {can(user.role, "invoices.update") && (
        <InvoiceStatusActions
          invoiceId={row.invoice.id}
          status={row.invoice.status}
          labels={{ markSent: t.invoices.markSent, markPaid: t.invoices.markPaid }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.invoices.paid}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <THead>
              <TR>
                <TH>{t.common.date}</TH>
                <TH>{t.invoices.method}</TH>
                <TH>{t.invoices.reference}</TH>
                <TH className="text-right">{t.common.amount}</TH>
              </TR>
            </THead>
            <TBody>
              {paymentRows.length === 0 && (
                <TR>
                  <TD colSpan={4} className="py-6 text-center text-muted">
                    {t.common.noResults}
                  </TD>
                </TR>
              )}
              {paymentRows.map((p) => (
                <TR key={p.id}>
                  <TD className="text-muted">{formatDateTime(p.paidAt)}</TD>
                  <TD>{t.invoices.methods[p.method]}</TD>
                  <TD className="font-mono text-muted">{p.reference ?? "—"}</TD>
                  <TD className="text-right font-mono">{formatTZS(p.amount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>

          {can(user.role, "payments.create") && balance > 0 && (
            <PaymentForm
              invoiceId={row.invoice.id}
              suggestedAmount={balance}
              labels={{
                recordPayment: t.invoices.recordPayment,
                amount: t.common.amount,
                method: t.invoices.method,
                reference: t.invoices.reference,
                save: t.common.save,
                required: t.common.required,
                methods: t.invoices.methods,
              }}
            />
          )}
        </CardContent>
      </Card>

      <Link href="/invoices" className="inline-block text-sm text-muted hover:text-foreground">
        ← {t.common.back}
      </Link>
    </div>
  );
}

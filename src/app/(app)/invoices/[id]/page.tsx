import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Banknote, Download, Landmark, Receipt, Smartphone } from "lucide-react";
import { db } from "@/lib/db/client";
import { customers, invoices, payments, shipments, type PaymentMethod } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { listItemsForShipment } from "@/lib/queries/stock";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatDateTime, formatTZS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { ProgressBar } from "@/components/progress-bar";
import { EmptyState } from "@/components/empty-state";
import { PaymentForm } from "./payment-form";
import { InvoiceStatusActions } from "./status-actions";

const METHOD_ICONS: Record<PaymentMethod, typeof Smartphone> = {
  mpesa: Smartphone,
  cash: Banknote,
  bank: Landmark,
};

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
      shipmentId: shipments.id,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .innerJoin(shipments, eq(invoices.shipmentId, shipments.id))
    .where(eq(invoices.id, params.id));
  if (!row) notFound();

  const [paymentRows, itemRows] = await Promise.all([
    db.select().from(payments).where(eq(payments.invoiceId, row.invoice.id)).orderBy(desc(payments.paidAt)),
    listItemsForShipment(row.shipmentId),
  ]);
  const goodsLine = itemRows
    .map((line) => `${line.name} (${line.quantity.toLocaleString("en-US")} ${line.unit})`)
    .join(", ");

  const paid = paymentRows.reduce((sum, p) => sum + p.amount, 0);
  const balance = row.invoice.amount - paid;
  const percentPaid = row.invoice.amount > 0 ? Math.min(100, Math.round((paid / row.invoice.amount) * 100)) : 0;
  const overdue =
    row.invoice.status !== "paid" && row.invoice.dueDate !== null && row.invoice.dueDate < new Date();
  const effectiveStatus = overdue ? "overdue" : row.invoice.status;

  let dueText: string | null = null;
  if (row.invoice.dueDate && row.invoice.status !== "paid") {
    const diffDays = Math.round((row.invoice.dueDate.getTime() - Date.now()) / 86_400_000);
    if (diffDays === 0) dueText = t.invoices.dueToday;
    else if (diffDays > 0) dueText = t.invoices.dueIn.replace("{n}", String(diffDays));
    else dueText = t.invoices.overdueBy.replace("{n}", String(Math.abs(diffDays)));
  }

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
            {goodsLine && <p>{goodsLine}</p>}
            <p className="mt-2">
              {t.invoices.dueDate}: {formatDate(row.invoice.dueDate)}
              {dueText && (
                <span className={cn("ml-2", overdue ? "text-danger" : "text-muted")}>({dueText})</span>
              )}
            </p>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-sm text-muted">{t.common.amount}</p>
            <p className="font-mono text-2xl font-bold text-accent">{formatTZS(row.invoice.amount)}</p>
            <ProgressBar
              percent={percentPaid}
              tone={effectiveStatus === "overdue" ? "danger" : "success"}
            />
            <p className="text-xs text-muted">
              {percentPaid}
              {t.invoices.percentPaid}
            </p>
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
          {paymentRows.length === 0 ? (
            <EmptyState icon={Receipt} message={t.common.noResults} />
          ) : (
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
                {paymentRows.map((p) => {
                  const Icon = METHOD_ICONS[p.method];
                  return (
                    <TR key={p.id}>
                      <TD className="text-muted">{formatDateTime(p.paidAt)}</TD>
                      <TD>
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-muted" />
                          {t.invoices.methods[p.method]}
                        </span>
                      </TD>
                      <TD className="font-mono text-muted">{p.reference ?? "—"}</TD>
                      <TD className="text-right font-mono">{formatTZS(p.amount)}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}

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
                payFullBalance: t.invoices.payFullBalance,
                exceedsBalance: t.invoices.exceedsBalance,
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

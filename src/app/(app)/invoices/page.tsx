import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { customers, invoices, payments } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatTZS } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/status-badge";

export default async function InvoicesPage() {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();

  const rows = await db
    .select({
      invoice: invoices,
      customerName: customers.name,
      paid: sql<number>`coalesce((select sum(${payments.amount}) from ${payments} where ${payments.invoiceId} = ${invoices.id}), 0)`,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .orderBy(desc(invoices.createdAt));

  return (
    <div>
      <PageHeader
        title={t.invoices.title}
        action={
          can(user.role, "invoices.create") && (
            <Link href="/invoices/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              {t.invoices.new}
            </Link>
          )
        }
      />
      <Table>
        <THead>
          <TR>
            <TH>{t.invoices.number}</TH>
            <TH>{t.invoices.customer}</TH>
            <TH>{t.common.status}</TH>
            <TH>{t.invoices.dueDate}</TH>
            <TH className="text-right">{t.common.amount}</TH>
            <TH className="text-right">{t.invoices.paid}</TH>
            <TH className="text-right">{t.invoices.balance}</TH>
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 && (
            <TR>
              <TD colSpan={7} className="py-8 text-center text-muted">
                {t.common.noResults}
              </TD>
            </TR>
          )}
          {rows.map(({ invoice: inv, customerName, paid }) => {
            const overdue =
              inv.status !== "paid" && inv.dueDate !== null && inv.dueDate < new Date();
            const effectiveStatus = overdue ? "overdue" : inv.status;
            return (
              <TR key={inv.id}>
                <TD>
                  <Link href={`/invoices/${inv.id}`} className="font-mono font-medium text-accent hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </TD>
                <TD>{customerName}</TD>
                <TD>
                  <InvoiceStatusBadge
                    status={effectiveStatus}
                    label={t.invoices.statuses[effectiveStatus]}
                  />
                </TD>
                <TD className="text-muted">{formatDate(inv.dueDate)}</TD>
                <TD className="text-right font-mono">{formatTZS(inv.amount)}</TD>
                <TD className="text-right font-mono text-success">{formatTZS(paid)}</TD>
                <TD className="text-right font-mono">{formatTZS(inv.amount - paid)}</TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}

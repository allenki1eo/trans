import Link from "next/link";
import { Download, FileText, Plus, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { listInvoices, invoiceSummary } from "@/lib/queries/invoices";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatTZS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { INVOICE_STATUSES } from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { ProgressBar } from "@/components/progress-bar";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();

  const [rows, summary] = await Promise.all([
    listInvoices({ status: searchParams.status, q: searchParams.q }),
    invoiceSummary(),
  ]);

  const chipHref = (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (searchParams.q) params.set("q", searchParams.q);
    const qs = params.toString();
    return qs ? `/invoices?${qs}` : "/invoices";
  };

  const tiles = [
    { label: t.invoices.outstanding, value: formatTZS(summary.outstanding), tone: "text-foreground" },
    {
      label: t.invoices.overdueAmount,
      value: formatTZS(summary.overdueAmount),
      tone: summary.overdueAmount > 0 ? "text-danger" : "text-foreground",
      caption: `${summary.overdueCount} ${t.invoices.overdueCount}`,
    },
    { label: t.invoices.paidAllTime, value: formatTZS(summary.paidAllTime), tone: "text-success" },
  ];

  return (
    <div>
      <PageHeader
        title={t.invoices.title}
        action={
          <div className="flex items-center gap-2">
            {can(user.role, "export.csv") && (
              <a href="/api/export/invoices" className={buttonVariants({ variant: "secondary" })}>
                <Download className="h-4 w-4" />
                {t.common.exportCsv}
              </a>
            )}
            {can(user.role, "invoices.create") && (
              <Link href="/invoices/new" className={buttonVariants()}>
                <Plus className="h-4 w-4" />
                {t.invoices.new}
              </Link>
            )}
          </div>
        }
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {tiles.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted">{s.label}</p>
              <p className={`mt-1 font-mono text-2xl font-bold ${s.tone}`}>{s.value}</p>
              {s.caption && <p className="mt-1 text-xs text-muted">{s.caption}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[undefined, ...INVOICE_STATUSES].map((s) => (
            <Link
              key={s ?? "all"}
              href={chipHref(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                (searchParams.status ?? undefined) === s
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-muted hover:text-foreground"
              )}
            >
              {s ? t.invoices.statuses[s] : t.common.all}
            </Link>
          ))}
        </div>
        <form method="GET" className="relative ml-auto w-full sm:w-64">
          {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder={t.common.searchPlaceholder}
            className="h-9 pl-9"
          />
        </form>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>{t.invoices.number}</TH>
            <TH>{t.invoices.customer}</TH>
            <TH>{t.common.status}</TH>
            <TH>{t.invoices.dueDate}</TH>
            <TH className="text-right">{t.common.amount}</TH>
            <TH className="w-32">{t.invoices.paid}</TH>
            <TH className="text-right">{t.invoices.balance}</TH>
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 && (
            <TR>
              <TD colSpan={7}>
                <EmptyState icon={FileText} message={t.common.noResults} />
              </TD>
            </TR>
          )}
          {rows.map((r) => (
            <TR key={r.invoice.id}>
              <TD>
                <Link
                  href={`/invoices/${r.invoice.id}`}
                  className="font-mono font-medium text-accent hover:underline"
                >
                  {r.invoice.invoiceNumber}
                </Link>
              </TD>
              <TD>{r.customerName}</TD>
              <TD>
                <InvoiceStatusBadge
                  status={r.effectiveStatus}
                  label={t.invoices.statuses[r.effectiveStatus]}
                />
              </TD>
              <TD className="text-muted">{formatDate(r.invoice.dueDate)}</TD>
              <TD className="text-right font-mono">{formatTZS(r.invoice.amount)}</TD>
              <TD>
                <div className="flex items-center gap-2">
                  <ProgressBar
                    percent={r.percentPaid}
                    tone={r.effectiveStatus === "overdue" ? "danger" : "success"}
                    className="w-16"
                  />
                  <span className="text-xs text-muted">{r.percentPaid}%</span>
                </div>
              </TD>
              <TD className="text-right font-mono">{formatTZS(r.balance)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

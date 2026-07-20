import Link from "next/link";
import { Plus, Route, Search } from "lucide-react";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { listShipments, paymentStateOf, type PaymentState } from "@/lib/queries/shipments";
import { deleteShipment } from "@/lib/actions/shipments";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatTZS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SHIPMENT_STATUSES } from "@/lib/db/schema";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ShipmentStatusBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { MarkReceived } from "@/components/mark-received";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const PAYMENT_TONES: Record<PaymentState, BadgeTone> = {
  paid: "green",
  partial: "amber",
  unpaid: "red",
  no_invoice: "neutral",
};

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();
  const rows = await listShipments({ status: searchParams.status, q: searchParams.q });
  const canWrite = can(user.role, "shipments.write");

  const chipHref = (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (searchParams.q) params.set("q", searchParams.q);
    const qs = params.toString();
    return qs ? `/shipments?${qs}` : "/shipments";
  };

  return (
    <div>
      <PageHeader
        title={t.shipments.title}
        action={
          canWrite && (
            <Link href="/shipments/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              {t.shipments.new}
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[undefined, ...SHIPMENT_STATUSES].map((s) => (
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
              {s ? t.shipments.statuses[s] : t.common.all}
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
            <TH>{t.shipments.customer}</TH>
            <TH>{t.shipments.origin}</TH>
            <TH>{t.shipments.destination}</TH>
            <TH>{t.shipments.goods}</TH>
            <TH>{t.shipments.vehicle}</TH>
            <TH>{t.shipments.driver}</TH>
            <TH>{t.common.status}</TH>
            <TH>{t.shipments.received}</TH>
            <TH>{t.shipments.payment}</TH>
            <TH className="text-right">{t.shipments.price}</TH>
            <TH>{t.common.date}</TH>
            {canWrite && <TH className="text-right">{t.common.actions}</TH>}
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 && (
            <TR>
              <TD colSpan={12}>
                <EmptyState icon={Route} message={t.common.noResults} />
              </TD>
            </TR>
          )}
          {rows.map((row) => {
            const { shipment: s, customerName, plateNumber, driverName, itemsSummary } = row;
            const payState = paymentStateOf(row);
            return (
            <TR key={s.id}>
              <TD className="font-medium">{customerName}</TD>
              <TD className="text-muted">{s.origin}</TD>
              <TD className="text-muted">{s.destination}</TD>
              <TD>
                <Link href={`/shipments/${s.id}`} className="text-accent hover:underline">
                  {itemsSummary ?? "—"}
                </Link>
              </TD>
              <TD className="font-mono text-muted">{plateNumber ?? "—"}</TD>
              <TD className="text-muted">{driverName ?? "—"}</TD>
              <TD>
                <ShipmentStatusBadge status={s.status} label={t.shipments.statuses[s.status]} />
              </TD>
              <TD>
                {s.receivedAt ? (
                  <div>
                    <Badge tone="green">{t.shipments.received}</Badge>
                    <p className="mt-1 text-xs text-muted">
                      {s.receivedBy} · {formatDate(s.receivedAt)}
                    </p>
                  </div>
                ) : s.status === "delivered" && canWrite ? (
                  <MarkReceived
                    shipmentId={s.id}
                    labels={{
                      markReceived: t.shipments.markReceived,
                      receiverName: t.shipments.receiverName,
                      save: t.common.save,
                    }}
                  />
                ) : s.status === "cancelled" ? (
                  <span className="text-muted">—</span>
                ) : (
                  <Badge tone="neutral">{t.shipments.notReceived}</Badge>
                )}
              </TD>
              <TD>
                <Badge tone={PAYMENT_TONES[payState]}>{t.shipments.paymentStates[payState]}</Badge>
              </TD>
              <TD className="text-right font-mono">{formatTZS(s.price)}</TD>
              <TD className="text-muted">{formatDate(s.createdAt)}</TD>
              {canWrite && (
                <TD className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/shipments/${s.id}/edit`}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      {t.common.edit}
                    </Link>
                    {user.role === "owner" && (
                      <DeleteButton
                        onDelete={deleteShipment.bind(null, s.id)}
                        confirmMessage={t.common.confirmDelete}
                        label={t.common.delete}
                      />
                    )}
                  </div>
                </TD>
              )}
            </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}

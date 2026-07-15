import Link from "next/link";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { listShipments } from "@/lib/queries/shipments";
import { deleteShipment } from "@/lib/actions/shipments";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatTZS } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ShipmentStatusBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";

export default async function ShipmentsPage() {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();
  const rows = await listShipments();
  const canWrite = can(user.role, "shipments.write");

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
            <TH className="text-right">{t.shipments.price}</TH>
            <TH>{t.common.date}</TH>
            {canWrite && <TH className="text-right">{t.common.actions}</TH>}
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 && (
            <TR>
              <TD colSpan={10} className="py-8 text-center text-muted">
                {t.common.noResults}
              </TD>
            </TR>
          )}
          {rows.map(({ shipment: s, customerName, plateNumber, driverName }) => (
            <TR key={s.id}>
              <TD className="font-medium">{customerName}</TD>
              <TD className="text-muted">{s.origin}</TD>
              <TD className="text-muted">{s.destination}</TD>
              <TD>{s.goodsDescription}</TD>
              <TD className="font-mono text-muted">{plateNumber ?? "—"}</TD>
              <TD className="text-muted">{driverName ?? "—"}</TD>
              <TD>
                <ShipmentStatusBadge status={s.status} label={t.shipments.statuses[s.status]} />
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
          ))}
        </TBody>
      </Table>
    </div>
  );
}

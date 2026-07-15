import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { vehicles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { deleteVehicle } from "@/lib/actions/vehicles";
import { getT } from "@/lib/i18n/locale";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { VehicleStatusBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";

export default async function VehiclesPage() {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();
  const rows = await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
  const canWrite = can(user.role, "vehicles.write");

  return (
    <div>
      <PageHeader
        title={t.vehicles.title}
        action={
          canWrite && (
            <Link href="/vehicles/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              {t.vehicles.new}
            </Link>
          )
        }
      />
      <Table>
        <THead>
          <TR>
            <TH>{t.vehicles.plate}</TH>
            <TH>{t.vehicles.makeModel}</TH>
            <TH>{t.vehicles.capacity}</TH>
            <TH>{t.common.status}</TH>
            <TH>{t.common.date}</TH>
            {canWrite && <TH className="text-right">{t.common.actions}</TH>}
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 && (
            <TR>
              <TD colSpan={6} className="py-8 text-center text-muted">
                {t.common.noResults}
              </TD>
            </TR>
          )}
          {rows.map((v) => (
            <TR key={v.id}>
              <TD className="font-mono font-medium">{v.plateNumber}</TD>
              <TD>{v.makeModel}</TD>
              <TD className="text-muted">{v.capacity ?? "—"}</TD>
              <TD>
                <VehicleStatusBadge status={v.status} label={t.vehicles.statuses[v.status]} />
              </TD>
              <TD className="text-muted">{formatDate(v.createdAt)}</TD>
              {canWrite && (
                <TD className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/vehicles/${v.id}/edit`}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      {t.common.edit}
                    </Link>
                    <DeleteButton
                      onDelete={deleteVehicle.bind(null, v.id)}
                      confirmMessage={t.common.confirmDelete}
                      label={t.common.delete}
                    />
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

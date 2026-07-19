import Link from "next/link";
import { asc } from "drizzle-orm";
import { Boxes, Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { items } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { DeleteItemButton } from "./delete-item-button";

export default async function ItemsPage() {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();
  const rows = await db.select().from(items).orderBy(asc(items.name));
  const canWrite = can(user.role, "stock.write");

  return (
    <div>
      <PageHeader
        title={t.items.title}
        action={
          canWrite && (
            <Link href="/items/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              {t.items.new}
            </Link>
          )
        }
      />
      <Table>
        <THead>
          <TR>
            <TH>{t.common.name}</TH>
            <TH>{t.items.unit}</TH>
            {canWrite && <TH className="text-right">{t.common.actions}</TH>}
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 && (
            <TR>
              <TD colSpan={3}>
                <EmptyState icon={Boxes} message={t.common.noResults} />
              </TD>
            </TR>
          )}
          {rows.map((item) => (
            <TR key={item.id}>
              <TD className="font-medium">{item.name}</TD>
              <TD className="text-muted">{item.unit}</TD>
              {canWrite && (
                <TD className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/items/${item.id}/edit`}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      {t.common.edit}
                    </Link>
                    <DeleteItemButton
                      itemId={item.id}
                      confirmMessage={t.common.confirmDelete}
                      label={t.common.delete}
                      inUseMessage={t.items.inUse}
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

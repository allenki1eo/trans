import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { deleteCustomer } from "@/lib/actions/customers";
import { getT } from "@/lib/i18n/locale";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";

export default async function CustomersPage() {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();
  const rows = await db.select().from(customers).orderBy(desc(customers.createdAt));
  const canWrite = can(user.role, "customers.write");

  return (
    <div>
      <PageHeader
        title={t.customers.title}
        action={
          canWrite && (
            <Link href="/customers/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              {t.customers.new}
            </Link>
          )
        }
      />
      <Table>
        <THead>
          <TR>
            <TH>{t.common.name}</TH>
            <TH>{t.common.phone}</TH>
            <TH>{t.common.email}</TH>
            <TH>{t.common.address}</TH>
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
          {rows.map((c) => (
            <TR key={c.id}>
              <TD className="font-medium">{c.name}</TD>
              <TD className="font-mono text-muted">{c.phone ?? "—"}</TD>
              <TD className="text-muted">{c.email ?? "—"}</TD>
              <TD className="text-muted">{c.address ?? "—"}</TD>
              <TD className="text-muted">{formatDate(c.createdAt)}</TD>
              {canWrite && (
                <TD className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/customers/${c.id}/edit`}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      {t.common.edit}
                    </Link>
                    {user.role === "owner" && (
                      <DeleteButton
                        onDelete={deleteCustomer.bind(null, c.id)}
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

import Link from "next/link";
import { desc, like, or } from "drizzle-orm";
import { Plus, Search, UsersRound } from "lucide-react";
import { db } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { deleteCustomer } from "@/lib/actions/customers";
import { getT } from "@/lib/i18n/locale";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();
  const term = searchParams.q?.trim() ? `%${searchParams.q.trim()}%` : null;
  const rows = await db
    .select()
    .from(customers)
    .where(
      term
        ? or(like(customers.name, term), like(customers.phone, term), like(customers.email, term))
        : undefined
    )
    .orderBy(desc(customers.createdAt));
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
      <form method="GET" className="relative mb-4 w-full sm:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder={t.common.searchPlaceholder}
          className="h-9 pl-9"
        />
      </form>
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
              <TD colSpan={6}>
                <EmptyState icon={UsersRound} message={t.common.noResults} />
              </TD>
            </TR>
          )}
          {rows.map((c) => (
            <TR key={c.id}>
              <TD>
                <Link href={`/customers/${c.id}`} className="font-medium text-accent hover:underline">
                  {c.name}
                </Link>
              </TD>
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

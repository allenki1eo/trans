import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { expenses, profiles, vehicles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { deleteExpense } from "@/lib/actions/expenses";
import { getT } from "@/lib/i18n/locale";
import { formatDate, formatTZS } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";

export default async function ExpensesPage() {
  const user = await requireRole("owner", "accountant");
  const t = getT();

  const rows = await db
    .select({
      expense: expenses,
      plate: vehicles.plateNumber,
      recorderName: profiles.fullName,
    })
    .from(expenses)
    .innerJoin(vehicles, eq(expenses.vehicleId, vehicles.id))
    .innerJoin(profiles, eq(expenses.recordedBy, profiles.id))
    .orderBy(desc(expenses.createdAt));

  const total = rows.reduce((sum, r) => sum + r.expense.amount, 0);

  return (
    <div>
      <PageHeader
        title={t.expenses.title}
        action={
          user.role === "owner" && (
            <Link href="/expenses/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              {t.expenses.new}
            </Link>
          )
        }
      />
      <Table>
        <THead>
          <TR>
            <TH>{t.common.date}</TH>
            <TH>{t.expenses.vehicle}</TH>
            <TH>{t.expenses.category}</TH>
            <TH>{t.common.description}</TH>
            <TH>{t.expenses.recordedBy}</TH>
            <TH className="text-right">{t.common.amount}</TH>
            {can(user.role, "expenses.delete") && <TH className="text-right">{t.common.actions}</TH>}
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
          {rows.map(({ expense: e, plate, recorderName }) => (
            <TR key={e.id}>
              <TD className="text-muted">{formatDate(e.createdAt)}</TD>
              <TD className="font-mono">{plate}</TD>
              <TD>
                <Badge tone="neutral">{t.expenses.categories[e.category]}</Badge>
              </TD>
              <TD className="text-muted">{e.description ?? "—"}</TD>
              <TD className="text-muted">{recorderName}</TD>
              <TD className="text-right font-mono">{formatTZS(e.amount)}</TD>
              {can(user.role, "expenses.delete") && (
                <TD className="text-right">
                  <DeleteButton
                    onDelete={deleteExpense.bind(null, e.id)}
                    confirmMessage={t.common.confirmDelete}
                    label={t.common.delete}
                  />
                </TD>
              )}
            </TR>
          ))}
          {rows.length > 0 && (
            <TR className="bg-surface-raised font-semibold hover:bg-surface-raised">
              <TD colSpan={5}>{t.common.total}</TD>
              <TD className="text-right font-mono text-accent">{formatTZS(total)}</TD>
              {can(user.role, "expenses.delete") && <TD />}
            </TR>
          )}
        </TBody>
      </Table>
    </div>
  );
}

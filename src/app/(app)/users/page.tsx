import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { toggleUserActive } from "@/lib/actions/users";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ToggleActiveButton } from "./toggle-active";

export default async function UsersPage() {
  const user = await requireRole("owner");
  const t = getT();
  const rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt));

  return (
    <div>
      <PageHeader
        title={t.users.title}
        action={
          <Link href="/users/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            {t.users.new}
          </Link>
        }
      />
      <Table>
        <THead>
          <TR>
            <TH>{t.users.fullName}</TH>
            <TH>{t.common.email}</TH>
            <TH>{t.common.phone}</TH>
            <TH>{t.users.role}</TH>
            <TH>{t.common.status}</TH>
            <TH className="text-right">{t.common.actions}</TH>
          </TR>
        </THead>
        <TBody>
          {rows.map((p) => (
            <TR key={p.id}>
              <TD className="font-medium">{p.fullName}</TD>
              <TD className="text-muted">{p.email}</TD>
              <TD className="font-mono text-muted">{p.phone ?? "—"}</TD>
              <TD>
                <Badge tone={p.role === "owner" ? "amber" : "neutral"}>{t.users.roles[p.role]}</Badge>
              </TD>
              <TD>
                <Badge tone={p.active ? "green" : "red"}>
                  {p.active ? t.users.active : t.users.deactivated}
                </Badge>
              </TD>
              <TD className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/users/${p.id}/edit`}
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    {t.common.edit}
                  </Link>
                  {p.id !== user.id && (
                    <ToggleActiveButton
                      onToggle={toggleUserActive.bind(null, p.id, !p.active)}
                      label={p.active ? t.users.deactivated : t.users.active}
                    />
                  )}
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

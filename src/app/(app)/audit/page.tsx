import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLogs, profiles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { formatDateTime, formatTZS } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function describeDetails(details: string | null): string {
  if (!details) return "—";
  try {
    const d = JSON.parse(details) as Record<string, unknown>;
    return Object.entries(d)
      .map(([k, v]) => `${k}: ${k === "amount" && typeof v === "number" ? formatTZS(v) : String(v)}`)
      .join(" · ");
  } catch {
    return details;
  }
}

export default async function AuditLogPage() {
  await requireRole("owner");
  const t = getT();

  const rows = await db
    .select({ log: auditLogs, actorName: profiles.fullName })
    .from(auditLogs)
    .innerJoin(profiles, eq(auditLogs.actorId, profiles.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(500);

  return (
    <div>
      <PageHeader title={t.audit.title} />
      <Table>
        <THead>
          <TR>
            <TH>{t.common.date}</TH>
            <TH>{t.audit.actor}</TH>
            <TH>{t.audit.action}</TH>
            <TH>{t.audit.details}</TH>
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 && (
            <TR>
              <TD colSpan={4} className="py-8 text-center text-muted">
                {t.common.noResults}
              </TD>
            </TR>
          )}
          {rows.map(({ log, actorName }) => (
            <TR key={log.id}>
              <TD className="whitespace-nowrap text-muted">{formatDateTime(log.createdAt)}</TD>
              <TD>{actorName}</TD>
              <TD>
                <Badge tone={log.action.endsWith(".delete") ? "red" : "neutral"} className="font-mono">
                  {log.action}
                </Badge>
              </TD>
              <TD className="text-muted">{describeDetails(log.details)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

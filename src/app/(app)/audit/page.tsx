import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { auditLogs, profiles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { formatDateTime, formatTZS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ScrollText } from "lucide-react";

const ENTITIES = [
  "customer",
  "vehicle",
  "shipment",
  "item",
  "stock",
  "expense",
  "invoice",
  "payment",
  "user",
] as const;

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

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { entity?: string };
}) {
  await requireRole("owner");
  const t = getT();

  const filterEntity = ENTITIES.includes(searchParams.entity as (typeof ENTITIES)[number])
    ? (searchParams.entity as (typeof ENTITIES)[number])
    : undefined;

  const rows = await db
    .select({ log: auditLogs, actorName: profiles.fullName })
    .from(auditLogs)
    .innerJoin(profiles, eq(auditLogs.actorId, profiles.id))
    .where(filterEntity ? eq(auditLogs.entity, filterEntity) : undefined)
    .orderBy(desc(auditLogs.createdAt))
    .limit(500);

  const chipHref = (entity?: string) => (entity ? `/audit?entity=${entity}` : "/audit");

  return (
    <div>
      <PageHeader title={t.audit.title} />

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <Link
          href={chipHref()}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            !filterEntity
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border text-muted hover:text-foreground"
          )}
        >
          {t.audit.entities.all}
        </Link>
        {ENTITIES.map((e) => (
          <Link
            key={e}
            href={chipHref(e)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filterEntity === e
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border text-muted hover:text-foreground"
            )}
          >
            {t.audit.entities[e]}
          </Link>
        ))}
      </div>

      <Table>
        <THead>
          <TR>
            <TH>{t.common.date}</TH>
            <TH>{t.audit.actor}</TH>
            <TH>{t.audit.entity}</TH>
            <TH>{t.audit.action}</TH>
            <TH>{t.audit.details}</TH>
          </TR>
        </THead>
        <TBody>
          {rows.length === 0 && (
            <TR>
              <TD colSpan={5}>
                <EmptyState icon={ScrollText} message={t.common.noResults} />
              </TD>
            </TR>
          )}
          {rows.map(({ log, actorName }) => (
            <TR key={log.id}>
              <TD className="whitespace-nowrap text-muted">{formatDateTime(log.createdAt)}</TD>
              <TD>{actorName}</TD>
              <TD>
                <Badge tone="neutral">
                  {t.audit.entities[log.entity as keyof typeof t.audit.entities] ?? log.entity}
                </Badge>
              </TD>
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

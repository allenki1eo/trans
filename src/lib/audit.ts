import "server-only";
import { db } from "@/lib/db/client";
import { auditLogs } from "@/lib/db/schema";

/**
 * Append-only audit trail for financial edits. Call from server actions
 * after the mutation succeeds; never blocks the user-facing operation.
 */
export async function logAudit(
  actorId: string,
  action: string,
  entity: "expense" | "invoice" | "payment" | "stock",
  entityId: string,
  details?: Record<string, unknown>
) {
  try {
    await db.insert(auditLogs).values({
      actorId,
      action,
      entity,
      entityId,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (err) {
    console.error("audit log write failed", err);
  }
}

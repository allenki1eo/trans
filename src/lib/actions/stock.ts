"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { stockMovements } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { stockMovementSchema, type StockMovementInput } from "@/lib/validation";

/** Goods received into the depot. Quantity must be positive. */
export async function receiveStock(input: StockMovementInput) {
  const user = await requireUser();
  if (!can(user.role, "stock.write")) return { ok: false as const, error: "forbidden" };

  const parsed = stockMovementSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  if (parsed.data.quantity <= 0) return { ok: false as const, error: "invalid" };

  const [created] = await db
    .insert(stockMovements)
    .values({
      itemId: parsed.data.itemId,
      type: "received",
      quantity: parsed.data.quantity,
      note: parsed.data.note || null,
      recordedBy: user.id,
    })
    .returning();
  await logAudit(user.id, "stock.receive", "stock", created.id, {
    itemId: parsed.data.itemId,
    quantity: parsed.data.quantity,
  });

  revalidatePath("/stock");
  return { ok: true as const };
}

/** Manual correction — stocktake, damage, loss. Quantity can be negative. */
export async function adjustStock(input: StockMovementInput) {
  const user = await requireUser();
  if (!can(user.role, "stock.write")) return { ok: false as const, error: "forbidden" };

  const parsed = stockMovementSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };

  const [created] = await db
    .insert(stockMovements)
    .values({
      itemId: parsed.data.itemId,
      type: "adjustment",
      quantity: parsed.data.quantity,
      note: parsed.data.note || null,
      recordedBy: user.id,
    })
    .returning();
  await logAudit(user.id, "stock.adjust", "stock", created.id, {
    itemId: parsed.data.itemId,
    quantity: parsed.data.quantity,
  });

  revalidatePath("/stock");
  return { ok: true as const };
}

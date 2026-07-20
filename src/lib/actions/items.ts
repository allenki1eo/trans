"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { items, shipmentItems, stockMovements } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { itemSchema, type ItemInput } from "@/lib/validation";

export async function upsertItem(id: string | null, input: ItemInput) {
  const user = await requireUser();
  if (!can(user.role, "stock.write")) return { ok: false as const, error: "forbidden" };

  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };

  const values = { name: parsed.data.name, unit: parsed.data.unit };

  if (id) {
    await db.update(items).set(values).where(eq(items.id, id));
    await logAudit(user.id, "item.update", "item", id, { name: values.name, unit: values.unit });
  } else {
    const [created] = await db.insert(items).values(values).returning();
    await logAudit(user.id, "item.create", "item", created.id, { name: values.name, unit: values.unit });
  }
  revalidatePath("/items");
  revalidatePath("/stock");
  return { ok: true as const };
}

export async function deleteItem(id: string) {
  const user = await requireUser();
  if (!can(user.role, "stock.write")) return { ok: false as const, error: "forbidden" };

  const [usedOnShipment] = await db
    .select({ id: shipmentItems.id })
    .from(shipmentItems)
    .where(eq(shipmentItems.itemId, id))
    .limit(1);
  const [usedInMovement] = await db
    .select({ id: stockMovements.id })
    .from(stockMovements)
    .where(eq(stockMovements.itemId, id))
    .limit(1);
  if (usedOnShipment || usedInMovement) {
    return { ok: false as const, error: "in_use" };
  }

  const deleted = await db.query.items.findFirst({ where: eq(items.id, id) });
  await db.delete(items).where(eq(items.id, id));
  if (deleted) await logAudit(user.id, "item.delete", "item", id, { name: deleted.name });
  revalidatePath("/items");
  return { ok: true as const };
}

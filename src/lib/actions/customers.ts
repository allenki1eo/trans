"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { customerSchema, type CustomerInput } from "@/lib/validation";

export async function upsertCustomer(id: string | null, input: CustomerInput) {
  const user = await requireUser();
  if (!can(user.role, "customers.write")) return { ok: false as const, error: "forbidden" };

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };

  const values = {
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
  };

  if (id) {
    await db.update(customers).set(values).where(eq(customers.id, id));
    await logAudit(user.id, "customer.update", "customer", id, { name: values.name });
  } else {
    const [created] = await db.insert(customers).values(values).returning();
    await logAudit(user.id, "customer.create", "customer", created.id, { name: values.name });
  }
  revalidatePath("/customers");
  return { ok: true as const };
}

export async function deleteCustomer(id: string) {
  const user = await requireUser();
  if (user.role !== "owner") return { ok: false as const, error: "forbidden" };
  const deleted = await db.query.customers.findFirst({ where: eq(customers.id, id) });
  await db.delete(customers).where(eq(customers.id, id));
  if (deleted) await logAudit(user.id, "customer.delete", "customer", id, { name: deleted.name });
  revalidatePath("/customers");
  return { ok: true as const };
}

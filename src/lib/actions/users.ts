"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { userSchema, type UserInput } from "@/lib/validation";

export async function upsertUser(id: string | null, input: UserInput) {
  const user = await requireUser();
  if (!can(user.role, "users.manage")) return { ok: false as const, error: "forbidden" };

  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;

  if (id) {
    const values: Partial<typeof profiles.$inferInsert> = {
      email: data.email.toLowerCase(),
      fullName: data.fullName,
      phone: data.phone || null,
      role: data.role,
      active: data.active,
    };
    if (data.password) values.passwordHash = await bcrypt.hash(data.password, 10);
    await db.update(profiles).set(values).where(eq(profiles.id, id));
  } else {
    if (!data.password) return { ok: false as const, error: "invalid" };
    await db.insert(profiles).values({
      email: data.email.toLowerCase(),
      fullName: data.fullName,
      phone: data.phone || null,
      role: data.role,
      active: data.active,
      passwordHash: await bcrypt.hash(data.password, 10),
    });
  }
  revalidatePath("/users");
  return { ok: true as const };
}

export async function toggleUserActive(id: string, active: boolean) {
  const user = await requireUser();
  if (!can(user.role, "users.manage")) return { ok: false as const, error: "forbidden" };
  if (id === user.id) return { ok: false as const, error: "cannot deactivate yourself" };
  await db.update(profiles).set({ active }).where(eq(profiles.id, id));
  revalidatePath("/users");
  return { ok: true as const };
}

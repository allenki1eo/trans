"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { expenses, tripAssignments } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { expenseSchema, type ExpenseInput } from "@/lib/validation";

export async function createExpense(input: ExpenseInput) {
  const user = await requireUser();
  if (!can(user.role, "expenses.create")) return { ok: false as const, error: "forbidden" };

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;

  // Drivers may only log expenses against a vehicle they are (or were)
  // assigned to via trip_assignments — the app-layer version of the RLS rule.
  if (user.role === "driver") {
    const assignment = await db.query.tripAssignments.findFirst({
      where: and(
        eq(tripAssignments.driverId, user.id),
        eq(tripAssignments.vehicleId, data.vehicleId)
      ),
    });
    if (!assignment) return { ok: false as const, error: "forbidden" };
  }

  await db.insert(expenses).values({
    vehicleId: data.vehicleId,
    shipmentId: data.shipmentId || null,
    category: data.category,
    amount: data.amount,
    description: data.description || null,
    recordedBy: user.id,
  });

  revalidatePath("/expenses");
  revalidatePath("/driver");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteExpense(id: string) {
  const user = await requireUser();
  if (!can(user.role, "expenses.delete")) return { ok: false as const, error: "forbidden" };
  await db.delete(expenses).where(eq(expenses.id, id));
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

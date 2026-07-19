"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { vehicles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { vehicleSchema, type VehicleInput } from "@/lib/validation";

export async function upsertVehicle(id: string | null, input: VehicleInput) {
  const user = await requireUser();
  if (!can(user.role, "vehicles.write")) return { ok: false as const, error: "forbidden" };

  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };

  const values = {
    plateNumber: parsed.data.plateNumber,
    makeModel: parsed.data.makeModel,
    capacity: parsed.data.capacity || null,
    status: parsed.data.status,
  };

  if (id) {
    await db.update(vehicles).set(values).where(eq(vehicles.id, id));
  } else {
    await db.insert(vehicles).values(values);
  }
  revalidatePath("/vehicles");
  return { ok: true as const };
}

export async function deleteVehicle(id: string) {
  const user = await requireUser();
  if (!can(user.role, "vehicles.write")) return { ok: false as const, error: "forbidden" };
  await db.delete(vehicles).where(eq(vehicles.id, id));
  revalidatePath("/vehicles");
  return { ok: true as const };
}

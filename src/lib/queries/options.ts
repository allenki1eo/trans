import "server-only";
import { asc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { customers, profiles, vehicles } from "@/lib/db/schema";

export type Option = { id: string; label: string };

export async function customerOptions(): Promise<Option[]> {
  const rows = await db
    .select({ id: customers.id, label: customers.name })
    .from(customers)
    .orderBy(asc(customers.name));
  return rows;
}

export async function vehicleOptions(): Promise<Option[]> {
  const rows = await db
    .select({ id: vehicles.id, plate: vehicles.plateNumber, model: vehicles.makeModel })
    .from(vehicles)
    .orderBy(asc(vehicles.plateNumber));
  return rows.map((v) => ({ id: v.id, label: `${v.plate} · ${v.model}` }));
}

export async function driverOptions(): Promise<Option[]> {
  const rows = await db
    .select({ id: profiles.id, label: profiles.fullName })
    .from(profiles)
    .where(and(eq(profiles.role, "driver"), eq(profiles.active, true)))
    .orderBy(asc(profiles.fullName));
  return rows;
}

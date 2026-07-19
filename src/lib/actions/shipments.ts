"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { shipments, tripAssignments } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import {
  shipmentReceivedSchema,
  shipmentSchema,
  shipmentStatusSchema,
  type ShipmentInput,
} from "@/lib/validation";

export async function upsertShipment(id: string | null, input: ShipmentInput) {
  const user = await requireUser();
  if (!can(user.role, "shipments.write")) return { ok: false as const, error: "forbidden" };

  const parsed = shipmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;

  const values = {
    customerId: data.customerId,
    vehicleId: data.vehicleId,
    origin: data.origin,
    destination: data.destination,
    goodsDescription: data.goodsDescription,
    weightOrUnits: data.weightOrUnits || null,
    price: data.price,
    distanceKm: data.distanceKm || null,
  };

  if (id) {
    await db.update(shipments).set(values).where(eq(shipments.id, id));
    // Re-point the trip assignment at the (possibly new) driver/vehicle.
    await db.delete(tripAssignments).where(eq(tripAssignments.shipmentId, id));
    await db.insert(tripAssignments).values({
      shipmentId: id,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
    });
  } else {
    const [created] = await db
      .insert(shipments)
      .values({ ...values, createdBy: user.id })
      .returning();
    await db.insert(tripAssignments).values({
      shipmentId: created.id,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
    });
  }
  revalidatePath("/shipments");
  revalidatePath("/driver");
  redirect("/shipments");
}

/**
 * Status transitions. Drivers may only touch shipments where they are the
 * assigned driver (checked against trip_assignments, not the client).
 */
export async function updateShipmentStatus(shipmentId: string, status: string) {
  const user = await requireUser();
  if (!can(user.role, "shipments.updateStatusOwn")) {
    return { ok: false as const, error: "forbidden" };
  }

  const parsed = shipmentStatusSchema.safeParse({ shipmentId, status });
  if (!parsed.success) return { ok: false as const, error: "invalid" };

  if (user.role === "driver") {
    const assignment = await db.query.tripAssignments.findFirst({
      where: and(
        eq(tripAssignments.shipmentId, parsed.data.shipmentId),
        eq(tripAssignments.driverId, user.id)
      ),
    });
    if (!assignment) return { ok: false as const, error: "forbidden" };
    // Drivers move trips forward; cancelling stays an office decision.
    if (parsed.data.status === "cancelled") return { ok: false as const, error: "forbidden" };
  }

  await db
    .update(shipments)
    .set({
      status: parsed.data.status,
      deliveredAt: parsed.data.status === "delivered" ? new Date() : null,
    })
    .where(eq(shipments.id, parsed.data.shipmentId));

  revalidatePath("/shipments");
  revalidatePath("/driver");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

/**
 * Confirm goods handed over at the destination. Records the receiver's name
 * and time; also marks the trip delivered if it wasn't yet. Drivers may only
 * confirm their own trips (same trip_assignments scoping as status updates).
 */
export async function markShipmentReceived(shipmentId: string, receivedBy: string) {
  const user = await requireUser();
  if (!can(user.role, "shipments.updateStatusOwn")) {
    return { ok: false as const, error: "forbidden" };
  }

  const parsed = shipmentReceivedSchema.safeParse({ shipmentId, receivedBy });
  if (!parsed.success) return { ok: false as const, error: "invalid" };

  if (user.role === "driver") {
    const assignment = await db.query.tripAssignments.findFirst({
      where: and(
        eq(tripAssignments.shipmentId, parsed.data.shipmentId),
        eq(tripAssignments.driverId, user.id)
      ),
    });
    if (!assignment) return { ok: false as const, error: "forbidden" };
  }

  const shipment = await db.query.shipments.findFirst({
    where: eq(shipments.id, parsed.data.shipmentId),
  });
  if (!shipment || shipment.status === "cancelled") {
    return { ok: false as const, error: "invalid" };
  }

  await db
    .update(shipments)
    .set({
      status: "delivered",
      deliveredAt: shipment.deliveredAt ?? new Date(),
      receivedAt: new Date(),
      receivedBy: parsed.data.receivedBy,
    })
    .where(eq(shipments.id, parsed.data.shipmentId));

  revalidatePath("/shipments");
  revalidatePath("/driver");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteShipment(id: string) {
  const user = await requireUser();
  if (user.role !== "owner") return { ok: false as const, error: "forbidden" };
  await db.delete(tripAssignments).where(eq(tripAssignments.shipmentId, id));
  await db.delete(shipments).where(eq(shipments.id, id));
  revalidatePath("/shipments");
  return { ok: true as const };
}

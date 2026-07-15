import "server-only";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db/client";
import { customers, profiles, shipments, tripAssignments, vehicles } from "@/lib/db/schema";

const driverProfile = alias(profiles, "driver_profile");

const baseSelect = {
  shipment: shipments,
  customerName: customers.name,
  plateNumber: vehicles.plateNumber,
  driverId: tripAssignments.driverId,
  driverName: driverProfile.fullName,
};

export type ShipmentRow = {
  shipment: typeof shipments.$inferSelect;
  customerName: string;
  plateNumber: string | null;
  driverId: string | null;
  driverName: string | null;
};

export async function listShipments(): Promise<ShipmentRow[]> {
  return db
    .select(baseSelect)
    .from(shipments)
    .innerJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
    .leftJoin(tripAssignments, eq(tripAssignments.shipmentId, shipments.id))
    .leftJoin(driverProfile, eq(tripAssignments.driverId, driverProfile.id))
    .orderBy(desc(shipments.createdAt));
}

/** Driver-scoped: only trips assigned to this driver, per the RLS direction. */
export async function listShipmentsForDriver(driverId: string): Promise<ShipmentRow[]> {
  return db
    .select(baseSelect)
    .from(shipments)
    .innerJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
    .innerJoin(tripAssignments, eq(tripAssignments.shipmentId, shipments.id))
    .leftJoin(driverProfile, eq(tripAssignments.driverId, driverProfile.id))
    .where(eq(tripAssignments.driverId, driverId))
    .orderBy(desc(shipments.createdAt));
}

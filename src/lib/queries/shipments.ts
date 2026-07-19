import "server-only";
import { and, desc, eq, like, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db/client";
import {
  customers,
  profiles,
  shipments,
  tripAssignments,
  vehicles,
  SHIPMENT_STATUSES,
  type ShipmentStatus,
} from "@/lib/db/schema";

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

export type ShipmentFilters = { status?: string; q?: string };

export async function listShipments(filters: ShipmentFilters = {}): Promise<ShipmentRow[]> {
  const conds: SQL[] = [];
  if (filters.status && SHIPMENT_STATUSES.includes(filters.status as ShipmentStatus)) {
    conds.push(eq(shipments.status, filters.status as ShipmentStatus));
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    const search = or(
      like(shipments.origin, term),
      like(shipments.destination, term),
      like(shipments.goodsDescription, term),
      like(customers.name, term),
      like(vehicles.plateNumber, term)
    );
    if (search) conds.push(search);
  }

  return db
    .select(baseSelect)
    .from(shipments)
    .innerJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
    .leftJoin(tripAssignments, eq(tripAssignments.shipmentId, shipments.id))
    .leftJoin(driverProfile, eq(tripAssignments.driverId, driverProfile.id))
    .where(conds.length ? and(...conds) : undefined)
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

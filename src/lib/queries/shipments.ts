import "server-only";
import { and, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db/client";
import {
  customers,
  invoices,
  payments,
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
  invoicedAmount: sql<number>`coalesce((select sum(${invoices.amount}) from ${invoices} where ${invoices.shipmentId} = ${shipments.id}), 0)`,
  paidAmount: sql<number>`coalesce((select sum(${payments.amount}) from ${payments} join ${invoices} on ${payments.invoiceId} = ${invoices.id} where ${invoices.shipmentId} = ${shipments.id}), 0)`,
};

export type ShipmentRow = {
  shipment: typeof shipments.$inferSelect;
  customerName: string;
  plateNumber: string | null;
  driverId: string | null;
  driverName: string | null;
  invoicedAmount: number;
  paidAmount: number;
};

export type PaymentState = "paid" | "partial" | "unpaid" | "no_invoice";

export function paymentStateOf(row: Pick<ShipmentRow, "invoicedAmount" | "paidAmount">): PaymentState {
  if (row.invoicedAmount <= 0) return "no_invoice";
  if (row.paidAmount >= row.invoicedAmount) return "paid";
  if (row.paidAmount > 0) return "partial";
  return "unpaid";
}

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

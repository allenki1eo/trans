import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/lib/db/client";
import {
  items,
  profiles,
  shipmentItems,
  shipments,
  stockMovements,
  tripAssignments,
  vehicles,
  type ShipmentStatus,
} from "@/lib/db/schema";

export type ItemStockRow = {
  id: string;
  name: string;
  unit: string;
  received: number;
  inTransit: number;
  delivered: number;
  depotStock: number;
};

/**
 * Depot stock is always derived, never stored: goods received into the
 * depot (stockMovements) minus goods loaded onto any non-cancelled
 * shipment. In-transit / delivered break the "out" side down by status so
 * the overview can show where each unit currently sits.
 */
export async function listItemStock(): Promise<ItemStockRow[]> {
  const allItems = await db.select().from(items).orderBy(items.name);
  if (allItems.length === 0) return [];

  const [receivedRows, outRows] = await Promise.all([
    db
      .select({
        itemId: stockMovements.itemId,
        total: sql<number>`coalesce(sum(${stockMovements.quantity}), 0)`,
      })
      .from(stockMovements)
      .groupBy(stockMovements.itemId),
    db
      .select({
        itemId: shipmentItems.itemId,
        status: shipments.status,
        total: sql<number>`coalesce(sum(${shipmentItems.quantity}), 0)`,
      })
      .from(shipmentItems)
      .innerJoin(shipments, eq(shipmentItems.shipmentId, shipments.id))
      .groupBy(shipmentItems.itemId, shipments.status),
  ]);

  const receivedMap = new Map(receivedRows.map((r) => [r.itemId, r.total]));

  return allItems.map((item) => {
    const statusRows = outRows.filter((r) => r.itemId === item.id);
    const inTransit = statusRows
      .filter((r) => r.status === "pending" || r.status === "in_transit")
      .reduce((sum, r) => sum + r.total, 0);
    const delivered = statusRows
      .filter((r) => r.status === "delivered")
      .reduce((sum, r) => sum + r.total, 0);
    const outNonCancelled = statusRows
      .filter((r) => r.status !== "cancelled")
      .reduce((sum, r) => sum + r.total, 0);
    const received = receivedMap.get(item.id) ?? 0;
    return {
      id: item.id,
      name: item.name,
      unit: item.unit,
      received,
      inTransit,
      delivered,
      depotStock: received - outNonCancelled,
    };
  });
}

const custodyDriver = alias(profiles, "custody_driver_profile");

export type CustodyRow = {
  shipmentId: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  vehicleId: string | null;
  plateNumber: string | null;
  driverId: string | null;
  driverName: string | null;
};

/** Goods currently out with a vehicle/driver — not yet delivered or cancelled. */
export async function listCustody(vehicleId?: string): Promise<CustodyRow[]> {
  const activeStatus = inArray(shipments.status, ["pending", "in_transit"] satisfies ShipmentStatus[]);
  return db
    .select({
      shipmentId: shipments.id,
      origin: shipments.origin,
      destination: shipments.destination,
      status: shipments.status,
      itemId: items.id,
      itemName: items.name,
      unit: items.unit,
      quantity: shipmentItems.quantity,
      vehicleId: vehicles.id,
      plateNumber: vehicles.plateNumber,
      driverId: tripAssignments.driverId,
      driverName: custodyDriver.fullName,
    })
    .from(shipmentItems)
    .innerJoin(shipments, eq(shipmentItems.shipmentId, shipments.id))
    .innerJoin(items, eq(shipmentItems.itemId, items.id))
    .leftJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
    .leftJoin(tripAssignments, eq(tripAssignments.shipmentId, shipments.id))
    .leftJoin(custodyDriver, eq(tripAssignments.driverId, custodyDriver.id))
    .where(vehicleId ? and(activeStatus, eq(shipments.vehicleId, vehicleId)) : activeStatus)
    .orderBy(desc(shipments.createdAt));
}

export type ShipmentItemRow = {
  id: string;
  shipmentId: string;
  itemId: string;
  name: string;
  unit: string;
  quantity: number;
};

export async function listItemsForShipment(shipmentId: string): Promise<ShipmentItemRow[]> {
  return db
    .select({
      id: shipmentItems.id,
      shipmentId: shipmentItems.shipmentId,
      itemId: shipmentItems.itemId,
      name: items.name,
      unit: items.unit,
      quantity: shipmentItems.quantity,
    })
    .from(shipmentItems)
    .innerJoin(items, eq(shipmentItems.itemId, items.id))
    .where(eq(shipmentItems.shipmentId, shipmentId));
}

/** Bulk variant grouped by shipment, for pages rendering many trips at once. */
export async function itemsByShipmentId(
  shipmentIds: string[]
): Promise<Map<string, ShipmentItemRow[]>> {
  const map = new Map<string, ShipmentItemRow[]>();
  if (shipmentIds.length === 0) return map;

  const rows = await db
    .select({
      id: shipmentItems.id,
      shipmentId: shipmentItems.shipmentId,
      itemId: shipmentItems.itemId,
      name: items.name,
      unit: items.unit,
      quantity: shipmentItems.quantity,
    })
    .from(shipmentItems)
    .innerJoin(items, eq(shipmentItems.itemId, items.id))
    .where(inArray(shipmentItems.shipmentId, shipmentIds));

  for (const row of rows) {
    const list = map.get(row.shipmentId) ?? [];
    list.push(row);
    map.set(row.shipmentId, list);
  }
  return map;
}

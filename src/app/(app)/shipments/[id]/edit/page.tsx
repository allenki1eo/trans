import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { shipments, tripAssignments } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { customerOptions, driverOptions, vehicleOptions } from "@/lib/queries/options";
import { itemOptionsWithStock, listItemsForShipment } from "@/lib/queries/stock";
import { PageHeader } from "@/components/page-header";
import { ShipmentForm } from "../../shipment-form";

export default async function EditShipmentPage({ params }: { params: { id: string } }) {
  await requireRole("owner", "dispatcher");
  const t = getT();

  const shipment = await db.query.shipments.findFirst({ where: eq(shipments.id, params.id) });
  if (!shipment) notFound();

  const assignment = await db.query.tripAssignments.findFirst({
    where: eq(tripAssignments.shipmentId, shipment.id),
  });

  const [customers, vehicles, drivers, items, existingItems] = await Promise.all([
    customerOptions(),
    vehicleOptions(),
    driverOptions(),
    itemOptionsWithStock(shipment.id),
    listItemsForShipment(shipment.id),
  ]);

  return (
    <div>
      <PageHeader title={t.shipments.edit} />
      <ShipmentForm
        id={shipment.id}
        defaults={{
          customerId: shipment.customerId,
          vehicleId: shipment.vehicleId ?? "",
          driverId: assignment?.driverId ?? "",
          origin: shipment.origin,
          destination: shipment.destination,
          price: shipment.price,
          distanceKm: shipment.distanceKm ?? undefined,
          items: existingItems.map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
        }}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        items={items}
        labels={{
          customer: t.shipments.customer,
          vehicle: t.shipments.vehicle,
          driver: t.shipments.driver,
          origin: t.shipments.origin,
          destination: t.shipments.destination,
          price: t.shipments.price,
          distanceKm: t.shipments.distanceKm,
          save: t.common.save,
          cancel: t.common.cancel,
          required: t.common.required,
          itemsTitle: t.nav.items,
          item: t.stock.item,
          quantity: t.stock.quantity,
          addLine: t.items.addLine,
          removeLine: t.items.removeLine,
          available: t.stock.available,
          exceedsStock: t.stock.exceedsStock,
          noItemsInCatalog: t.shipments.noItemsInCatalog,
          addItemFirst: t.shipments.addItemFirst,
        }}
      />
    </div>
  );
}

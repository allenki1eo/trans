import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { customerOptions, driverOptions, vehicleOptions } from "@/lib/queries/options";
import { itemOptionsWithStock } from "@/lib/queries/stock";
import { PageHeader } from "@/components/page-header";
import { ShipmentForm } from "../shipment-form";

export default async function NewShipmentPage() {
  await requireRole("owner", "dispatcher");
  const t = getT();
  const [customers, vehicles, drivers, items] = await Promise.all([
    customerOptions(),
    vehicleOptions(),
    driverOptions(),
    itemOptionsWithStock(),
  ]);

  return (
    <div>
      <PageHeader title={t.shipments.new} />
      <ShipmentForm
        id={null}
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

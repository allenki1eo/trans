import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { customerOptions, driverOptions, vehicleOptions } from "@/lib/queries/options";
import { PageHeader } from "@/components/page-header";
import { ShipmentForm } from "../shipment-form";

export default async function NewShipmentPage() {
  await requireRole("owner", "dispatcher");
  const t = getT();
  const [customers, vehicles, drivers] = await Promise.all([
    customerOptions(),
    vehicleOptions(),
    driverOptions(),
  ]);

  return (
    <div>
      <PageHeader title={t.shipments.new} />
      <ShipmentForm
        id={null}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        labels={{
          customer: t.shipments.customer,
          vehicle: t.shipments.vehicle,
          driver: t.shipments.driver,
          origin: t.shipments.origin,
          destination: t.shipments.destination,
          goods: t.shipments.goods,
          weight: t.shipments.weight,
          price: t.shipments.price,
          save: t.common.save,
          cancel: t.common.cancel,
          required: t.common.required,
        }}
      />
    </div>
  );
}

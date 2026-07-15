import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { VehicleForm } from "../vehicle-form";

export default async function NewVehiclePage() {
  await requireRole("owner");
  const t = getT();

  return (
    <div>
      <PageHeader title={t.vehicles.new} />
      <VehicleForm
        id={null}
        labels={{
          plate: t.vehicles.plate,
          makeModel: t.vehicles.makeModel,
          capacity: t.vehicles.capacity,
          status: t.common.status,
          statuses: t.vehicles.statuses,
          save: t.common.save,
          cancel: t.common.cancel,
          required: t.common.required,
        }}
      />
    </div>
  );
}

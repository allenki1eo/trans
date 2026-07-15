import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { vehicles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { VehicleForm } from "../../vehicle-form";

export default async function EditVehiclePage({ params }: { params: { id: string } }) {
  await requireRole("owner");
  const t = getT();

  const vehicle = await db.query.vehicles.findFirst({ where: eq(vehicles.id, params.id) });
  if (!vehicle) notFound();

  return (
    <div>
      <PageHeader title={t.vehicles.edit} />
      <VehicleForm
        id={vehicle.id}
        defaults={{
          plateNumber: vehicle.plateNumber,
          makeModel: vehicle.makeModel,
          capacity: vehicle.capacity ?? "",
          status: vehicle.status,
        }}
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

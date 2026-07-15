import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { shipments, tripAssignments, vehicles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { ExpenseForm } from "@/components/expense-form";

/**
 * Driver quick-add. Vehicle and trip choices are scoped to this driver's
 * assignments — the server action re-checks the same rule.
 */
export default async function DriverExpensePage({
  searchParams,
}: {
  searchParams: { shipment?: string };
}) {
  const user = await requireRole("driver", "owner");
  const t = getT();

  const assignments = await db
    .select({
      shipmentId: tripAssignments.shipmentId,
      vehicleId: tripAssignments.vehicleId,
      plate: vehicles.plateNumber,
      origin: shipments.origin,
      destination: shipments.destination,
    })
    .from(tripAssignments)
    .innerJoin(vehicles, eq(tripAssignments.vehicleId, vehicles.id))
    .innerJoin(shipments, eq(tripAssignments.shipmentId, shipments.id))
    .where(eq(tripAssignments.driverId, user.id));

  const vehicleOptions = Array.from(
    new Map(assignments.map((a) => [a.vehicleId, { id: a.vehicleId, label: a.plate }])).values()
  );
  const shipmentOptions = assignments.map((a) => ({
    id: a.shipmentId,
    label: `${a.origin} → ${a.destination}`,
  }));

  const preselected = assignments.find((a) => a.shipmentId === searchParams.shipment);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t.expenses.quickAdd} />
      <ExpenseForm
        compact
        vehicles={vehicleOptions}
        shipments={shipmentOptions}
        defaults={
          preselected
            ? { shipmentId: preselected.shipmentId, vehicleId: preselected.vehicleId }
            : undefined
        }
        redirectTo="/driver"
        labels={{
          category: t.expenses.category,
          vehicle: t.expenses.vehicle,
          shipment: t.expenses.shipment,
          amount: t.common.amount,
          description: t.common.description,
          save: t.common.save,
          required: t.common.required,
          categories: t.expenses.categories,
        }}
      />
    </div>
  );
}

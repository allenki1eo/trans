import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { shipments } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { vehicleOptions } from "@/lib/queries/options";
import { PageHeader } from "@/components/page-header";
import { ExpenseForm } from "@/components/expense-form";

export default async function NewExpensePage() {
  await requireRole("owner");
  const t = getT();

  const [vehicles, shipmentRows] = await Promise.all([
    vehicleOptions(),
    db
      .select({ id: shipments.id, origin: shipments.origin, destination: shipments.destination })
      .from(shipments)
      .orderBy(desc(shipments.createdAt))
      .limit(100),
  ]);

  return (
    <div>
      <PageHeader title={t.expenses.new} />
      <ExpenseForm
        vehicles={vehicles}
        shipments={shipmentRows.map((s) => ({ id: s.id, label: `${s.origin} → ${s.destination}` }))}
        redirectTo="/expenses"
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

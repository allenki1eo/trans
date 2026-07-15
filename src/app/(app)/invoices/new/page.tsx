import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { customers, shipments } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { InvoiceForm } from "./invoice-form";

export default async function NewInvoicePage() {
  await requireRole("owner", "dispatcher", "accountant");
  const t = getT();

  const rows = await db
    .select({
      id: shipments.id,
      origin: shipments.origin,
      destination: shipments.destination,
      price: shipments.price,
      customerName: customers.name,
    })
    .from(shipments)
    .innerJoin(customers, eq(shipments.customerId, customers.id))
    .orderBy(desc(shipments.createdAt))
    .limit(200);

  return (
    <div>
      <PageHeader title={t.invoices.new} />
      <InvoiceForm
        shipments={rows.map((s) => ({
          id: s.id,
          label: `${s.customerName}: ${s.origin} → ${s.destination}`,
          price: s.price,
        }))}
        labels={{
          shipment: t.expenses.shipment,
          amount: t.common.amount,
          dueDate: t.invoices.dueDate,
          save: t.common.save,
          cancel: t.common.cancel,
          required: t.common.required,
        }}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "../../customer-form";

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  await requireRole("owner", "dispatcher");
  const t = getT();

  const customer = await db.query.customers.findFirst({ where: eq(customers.id, params.id) });
  if (!customer) notFound();

  return (
    <div>
      <PageHeader title={t.customers.edit} />
      <CustomerForm
        id={customer.id}
        defaults={{
          name: customer.name,
          phone: customer.phone ?? "",
          email: customer.email ?? "",
          address: customer.address ?? "",
        }}
        labels={{
          name: t.common.name,
          phone: t.common.phone,
          email: t.common.email,
          address: t.common.address,
          save: t.common.save,
          cancel: t.common.cancel,
          required: t.common.required,
        }}
      />
    </div>
  );
}

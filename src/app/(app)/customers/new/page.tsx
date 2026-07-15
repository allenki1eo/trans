import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "../customer-form";

export default async function NewCustomerPage() {
  await requireRole("owner", "dispatcher");
  const t = getT();

  return (
    <div>
      <PageHeader title={t.customers.new} />
      <CustomerForm
        id={null}
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

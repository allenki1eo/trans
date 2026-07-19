import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { ItemForm } from "../item-form";

export default async function NewItemPage() {
  await requireRole("owner", "dispatcher");
  const t = getT();

  return (
    <div>
      <PageHeader title={t.items.new} />
      <ItemForm
        id={null}
        labels={{
          name: t.common.name,
          unit: t.items.unit,
          unitHint: t.items.unitHint,
          save: t.common.save,
          cancel: t.common.cancel,
          required: t.common.required,
        }}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { items } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { ItemForm } from "../../item-form";

export default async function EditItemPage({ params }: { params: { id: string } }) {
  await requireRole("owner", "dispatcher");
  const t = getT();

  const item = await db.query.items.findFirst({ where: eq(items.id, params.id) });
  if (!item) notFound();

  return (
    <div>
      <PageHeader title={t.items.edit} />
      <ItemForm
        id={item.id}
        defaults={{ name: item.name, unit: item.unit }}
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

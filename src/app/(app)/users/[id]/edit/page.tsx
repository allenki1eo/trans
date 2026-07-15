import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { UserForm } from "../../user-form";

export default async function EditUserPage({ params }: { params: { id: string } }) {
  await requireRole("owner");
  const t = getT();

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, params.id) });
  if (!profile) notFound();

  return (
    <div>
      <PageHeader title={t.users.edit} />
      <UserForm
        id={profile.id}
        defaults={{
          email: profile.email,
          fullName: profile.fullName,
          phone: profile.phone ?? "",
          role: profile.role,
          password: "",
          active: profile.active,
        }}
        labels={{
          fullName: t.users.fullName,
          email: t.common.email,
          phone: t.common.phone,
          role: t.users.role,
          password: t.users.password,
          passwordHint: t.users.passwordHint,
          roles: t.users.roles,
          save: t.common.save,
          cancel: t.common.cancel,
          required: t.common.required,
        }}
      />
    </div>
  );
}

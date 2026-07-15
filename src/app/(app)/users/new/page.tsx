import { requireRole } from "@/lib/auth/require";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { UserForm } from "../user-form";

export default async function NewUserPage() {
  await requireRole("owner");
  const t = getT();

  return (
    <div>
      <PageHeader title={t.users.new} />
      <UserForm
        id={null}
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

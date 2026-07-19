import { requireUser } from "@/lib/auth/require";
import { getLocale, getT } from "@/lib/i18n/locale";
import { Nav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const t = getT();
  const locale = getLocale();

  return (
    <div className="min-h-screen">
      <Nav
        role={user.role}
        userName={user.fullName}
        roleLabel={t.users.roles[user.role]}
        appName={t.appName}
        labels={t.nav}
        locale={locale}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:pl-[17rem] lg:pr-8 lg:max-w-none xl:max-w-[96rem]">
        {children}
      </main>
    </div>
  );
}

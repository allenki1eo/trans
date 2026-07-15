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
        appName={t.appName}
        labels={t.nav}
        locale={locale}
      />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

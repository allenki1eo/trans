import { requireUser } from "@/lib/auth/require";
import { getLocale, getT } from "@/lib/i18n/locale";
import { getTheme } from "@/lib/theme/theme";
import { Nav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const t = getT();
  const locale = getLocale();
  const theme = getTheme();

  return (
    <div className="min-h-screen">
      <Nav
        role={user.role}
        userName={user.fullName}
        roleLabel={t.users.roles[user.role]}
        appName={t.appName}
        labels={t.nav}
        locale={locale}
        theme={theme}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:pl-[17rem] lg:pr-8 lg:max-w-none xl:max-w-[96rem]">
        {children}
      </main>
    </div>
  );
}

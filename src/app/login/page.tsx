import { getLocale, getT } from "@/lib/i18n/locale";
import { LocaleToggle } from "@/components/locale-toggle";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const t = getT();
  const locale = getLocale();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-accent">▮</span> {t.appName}
          </h1>
          <LocaleToggle locale={locale} />
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="mb-5 text-sm text-muted">{t.auth.welcome}</p>
          <LoginForm
            labels={{
              email: t.auth.email,
              password: t.auth.password,
              login: t.auth.login,
              invalidCredentials: t.auth.invalidCredentials,
            }}
          />
        </div>
      </div>
    </main>
  );
}

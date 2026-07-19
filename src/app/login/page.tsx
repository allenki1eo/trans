import { Route, ShieldCheck, TrendingUp, Truck } from "lucide-react";
import { getLocale, getT } from "@/lib/i18n/locale";
import { getTheme } from "@/lib/theme/theme";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  const t = getT();
  const locale = getLocale();
  const theme = getTheme();

  const highlights = [
    { icon: Route, label: t.nav.shipments },
    { icon: Truck, label: t.nav.vehicles },
    { icon: TrendingUp, label: t.dashboard.profit },
  ];

  return (
    <main className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-border bg-surface/40 p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(700px 400px at 20% 20%, hsl(42 88% 55% / 0.10), transparent), radial-gradient(600px 500px at 90% 90%, hsl(210 80% 60% / 0.08), transparent)",
          }}
        />
        <span className="relative flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-accent to-warning font-black text-accent-foreground">
            T
          </span>
          Trans<span className="text-accent">Track</span>
        </span>
        <div className="relative max-w-md space-y-6">
          <h1 className="text-3xl font-bold leading-tight">{t.auth.tagline}</h1>
          <div className="flex gap-3">
            {highlights.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted"
              >
                <Icon className="h-4 w-4 text-accent" />
                {label}
              </span>
            ))}
          </div>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="h-4 w-4" />
          {t.appName}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-between lg:justify-end">
            <span className="flex items-center gap-2 text-xl font-bold tracking-tight lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-accent to-warning font-black text-accent-foreground">
                T
              </span>
              Trans<span className="text-accent">Track</span>
            </span>
            <div className="flex items-center gap-2">
              <LocaleToggle locale={locale} />
              <ThemeToggle theme={theme} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-black/5 dark:shadow-black/20">
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
      </div>
    </main>
  );
}

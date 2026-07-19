"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  LogOut,
  Receipt,
  Route,
  ScrollText,
  Truck,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { LocaleToggle } from "@/components/locale-toggle";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { Role } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type NavLabels = {
  dashboard: string;
  customers: string;
  vehicles: string;
  shipments: string;
  expenses: string;
  invoices: string;
  users: string;
  audit: string;
  myTrips: string;
  logout: string;
  sectionOperations: string;
  sectionFinance: string;
  sectionAdmin: string;
};

type LinkKey = keyof Pick<
  NavLabels,
  | "dashboard"
  | "customers"
  | "vehicles"
  | "shipments"
  | "expenses"
  | "invoices"
  | "users"
  | "audit"
  | "myTrips"
>;

const ICONS: Record<LinkKey, typeof BarChart3> = {
  dashboard: BarChart3,
  customers: UsersRound,
  vehicles: Truck,
  shipments: Route,
  expenses: Wallet,
  invoices: FileText,
  users: Users,
  audit: ScrollText,
  myTrips: Receipt,
};

type Section = { titleKey: "sectionOperations" | "sectionFinance" | "sectionAdmin" | null; links: Array<{ key: LinkKey; href: string }> };

function sectionsFor(role: Role): Section[] {
  switch (role) {
    case "owner":
      return [
        {
          titleKey: "sectionOperations",
          links: [
            { key: "dashboard", href: "/dashboard" },
            { key: "shipments", href: "/shipments" },
            { key: "customers", href: "/customers" },
            { key: "vehicles", href: "/vehicles" },
          ],
        },
        {
          titleKey: "sectionFinance",
          links: [
            { key: "expenses", href: "/expenses" },
            { key: "invoices", href: "/invoices" },
            { key: "audit", href: "/audit" },
          ],
        },
        { titleKey: "sectionAdmin", links: [{ key: "users", href: "/users" }] },
      ];
    case "dispatcher":
      return [
        {
          titleKey: "sectionOperations",
          links: [
            { key: "shipments", href: "/shipments" },
            { key: "customers", href: "/customers" },
            { key: "vehicles", href: "/vehicles" },
          ],
        },
        { titleKey: "sectionFinance", links: [{ key: "invoices", href: "/invoices" }] },
      ];
    case "accountant":
      return [
        {
          titleKey: "sectionOperations",
          links: [
            { key: "dashboard", href: "/dashboard" },
            { key: "shipments", href: "/shipments" },
            { key: "customers", href: "/customers" },
            { key: "vehicles", href: "/vehicles" },
          ],
        },
        {
          titleKey: "sectionFinance",
          links: [
            { key: "expenses", href: "/expenses" },
            { key: "invoices", href: "/invoices" },
          ],
        },
      ];
    case "driver":
      return [
        {
          titleKey: null,
          links: [
            { key: "myTrips", href: "/driver" },
            { key: "expenses", href: "/driver/expenses" },
          ],
        },
      ];
  }
}

function Brand({ appName }: { appName: string }) {
  return (
    <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent to-warning font-black text-accent-foreground shadow-[0_0_16px_-2px_hsl(42_88%_55%/0.5)]">
        T
      </span>
      <span>
        Trans<span className="text-accent">Track</span>
      </span>
    </span>
  );
}

export function Nav({
  role,
  userName,
  roleLabel,
  appName,
  labels,
  locale,
}: {
  role: Role;
  userName: string;
  roleLabel: string;
  appName: string;
  labels: NavLabels;
  locale: Locale;
}) {
  const pathname = usePathname();
  const sections = sectionsFor(role);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const linkClass = (active: boolean) =>
    cn(
      "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all",
      active
        ? "bg-accent/10 font-medium text-accent shadow-[inset_2px_0_0_0_hsl(42_88%_55%)]"
        : "text-muted hover:bg-surface-raised hover:text-foreground"
    );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface/60 backdrop-blur lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href={sections[0].links[0].href}>
            <Brand appName={appName} />
          </Link>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {sections.map((section, i) => (
            <div key={i}>
              {section.titleKey && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted/70">
                  {labels[section.titleKey]}
                </p>
              )}
              <div className="space-y-0.5">
                {section.links.map(({ key, href }) => {
                  const Icon = ICONS[key];
                  return (
                    <Link key={href} href={href} className={linkClass(isActive(href))}>
                      <Icon className="h-4 w-4 shrink-0" />
                      {labels[key]}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-border p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised font-semibold text-accent">
              {userName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted">{roleLabel}</p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                title={labels.logout}
                className="rounded-md p-2 text-muted transition-colors hover:bg-surface-raised hover:text-danger"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
          <LocaleToggle locale={locale} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link href={sections[0].links[0].href}>
            <Brand appName={appName} />
          </Link>
          <div className="flex-1" />
          <LocaleToggle locale={locale} />
          <form action={logout}>
            <button
              type="submit"
              title={labels.logout}
              className="rounded-md p-2 text-muted transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto px-3 pb-2">
          {sections.flatMap((s) => s.links).map(({ key, href }) => {
            const Icon = ICONS[key];
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border text-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {labels[key]}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}

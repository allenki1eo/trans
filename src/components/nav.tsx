"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  FileText,
  LogOut,
  Menu,
  PackageSearch,
  Receipt,
  Route,
  ScrollText,
  Truck,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/lib/i18n/dictionaries";
import type { Theme } from "@/lib/theme/theme";
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
  sectionInventory: string;
  sectionFinance: string;
  sectionAdmin: string;
  items: string;
  stock: string;
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
  | "items"
  | "stock"
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
  items: Boxes,
  stock: PackageSearch,
};

type Section = {
  titleKey: "sectionOperations" | "sectionInventory" | "sectionFinance" | "sectionAdmin" | null;
  links: Array<{ key: LinkKey; href: string }>;
};

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
          titleKey: "sectionInventory",
          links: [
            { key: "stock", href: "/stock" },
            { key: "items", href: "/items" },
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
        {
          titleKey: "sectionInventory",
          links: [
            { key: "stock", href: "/stock" },
            { key: "items", href: "/items" },
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
        { titleKey: "sectionInventory", links: [{ key: "stock", href: "/stock" }] },
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

function Brand() {
  return (
    <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent to-warning font-black text-accent-foreground shadow-[0_0_16px_-2px_hsl(var(--accent)/0.5)]">
        D
      </span>
      <span>
        Dami<span className="text-accent">&Co</span>
      </span>
    </span>
  );
}

function SectionLinks({
  sections,
  labels,
  pathname,
  onNavigate,
}: {
  sections: Section[];
  labels: NavLabels;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  return (
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
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all",
                    isActive(href)
                      ? "bg-accent/10 font-medium text-accent shadow-[inset_2px_0_0_0_hsl(var(--accent))]"
                      : "text-muted hover:bg-surface-raised hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {labels[key]}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UserFooter({
  userName,
  roleLabel,
  logoutLabel,
  locale,
  theme,
}: {
  userName: string;
  roleLabel: string;
  logoutLabel: string;
  locale: Locale;
  theme: Theme;
}) {
  return (
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
            title={logoutLabel}
            className="rounded-md p-2 text-muted transition-colors hover:bg-surface-raised hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
      <div className="flex items-center gap-2">
        <LocaleToggle locale={locale} />
        <ThemeToggle theme={theme} />
      </div>
    </div>
  );
}

export function Nav({
  role,
  userName,
  roleLabel,
  labels,
  locale,
  theme,
}: {
  role: Role;
  userName: string;
  roleLabel: string;
  appName?: string;
  labels: NavLabels;
  locale: Locale;
  theme: Theme;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sections = sectionsFor(role);

  // Close the drawer whenever navigation happens.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface/60 backdrop-blur lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href={sections[0].links[0].href}>
            <Brand />
          </Link>
        </div>
        <SectionLinks sections={sections} labels={labels} pathname={pathname} />
        <UserFooter
          userName={userName}
          roleLabel={roleLabel}
          logoutLabel={labels.logout}
          locale={locale}
          theme={theme}
        />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href={sections[0].links[0].href}>
            <Brand />
          </Link>
          <div className="flex-1" />
          <ThemeToggle theme={theme} />
        </div>
      </header>

      {/* Mobile slide-in drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          drawerOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
            drawerOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-2xl transition-transform duration-200",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-14 items-center justify-between px-4">
            <Brand />
            <button
              type="button"
              aria-label="Close"
              onClick={() => setDrawerOpen(false)}
              className="rounded-md p-2 text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SectionLinks
            sections={sections}
            labels={labels}
            pathname={pathname}
            onNavigate={() => setDrawerOpen(false)}
          />
          <UserFooter
            userName={userName}
            roleLabel={roleLabel}
            logoutLabel={labels.logout}
            locale={locale}
            theme={theme}
          />
        </div>
      </div>
    </>
  );
}

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
};

const ICONS = {
  dashboard: BarChart3,
  customers: UsersRound,
  vehicles: Truck,
  shipments: Route,
  expenses: Wallet,
  invoices: FileText,
  users: Users,
  audit: ScrollText,
  myTrips: Receipt,
} as const;

function linksFor(role: Role): Array<{ key: keyof typeof ICONS; href: string }> {
  switch (role) {
    case "owner":
      return [
        { key: "dashboard", href: "/dashboard" },
        { key: "shipments", href: "/shipments" },
        { key: "customers", href: "/customers" },
        { key: "vehicles", href: "/vehicles" },
        { key: "expenses", href: "/expenses" },
        { key: "invoices", href: "/invoices" },
        { key: "users", href: "/users" },
        { key: "audit", href: "/audit" },
      ];
    case "dispatcher":
      return [
        { key: "shipments", href: "/shipments" },
        { key: "customers", href: "/customers" },
        { key: "vehicles", href: "/vehicles" },
        { key: "invoices", href: "/invoices" },
      ];
    case "accountant":
      return [
        { key: "dashboard", href: "/dashboard" },
        { key: "shipments", href: "/shipments" },
        { key: "customers", href: "/customers" },
        { key: "vehicles", href: "/vehicles" },
        { key: "expenses", href: "/expenses" },
        { key: "invoices", href: "/invoices" },
      ];
    case "driver":
      return [
        { key: "myTrips", href: "/driver" },
        { key: "expenses", href: "/driver/expenses" },
      ];
  }
}

export function Nav({
  role,
  userName,
  appName,
  labels,
  locale,
}: {
  role: Role;
  userName: string;
  appName: string;
  labels: NavLabels;
  locale: Locale;
}) {
  const pathname = usePathname();
  const links = linksFor(role);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href={links[0].href} className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-accent">▮</span>
          {appName}
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {links.map(({ key, href }) => {
            const Icon = ICONS[key];
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-surface-raised text-accent"
                    : "text-muted hover:bg-surface-raised hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{labels[key]}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleToggle locale={locale} />
          <span className="hidden text-sm text-muted md:inline">{userName}</span>
          <form action={logout}>
            <button
              type="submit"
              title={labels.logout}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

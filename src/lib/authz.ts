import type { Role } from "@/lib/db/schema";

/**
 * Central permission matrix — the application-layer equivalent of the RLS
 * policies described in CLAUDE.md. Turso/SQLite has no Row Level Security,
 * so every server action and page MUST consult this module (and scope
 * queries per-driver via trip_assignments) instead of relying on UI checks.
 */
export const PERMISSIONS = {
  "customers.read": ["owner", "dispatcher", "accountant"],
  "customers.write": ["owner", "dispatcher"],
  "vehicles.read": ["owner", "dispatcher", "accountant"],
  "vehicles.write": ["owner"],
  "shipments.read": ["owner", "dispatcher", "accountant"],
  "shipments.write": ["owner", "dispatcher"],
  // Drivers update status only on their own assigned trips (query-scoped).
  "shipments.updateStatusOwn": ["owner", "dispatcher", "driver"],
  "expenses.read": ["owner", "accountant"],
  "expenses.create": ["owner", "driver"],
  "expenses.delete": ["owner"],
  "invoices.read": ["owner", "dispatcher", "accountant"],
  "invoices.create": ["owner", "dispatcher", "accountant"],
  "invoices.update": ["owner", "accountant"],
  "payments.create": ["owner", "accountant"],
  "reports.read": ["owner", "accountant"],
  "export.csv": ["owner", "accountant"],
  "audit.read": ["owner"],
  "users.manage": ["owner"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

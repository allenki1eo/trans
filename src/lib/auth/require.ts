import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";
import type { Role } from "@/lib/db/schema";

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Gate a page/action to specific roles. Redirects to the user's home page
 * rather than erroring, so a driver deep-linking to /invoices just lands
 * back on their trips.
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(homeFor(user.role));
  return user;
}

export function homeFor(role: Role): string {
  return role === "driver" ? "/driver" : "/dashboard";
}

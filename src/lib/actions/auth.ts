"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { createSession, destroySession } from "@/lib/auth/session";
import { homeFor } from "@/lib/auth/require";
import { loginSchema } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function login(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const user = await db.query.profiles.findFirst({
    where: eq(profiles.email, parsed.data.email.toLowerCase()),
  });
  if (!user || !user.active) return { ok: false, error: "invalid" };

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { ok: false, error: "invalid" };

  await createSession(user.id);
  redirect(homeFor(user.role));
}

export async function logout() {
  destroySession();
  redirect("/login");
}

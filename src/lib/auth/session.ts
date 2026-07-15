import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { profiles, type Role } from "@/lib/db/schema";

const COOKIE_NAME = "trans_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export function destroySession() {
  cookies().delete(COOKIE_NAME);
}

/**
 * Returns the logged-in user or null. Looks the profile up fresh on every
 * request (cached per-render) so role changes and deactivation take effect
 * without waiting for the cookie to expire.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    userId = payload.sub;
  } catch {
    return null;
  }

  const user = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
  });
  if (!user || !user.active) return null;

  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
});

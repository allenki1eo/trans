"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALES, type Locale } from "./dictionaries";

export async function setLocale(locale: Locale) {
  if (!LOCALES.includes(locale)) return;
  cookies().set("trans_locale", locale, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/", "layout");
}

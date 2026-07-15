import "server-only";
import { cookies } from "next/headers";
import { LOCALES, type Locale, getDictionary } from "./dictionaries";

const COOKIE_NAME = "trans_locale";

export function getLocale(): Locale {
  const value = cookies().get(COOKIE_NAME)?.value;
  return LOCALES.includes(value as Locale) ? (value as Locale) : "en";
}

export function getT() {
  return getDictionary(getLocale());
}

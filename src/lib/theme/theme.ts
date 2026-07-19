import "server-only";
import { cookies } from "next/headers";

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

const COOKIE_NAME = "trans_theme";

/** Dark is the default — the app's original look. */
export function getTheme(): Theme {
  const value = cookies().get(COOKIE_NAME)?.value;
  return THEMES.includes(value as Theme) ? (value as Theme) : "dark";
}

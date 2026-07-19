"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { THEMES, type Theme } from "./theme";

export async function setTheme(theme: Theme) {
  if (!THEMES.includes(theme)) return;
  cookies().set("trans_theme", theme, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/", "layout");
}

"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function LocaleToggle({ locale }: { locale: Locale }) {
  const [pending, startTransition] = useTransition();

  const button = (target: Locale, label: string) => (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setLocale(target))}
      className={cn(
        "rounded px-2 py-1 text-xs font-semibold transition-colors",
        locale === target ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5">
      {button("en", "EN")}
      {button("sw", "SW")}
    </div>
  );
}

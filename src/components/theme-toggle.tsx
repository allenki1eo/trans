"use client";

import { useTransition } from "react";
import { Moon, Sun } from "lucide-react";
import { setTheme } from "@/lib/theme/actions";
import type { Theme } from "@/lib/theme/theme";

export function ThemeToggle({ theme }: { theme: Theme }) {
  const [pending, startTransition] = useTransition();
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => setTheme(next))}
      title={next}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:text-foreground"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

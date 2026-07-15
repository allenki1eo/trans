import * as React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-surface-raised text-muted border-border",
  amber: "bg-warning/15 text-warning border-warning/30",
  blue: "bg-info/15 text-info border-info/30",
  green: "bg-success/15 text-success border-success/30",
  red: "bg-danger/15 text-danger border-danger/30",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}

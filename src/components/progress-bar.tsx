import { cn } from "@/lib/utils";

export function ProgressBar({
  percent,
  tone = "accent",
  className,
}: {
  percent: number;
  tone?: "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const fillClass = {
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];

  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-raised", className)}>
      <div className={cn("h-full rounded-full transition-all", fillClass)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

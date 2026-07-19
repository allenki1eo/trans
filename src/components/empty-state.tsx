import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised">
        <Icon className="h-5 w-5 text-muted" />
      </span>
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

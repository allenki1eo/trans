"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function ToggleActiveButton({
  onToggle,
  label,
}: {
  onToggle: () => Promise<unknown>;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await onToggle();
        })
      }
    >
      {label}
    </Button>
  );
}

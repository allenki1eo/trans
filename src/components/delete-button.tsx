"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  onDelete,
  confirmMessage,
  label,
}: {
  onDelete: () => Promise<unknown>;
  confirmMessage: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      disabled={pending}
      title={label}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          startTransition(async () => {
            await onDelete();
          });
        }
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

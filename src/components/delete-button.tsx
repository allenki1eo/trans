"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  onDelete,
  confirmMessage,
  label,
  onError,
}: {
  onDelete: () => Promise<unknown>;
  confirmMessage: string;
  label: string;
  /** Called when the action resolves with { ok: false, error }. */
  onError?: (error: string) => void;
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
            const result = await onDelete();
            if (
              onError &&
              result &&
              typeof result === "object" &&
              "ok" in result &&
              result.ok === false &&
              "error" in result
            ) {
              onError(String((result as { error: unknown }).error));
            }
          });
        }
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

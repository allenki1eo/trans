"use client";

import { useState, useTransition } from "react";
import { PackageCheck } from "lucide-react";
import { markShipmentReceived } from "@/lib/actions/shipments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Expandable "confirm goods received" control. Collapsed it's a single
 * button; expanded it asks for the receiver's name (proof of handover).
 */
export function MarkReceived({
  shipmentId,
  labels,
  size = "sm",
  className,
}: {
  shipmentId: string;
  labels: { markReceived: string; receiverName: string; save: string };
  size?: "sm" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <PackageCheck className={size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"} />
        {labels.markReceived}
      </Button>
    );
  }

  return (
    <form
      className={cn("flex items-center gap-2", className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startTransition(async () => {
          const result = await markShipmentReceived(shipmentId, name.trim());
          if (result.ok) setOpen(false);
        });
      }}
    >
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={labels.receiverName}
        className={size === "lg" ? "h-11" : "h-8 text-xs"}
      />
      <Button type="submit" size={size} disabled={pending || !name.trim()}>
        {labels.save}
      </Button>
    </form>
  );
}

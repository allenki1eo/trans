"use client";

import { useTransition } from "react";
import { CheckCircle2, Navigation } from "lucide-react";
import { updateShipmentStatus } from "@/lib/actions/shipments";
import { Button } from "@/components/ui/button";
import type { ShipmentStatus } from "@/lib/db/schema";

export function StatusButtons({
  shipmentId,
  status,
  labels,
}: {
  shipmentId: string;
  status: ShipmentStatus;
  labels: { markInTransit: string; markDelivered: string };
}) {
  const [pending, startTransition] = useTransition();

  if (status === "delivered" || status === "cancelled") return null;

  return (
    <div className="flex gap-2">
      {status === "pending" && (
        <Button
          size="lg"
          variant="secondary"
          className="flex-1"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateShipmentStatus(shipmentId, "in_transit");
            })
          }
        >
          <Navigation className="h-5 w-5" />
          {labels.markInTransit}
        </Button>
      )}
      {status === "in_transit" && (
        <Button
          size="lg"
          className="flex-1"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateShipmentStatus(shipmentId, "delivered");
            })
          }
        >
          <CheckCircle2 className="h-5 w-5" />
          {labels.markDelivered}
        </Button>
      )}
    </div>
  );
}

import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { InvoiceStatus, ShipmentStatus, VehicleStatus } from "@/lib/db/schema";

const SHIPMENT_TONES: Record<ShipmentStatus, BadgeTone> = {
  pending: "amber",
  in_transit: "blue",
  delivered: "green",
  cancelled: "neutral",
};

const INVOICE_TONES: Record<InvoiceStatus, BadgeTone> = {
  draft: "neutral",
  sent: "blue",
  paid: "green",
  overdue: "red",
};

const VEHICLE_TONES: Record<VehicleStatus, BadgeTone> = {
  active: "green",
  maintenance: "amber",
  retired: "neutral",
};

export function ShipmentStatusBadge({ status, label }: { status: ShipmentStatus; label: string }) {
  return <Badge tone={SHIPMENT_TONES[status]}>{label}</Badge>;
}

export function InvoiceStatusBadge({ status, label }: { status: InvoiceStatus; label: string }) {
  return <Badge tone={INVOICE_TONES[status]}>{label}</Badge>;
}

export function VehicleStatusBadge({ status, label }: { status: VehicleStatus; label: string }) {
  return <Badge tone={VEHICLE_TONES[status]}>{label}</Badge>;
}

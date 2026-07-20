import Link from "next/link";
import { MapPin, Package } from "lucide-react";
import { requireRole } from "@/lib/auth/require";
import { listShipmentsForDriver } from "@/lib/queries/shipments";
import { itemsByShipmentId } from "@/lib/queries/stock";
import { getT } from "@/lib/i18n/locale";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipmentStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MarkReceived } from "@/components/mark-received";
import { StatusButtons } from "./status-buttons";

export default async function DriverTripsPage() {
  const user = await requireRole("driver", "owner");
  const t = getT();
  const trips = await listShipmentsForDriver(user.id);
  const itemsMap = await itemsByShipmentId(trips.map((trip) => trip.shipment.id));

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title={t.driver.title} />
      {trips.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted">{t.driver.noTrips}</CardContent>
        </Card>
      )}
      <div className="space-y-4">
        {trips.map(({ shipment: s, customerName, plateNumber }) => (
          <Card key={s.id}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-accent" />
                  {s.origin} → {s.destination}
                </CardTitle>
                <p className="mt-1 text-sm text-muted">
                  {customerName} · {formatDate(s.createdAt)}
                </p>
              </div>
              <ShipmentStatusBadge status={s.status} label={t.shipments.statuses[s.status]} />
            </CardHeader>
            <CardContent className="space-y-4">
              {(itemsMap.get(s.id) ?? []).length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  <ul className="space-y-0.5 text-muted">
                    {(itemsMap.get(s.id) ?? []).map((line) => (
                      <li key={line.id}>
                        {line.name} × {line.quantity.toLocaleString("en-US")} {line.unit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-sm text-muted">
                {t.driver.myVehicle}: <span className="font-mono text-foreground">{plateNumber ?? "—"}</span>
              </div>
              <StatusButtons
                shipmentId={s.id}
                status={s.status}
                labels={{
                  markInTransit: t.shipments.markInTransit,
                  markDelivered: t.shipments.markDelivered,
                }}
              />
              {s.status !== "cancelled" &&
                (s.receivedAt ? (
                  <div className="flex items-center gap-2">
                    <Badge tone="green">{t.shipments.received}</Badge>
                    <span className="text-xs text-muted">
                      {t.shipments.receivedByOn} {s.receivedBy} · {formatDate(s.receivedAt)}
                    </span>
                  </div>
                ) : (
                  s.status === "delivered" && (
                    <MarkReceived
                      shipmentId={s.id}
                      size="lg"
                      className="w-full"
                      labels={{
                        markReceived: t.shipments.markReceived,
                        receiverName: t.shipments.receiverName,
                        save: t.common.save,
                      }}
                    />
                  )
                ))}
              {s.status !== "cancelled" && (
                <Link
                  href={`/driver/expenses?shipment=${s.id}`}
                  className={buttonVariants({ variant: "ghost", size: "sm" }) + " w-full"}
                >
                  {t.driver.addExpense}
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Boxes, Truck } from "lucide-react";
import { requireRole } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { listCustody, listItemStock } from "@/lib/queries/stock";
import { itemOptions } from "@/lib/queries/options";
import { getT } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { StockMovementForm } from "./stock-movement-form";

export default async function StockPage() {
  const user = await requireRole("owner", "dispatcher", "accountant");
  const t = getT();
  const canWrite = can(user.role, "stock.write");

  const [stockRows, custodyRows, itemOpts] = await Promise.all([
    listItemStock(),
    listCustody(),
    itemOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.stock.title}
        action={
          <Link href="/items" className={buttonVariants({ variant: "secondary" })}>
            {t.nav.items}
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t.stock.item}</TH>
                <TH>{t.stock.unit}</TH>
                <TH className="text-right">{t.stock.depotStock}</TH>
                <TH className="text-right">{t.stock.inTransit}</TH>
                <TH className="text-right">{t.stock.delivered}</TH>
              </TR>
            </THead>
            <TBody>
              {stockRows.length === 0 && (
                <TR>
                  <TD colSpan={5}>
                    <EmptyState icon={Boxes} message={t.common.noResults} />
                  </TD>
                </TR>
              )}
              {stockRows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-medium">{r.name}</TD>
                  <TD className="text-muted">{r.unit}</TD>
                  <TD
                    className={`text-right font-mono font-semibold ${
                      r.depotStock < 0 ? "text-danger" : "text-accent"
                    }`}
                  >
                    {r.depotStock.toLocaleString("en-US")}
                  </TD>
                  <TD className="text-right font-mono">{r.inTransit.toLocaleString("en-US")}</TD>
                  <TD className="text-right font-mono text-muted">
                    {r.delivered.toLocaleString("en-US")}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {canWrite && itemOpts.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <StockMovementForm
            items={itemOpts}
            kind="receive"
            labels={{
              title: t.stock.receiveStock,
              item: t.stock.item,
              quantity: t.stock.quantity,
              note: t.stock.note,
              save: t.common.save,
              required: t.common.required,
            }}
          />
          <StockMovementForm
            items={itemOpts}
            kind="adjust"
            labels={{
              title: t.stock.adjustStock,
              item: t.stock.item,
              quantity: t.stock.quantity,
              note: t.stock.note,
              save: t.common.save,
              required: t.common.required,
            }}
          />
        </div>
      )}

      {canWrite && itemOpts.length === 0 && (
        <Card>
          <CardContent className="p-5 text-sm text-muted">
            <Link href="/items/new" className="text-accent hover:underline">
              {t.items.new}
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.stock.custodyTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {custodyRows.length === 0 ? (
            <EmptyState icon={Truck} message={t.stock.custodyEmpty} />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t.stock.item}</TH>
                  <TH className="text-right">{t.stock.quantity}</TH>
                  <TH>{t.shipments.vehicle}</TH>
                  <TH>{t.shipments.driver}</TH>
                  <TH>{t.stock.trip}</TH>
                </TR>
              </THead>
              <TBody>
                {custodyRows.map((c) => (
                  <TR key={`${c.shipmentId}-${c.itemId}`}>
                    <TD>{c.itemName}</TD>
                    <TD className="text-right font-mono">
                      {c.quantity.toLocaleString("en-US")} {c.unit}
                    </TD>
                    <TD className="font-mono text-muted">{c.plateNumber ?? "—"}</TD>
                    <TD className="text-muted">{c.driverName ?? "—"}</TD>
                    <TD>
                      <Link href={`/shipments/${c.shipmentId}`} className="text-accent hover:underline">
                        {c.origin} → {c.destination}
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

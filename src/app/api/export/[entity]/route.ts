import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { customers, expenses, invoices, payments, profiles, shipments, vehicles } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/authz";
import { itemsByShipmentId } from "@/lib/queries/stock";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

async function exportExpenses(): Promise<{ headers: string[]; rows: unknown[][] }> {
  const data = await db
    .select({
      date: expenses.createdAt,
      vehicle: vehicles.plateNumber,
      category: expenses.category,
      amount: expenses.amount,
      description: expenses.description,
      recordedBy: profiles.fullName,
    })
    .from(expenses)
    .innerJoin(vehicles, eq(expenses.vehicleId, vehicles.id))
    .innerJoin(profiles, eq(expenses.recordedBy, profiles.id))
    .orderBy(desc(expenses.createdAt));
  return {
    headers: ["date", "vehicle", "category", "amount_tzs", "description", "recorded_by"],
    rows: data.map((r) => [r.date, r.vehicle, r.category, r.amount, r.description, r.recordedBy]),
  };
}

async function exportInvoices(): Promise<{ headers: string[]; rows: unknown[][] }> {
  const data = await db
    .select({
      number: invoices.invoiceNumber,
      customer: customers.name,
      amount: invoices.amount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .orderBy(desc(invoices.createdAt));
  return {
    headers: ["invoice_number", "customer", "amount_tzs", "status", "due_date", "created_at"],
    rows: data.map((r) => [r.number, r.customer, r.amount, r.status, r.dueDate, r.createdAt]),
  };
}

async function exportPayments(): Promise<{ headers: string[]; rows: unknown[][] }> {
  const data = await db
    .select({
      paidAt: payments.paidAt,
      invoice: invoices.invoiceNumber,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      recordedBy: profiles.fullName,
    })
    .from(payments)
    .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
    .innerJoin(profiles, eq(payments.recordedBy, profiles.id))
    .orderBy(desc(payments.paidAt));
  return {
    headers: ["paid_at", "invoice_number", "amount_tzs", "method", "reference", "recorded_by"],
    rows: data.map((r) => [r.paidAt, r.invoice, r.amount, r.method, r.reference, r.recordedBy]),
  };
}

async function exportShipments(): Promise<{ headers: string[]; rows: unknown[][] }> {
  const data = await db
    .select({
      id: shipments.id,
      createdAt: shipments.createdAt,
      customer: customers.name,
      origin: shipments.origin,
      destination: shipments.destination,
      vehicle: vehicles.plateNumber,
      status: shipments.status,
      price: shipments.price,
      distanceKm: shipments.distanceKm,
      deliveredAt: shipments.deliveredAt,
    })
    .from(shipments)
    .innerJoin(customers, eq(shipments.customerId, customers.id))
    .leftJoin(vehicles, eq(shipments.vehicleId, vehicles.id))
    .orderBy(desc(shipments.createdAt));
  const itemsMap = await itemsByShipmentId(data.map((r) => r.id));
  return {
    headers: [
      "created_at",
      "customer",
      "origin",
      "destination",
      "goods",
      "vehicle",
      "status",
      "price_tzs",
      "distance_km",
      "delivered_at",
    ],
    rows: data.map((r) => [
      r.createdAt,
      r.customer,
      r.origin,
      r.destination,
      (itemsMap.get(r.id) ?? [])
        .map((line) => `${line.name} (${line.quantity.toLocaleString("en-US")} ${line.unit})`)
        .join("; "),
      r.vehicle,
      r.status,
      r.price,
      r.distanceKm,
      r.deliveredAt,
    ]),
  };
}

const EXPORTERS = {
  expenses: exportExpenses,
  invoices: exportInvoices,
  payments: exportPayments,
  shipments: exportShipments,
} as const;

export async function GET(_request: Request, { params }: { params: { entity: string } }) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "export.csv")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const exporter = EXPORTERS[params.entity as keyof typeof EXPORTERS];
  if (!exporter) return NextResponse.json({ error: "unknown export" }, { status: 404 });

  const { headers, rows } = await exporter();
  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.entity}-${today}.csv"`,
    },
  });
}

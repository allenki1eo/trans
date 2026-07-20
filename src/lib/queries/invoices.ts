import "server-only";
import { and, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { customers, invoices, payments, INVOICE_STATUSES, type Invoice, type InvoiceStatus } from "@/lib/db/schema";

export type InvoiceRow = {
  invoice: Invoice;
  customerName: string;
  paid: number;
  balance: number;
  effectiveStatus: InvoiceStatus;
  percentPaid: number;
};

function deriveRow(invoice: Invoice, customerName: string, paid: number): InvoiceRow {
  const balance = invoice.amount - paid;
  const overdue = invoice.status !== "paid" && invoice.dueDate !== null && invoice.dueDate < new Date();
  return {
    invoice,
    customerName,
    paid,
    balance,
    effectiveStatus: overdue ? "overdue" : invoice.status,
    percentPaid: invoice.amount > 0 ? Math.min(100, Math.round((paid / invoice.amount) * 100)) : 0,
  };
}

export type InvoiceFilters = { status?: string; q?: string };

export async function listInvoices(filters: InvoiceFilters = {}): Promise<InvoiceRow[]> {
  const conds: SQL[] = [];
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    const search = or(like(invoices.invoiceNumber, term), like(customers.name, term));
    if (search) conds.push(search);
  }

  const [rows, paidByInvoice] = await Promise.all([
    db
      .select({ invoice: invoices, customerName: customers.name })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(invoices.createdAt)),
    db
      .select({ invoiceId: payments.invoiceId, total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .groupBy(payments.invoiceId),
  ]);
  const paidMap = new Map(paidByInvoice.map((p) => [p.invoiceId, p.total]));

  const derived = rows.map((r) => deriveRow(r.invoice, r.customerName, paidMap.get(r.invoice.id) ?? 0));

  if (filters.status && INVOICE_STATUSES.includes(filters.status as InvoiceStatus)) {
    return derived.filter((r) => r.effectiveStatus === filters.status);
  }
  return derived;
}

export type InvoiceSummary = {
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  paidAllTime: number;
};

export async function invoiceSummary(): Promise<InvoiceSummary> {
  // Two flat queries + a JS merge — a correlated subquery here would need a
  // second joined table for Drizzle to qualify `invoices.id`; without one it
  // silently resolves against payments' own id and always returns 0.
  const [allInvoices, paidByInvoice] = await Promise.all([
    db.select({ id: invoices.id, amount: invoices.amount, status: invoices.status, dueDate: invoices.dueDate }).from(invoices),
    db
      .select({ invoiceId: payments.invoiceId, total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .groupBy(payments.invoiceId),
  ]);
  const paidMap = new Map(paidByInvoice.map((p) => [p.invoiceId, p.total]));

  let outstanding = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let paidAllTime = 0;

  for (const invoice of allInvoices) {
    const paid = paidMap.get(invoice.id) ?? 0;
    paidAllTime += paid;
    if (invoice.status === "paid") continue;
    const balance = invoice.amount - paid;
    outstanding += balance;
    const overdue = invoice.dueDate !== null && invoice.dueDate < new Date();
    if (overdue) {
      overdueAmount += balance;
      overdueCount += 1;
    }
  }

  return { outstanding, overdueAmount, overdueCount, paidAllTime };
}

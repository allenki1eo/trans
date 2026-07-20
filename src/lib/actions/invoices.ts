"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { invoices, payments, shipments } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require";
import { can } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { invoiceSchema, paymentSchema, type InvoiceInput, type PaymentInput } from "@/lib/validation";

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} like ${prefix + "%"}`);
  return `${prefix}${String((row?.count ?? 0) + 1).padStart(4, "0")}`;
}

export async function createInvoice(input: InvoiceInput) {
  const user = await requireUser();
  if (!can(user.role, "invoices.create")) return { ok: false as const, error: "forbidden" };

  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;

  const shipment = await db.query.shipments.findFirst({
    where: eq(shipments.id, data.shipmentId),
  });
  if (!shipment) return { ok: false as const, error: "invalid" };

  const [created] = await db
    .insert(invoices)
    .values({
      customerId: shipment.customerId,
      shipmentId: shipment.id,
      invoiceNumber: await nextInvoiceNumber(),
      amount: data.amount,
      status: "draft",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    })
    .returning();
  await logAudit(user.id, "invoice.create", "invoice", created.id, {
    invoiceNumber: created.invoiceNumber,
    amount: created.amount,
  });

  revalidatePath("/invoices");
  return { ok: true as const, id: created.id };
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const user = await requireUser();
  if (!can(user.role, "invoices.update")) return { ok: false as const, error: "forbidden" };

  const parsed = invoiceSchema.shape.status.safeParse(status);
  if (!parsed.success) return { ok: false as const, error: "invalid" };

  const before = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) });
  await db.update(invoices).set({ status: parsed.data }).where(eq(invoices.id, invoiceId));
  await logAudit(user.id, "invoice.status", "invoice", invoiceId, {
    from: before?.status,
    to: parsed.data,
  });
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function recordPayment(input: PaymentInput) {
  const user = await requireUser();
  if (!can(user.role, "payments.create")) return { ok: false as const, error: "forbidden" };

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" };
  const data = parsed.data;

  const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, data.invoiceId) });
  if (!invoice) return { ok: false as const, error: "invalid" };

  // Record exactly what was actually paid — never let a payment push the
  // running total past the invoice amount (that would silently record more
  // than the customer paid, rather than the real received amount).
  const [existing] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.invoiceId, data.invoiceId));
  const alreadyPaid = existing?.total ?? 0;
  const remaining = invoice.amount - alreadyPaid;
  if (data.amount > remaining) {
    return { ok: false as const, error: "exceeds_balance" };
  }

  const [payment] = await db
    .insert(payments)
    .values({
      invoiceId: data.invoiceId,
      amount: data.amount,
      method: data.method,
      reference: data.reference || null,
      recordedBy: user.id,
    })
    .returning();
  await logAudit(user.id, "payment.create", "payment", payment.id, {
    invoiceNumber: invoice.invoiceNumber,
    amount: data.amount,
    method: data.method,
    reference: data.reference || undefined,
  });

  // Auto-mark paid once payments cover the invoice amount.
  if (alreadyPaid + data.amount >= invoice.amount) {
    await db.update(invoices).set({ status: "paid" }).where(eq(invoices.id, data.invoiceId));
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${data.invoiceId}`);
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteInvoice(id: string) {
  const user = await requireUser();
  if (!can(user.role, "invoices.update")) return { ok: false as const, error: "forbidden" };
  const deleted = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });
  await db.delete(payments).where(eq(payments.invoiceId, id));
  await db.delete(invoices).where(eq(invoices.id, id));
  if (deleted) {
    await logAudit(user.id, "invoice.delete", "invoice", id, {
      invoiceNumber: deleted.invoiceNumber,
      amount: deleted.amount,
    });
  }
  revalidatePath("/invoices");
  return { ok: true as const };
}

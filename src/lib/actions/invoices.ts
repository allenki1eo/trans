"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { invoices, payments, shipments } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/require";
import { can } from "@/lib/authz";
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

  revalidatePath("/invoices");
  redirect(`/invoices/${created.id}`);
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const user = await requireUser();
  if (!can(user.role, "invoices.update")) return { ok: false as const, error: "forbidden" };

  const parsed = invoiceSchema.shape.status.safeParse(status);
  if (!parsed.success) return { ok: false as const, error: "invalid" };

  await db.update(invoices).set({ status: parsed.data }).where(eq(invoices.id, invoiceId));
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

  await db.insert(payments).values({
    invoiceId: data.invoiceId,
    amount: data.amount,
    method: data.method,
    reference: data.reference || null,
    recordedBy: user.id,
  });

  // Auto-mark paid once payments cover the invoice amount.
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
    .from(payments)
    .where(eq(payments.invoiceId, data.invoiceId));
  if ((row?.total ?? 0) >= invoice.amount) {
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
  await db.delete(payments).where(eq(payments.invoiceId, id));
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/invoices");
  return { ok: true as const };
}

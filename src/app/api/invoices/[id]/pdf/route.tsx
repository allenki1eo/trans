import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db/client";
import { customers, invoices, payments, shipments } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/authz";
import { formatDate, formatTZS } from "@/lib/format";

export const dynamic = "force-dynamic";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "right" },
  section: { marginBottom: 20 },
  label: { fontSize: 9, color: "#777", marginBottom: 2, textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  bold: { fontFamily: "Helvetica-Bold" },
  totalAmount: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 40, left: 48, right: 48, fontSize: 9, color: "#999" },
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "invoices.read")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [row] = await db
    .select({
      invoice: invoices,
      customerName: customers.name,
      customerAddress: customers.address,
      customerPhone: customers.phone,
      origin: shipments.origin,
      destination: shipments.destination,
      goods: shipments.goodsDescription,
      weight: shipments.weightOrUnits,
    })
    .from(invoices)
    .innerJoin(customers, eq(invoices.customerId, customers.id))
    .innerJoin(shipments, eq(invoices.shipmentId, shipments.id))
    .where(eq(invoices.id, params.id));

  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  const paymentRows = await db.select().from(payments).where(eq(payments.invoiceId, row.invoice.id));
  const paid = paymentRows.reduce((sum, p) => sum + p.amount, 0);

  const pdf = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>TransTrack</Text>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text>{row.invoice.invoiceNumber}</Text>
          </View>
        </View>

        <View style={[styles.section, { flexDirection: "row", justifyContent: "space-between" }]}>
          <View>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.bold}>{row.customerName}</Text>
            {row.customerAddress ? <Text>{row.customerAddress}</Text> : null}
            {row.customerPhone ? <Text>{row.customerPhone}</Text> : null}
          </View>
          <View>
            <Text style={styles.label}>Issued</Text>
            <Text>{formatDate(row.invoice.createdAt)}</Text>
            <Text style={[styles.label, { marginTop: 6 }]}>Due</Text>
            <Text>{formatDate(row.invoice.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.bold}>Description</Text>
            <Text style={styles.bold}>Amount</Text>
          </View>
          <View style={styles.row}>
            <View>
              <Text>
                Transport: {row.origin} — {row.destination}
              </Text>
              <Text style={{ color: "#777" }}>
                {row.goods}
                {row.weight ? ` (${row.weight})` : ""}
              </Text>
            </View>
            <Text>{formatTZS(row.invoice.amount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.bold}>Total</Text>
            <Text style={styles.totalAmount}>{formatTZS(row.invoice.amount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Paid</Text>
            <Text>{formatTZS(paid)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.bold}>Balance due</Text>
            <Text style={styles.bold}>{formatTZS(row.invoice.amount - paid)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Payment via M-Pesa, cash or bank transfer. Quote invoice number {row.invoice.invoiceNumber} as reference.
        </Text>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(pdf);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${row.invoice.invoiceNumber}.pdf"`,
    },
  });
}

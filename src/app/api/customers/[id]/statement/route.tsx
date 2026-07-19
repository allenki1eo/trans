import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db/client";
import { customers, invoices, payments, shipments } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { can } from "@/lib/authz";
import { formatDate, formatTZS } from "@/lib/format";

export const dynamic = "force-dynamic";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right" },
  label: { fontSize: 9, color: "#777", marginBottom: 2, textTransform: "uppercase" },
  bold: { fontFamily: "Helvetica-Bold" },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  headRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  cNum: { width: "18%" },
  cRoute: { width: "26%" },
  cDue: { width: "14%" },
  cAmt: { width: "14%", textAlign: "right" },
  cPaid: { width: "14%", textAlign: "right" },
  cBal: { width: "14%", textAlign: "right" },
  totals: { marginTop: 14, alignItems: "flex-end" },
  totalLine: { flexDirection: "row", gap: 24, paddingVertical: 3 },
  dueBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#f4f0e6",
    borderRadius: 4,
  },
  footer: { position: "absolute", bottom: 40, left: 48, right: 48, fontSize: 9, color: "#999" },
});

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "invoices.read")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const customer = await db.query.customers.findFirst({ where: eq(customers.id, params.id) });
  if (!customer) return NextResponse.json({ error: "not found" }, { status: 404 });

  const rows = await db
    .select({
      invoice: invoices,
      origin: shipments.origin,
      destination: shipments.destination,
      paid: sql<number>`coalesce((select sum(${payments.amount}) from ${payments} where ${payments.invoiceId} = ${invoices.id}), 0)`,
    })
    .from(invoices)
    .innerJoin(shipments, eq(invoices.shipmentId, shipments.id))
    .where(eq(invoices.customerId, customer.id))
    .orderBy(desc(invoices.createdAt));

  const totalInvoiced = rows.reduce((sum, r) => sum + r.invoice.amount, 0);
  const totalPaid = rows.reduce((sum, r) => sum + r.paid, 0);
  const balance = totalInvoiced - totalPaid;

  const pdf = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>TransTrack</Text>
          <View>
            <Text style={styles.title}>CUSTOMER STATEMENT</Text>
            <Text style={{ textAlign: "right" }}>{formatDate(new Date())}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={styles.label}>Statement for</Text>
          <Text style={styles.bold}>{customer.name}</Text>
          {customer.address ? <Text>{customer.address}</Text> : null}
          {customer.phone ? <Text>{customer.phone}</Text> : null}
        </View>

        <View style={styles.headRow}>
          <Text style={[styles.cNum, styles.bold]}>Invoice</Text>
          <Text style={[styles.cRoute, styles.bold]}>Route</Text>
          <Text style={[styles.cDue, styles.bold]}>Due</Text>
          <Text style={[styles.cAmt, styles.bold]}>Amount</Text>
          <Text style={[styles.cPaid, styles.bold]}>Paid</Text>
          <Text style={[styles.cBal, styles.bold]}>Balance</Text>
        </View>
        {rows.length === 0 ? (
          <View style={styles.row}>
            <Text>No invoices yet.</Text>
          </View>
        ) : (
          rows.map(({ invoice: inv, origin, destination, paid }) => (
            <View key={inv.id} style={styles.row}>
              <Text style={styles.cNum}>{inv.invoiceNumber}</Text>
              <Text style={styles.cRoute}>
                {origin} — {destination}
              </Text>
              <Text style={styles.cDue}>{formatDate(inv.dueDate)}</Text>
              <Text style={styles.cAmt}>{formatTZS(inv.amount)}</Text>
              <Text style={styles.cPaid}>{formatTZS(paid)}</Text>
              <Text style={styles.cBal}>{formatTZS(inv.amount - paid)}</Text>
            </View>
          ))
        )}

        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text>Total invoiced</Text>
            <Text style={styles.bold}>{formatTZS(totalInvoiced)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text>Total paid</Text>
            <Text style={styles.bold}>{formatTZS(totalPaid)}</Text>
          </View>
          <View style={styles.dueBox}>
            <Text style={[styles.bold, { fontSize: 12 }]}>
              Balance due: {formatTZS(Math.max(balance, 0))}
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Payment via M-Pesa, cash or bank transfer. Quote the invoice number as reference.
        </Text>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(pdf);
  const safeName = customer.name.replace(/[^a-zA-Z0-9]+/g, "-");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="statement-${safeName}.pdf"`,
    },
  });
}

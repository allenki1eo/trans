import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ROLES = ["owner", "dispatcher", "driver", "accountant"] as const;
export type Role = (typeof ROLES)[number];

export const SHIPMENT_STATUSES = ["pending", "in_transit", "delivered", "cancelled"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const EXPENSE_CATEGORIES = ["fuel", "maintenance", "toll", "driver_pay", "other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ["mpesa", "cash", "bank"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const VEHICLE_STATUSES = ["active", "maintenance", "retired"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const profiles = sqliteTable("profiles", {
  id: id(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ROLES }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const vehicles = sqliteTable("vehicles", {
  id: id(),
  plateNumber: text("plate_number").notNull().unique(),
  makeModel: text("make_model").notNull(),
  capacity: text("capacity"),
  status: text("status", { enum: VEHICLE_STATUSES }).notNull().default("active"),
  createdAt: createdAt(),
});

export const customers = sqliteTable("customers", {
  id: id(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdAt: createdAt(),
});

export const shipments = sqliteTable(
  "shipments",
  {
    id: id(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    vehicleId: text("vehicle_id").references(() => vehicles.id),
    origin: text("origin").notNull(),
    destination: text("destination").notNull(),
    goodsDescription: text("goods_description").notNull(),
    weightOrUnits: text("weight_or_units"),
    status: text("status", { enum: SHIPMENT_STATUSES }).notNull().default("pending"),
    // All money is whole TZS — no fractional shillings in practice.
    price: real("price").notNull().default(0),
    createdBy: text("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: createdAt(),
    deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  },
  (t) => ({
    statusIdx: index("shipments_status_idx").on(t.status),
    customerIdx: index("shipments_customer_idx").on(t.customerId),
    vehicleIdx: index("shipments_vehicle_idx").on(t.vehicleId),
  })
);

// Driver ↔ vehicle ↔ trip is flexible per-trip (see CLAUDE.md open question #1).
// A "trip" is a shipment; if the client later fixes drivers to vehicles this
// collapses into a vehicle_id column on profiles.
export const tripAssignments = sqliteTable(
  "trip_assignments",
  {
    id: id(),
    shipmentId: text("shipment_id")
      .notNull()
      .references(() => shipments.id),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    driverId: text("driver_id")
      .notNull()
      .references(() => profiles.id),
    assignedAt: integer("assigned_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => ({
    driverIdx: index("trip_assignments_driver_idx").on(t.driverId),
    shipmentIdx: index("trip_assignments_shipment_idx").on(t.shipmentId),
  })
);

export const expenses = sqliteTable(
  "expenses",
  {
    id: id(),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    shipmentId: text("shipment_id").references(() => shipments.id),
    category: text("category", { enum: EXPENSE_CATEGORIES }).notNull(),
    amount: real("amount").notNull(),
    description: text("description"),
    recordedBy: text("recorded_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: createdAt(),
  },
  (t) => ({
    vehicleIdx: index("expenses_vehicle_idx").on(t.vehicleId),
    recordedByIdx: index("expenses_recorded_by_idx").on(t.recordedBy),
  })
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: id(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customers.id),
    shipmentId: text("shipment_id")
      .notNull()
      .references(() => shipments.id),
    invoiceNumber: text("invoice_number").notNull().unique(),
    amount: real("amount").notNull(),
    status: text("status", { enum: INVOICE_STATUSES }).notNull().default("draft"),
    dueDate: integer("due_date", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => ({
    statusIdx: index("invoices_status_idx").on(t.status),
    customerIdx: index("invoices_customer_idx").on(t.customerId),
  })
);

export const payments = sqliteTable(
  "payments",
  {
    id: id(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id),
    amount: real("amount").notNull(),
    method: text("method", { enum: PAYMENT_METHODS }).notNull(),
    reference: text("reference"),
    paidAt: integer("paid_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    recordedBy: text("recorded_by")
      .notNull()
      .references(() => profiles.id),
  },
  (t) => ({
    invoiceIdx: index("payments_invoice_idx").on(t.invoiceId),
  })
);

export type Profile = typeof profiles.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;
export type TripAssignment = typeof tripAssignments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Payment = typeof payments.$inferSelect;

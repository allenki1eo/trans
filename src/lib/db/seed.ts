import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import bcrypt from "bcryptjs";
import {
  customers,
  expenses,
  invoices,
  payments,
  profiles,
  shipments,
  tripAssignments,
  vehicles,
} from "./schema";

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  const db = drizzle(client);

  const password = await bcrypt.hash("password123", 10);

  const [owner] = await db
    .insert(profiles)
    .values({
      email: "owner@example.com",
      passwordHash: password,
      fullName: "Amani Mkuu",
      phone: "+255 700 000 001",
      role: "owner",
    })
    .returning();

  const [dispatcher] = await db
    .insert(profiles)
    .values({
      email: "dispatcher@example.com",
      passwordHash: password,
      fullName: "Neema Ofisi",
      phone: "+255 700 000 002",
      role: "dispatcher",
    })
    .returning();

  const [driver] = await db
    .insert(profiles)
    .values({
      email: "driver@example.com",
      passwordHash: password,
      fullName: "Juma Dereva",
      phone: "+255 700 000 003",
      role: "driver",
    })
    .returning();

  await db.insert(profiles).values({
    email: "accountant@example.com",
    passwordHash: password,
    fullName: "Zawadi Hesabu",
    phone: "+255 700 000 004",
    role: "accountant",
  });

  const [truck1, truck2] = await db
    .insert(vehicles)
    .values([
      { plateNumber: "T 123 ABC", makeModel: "FUSO Fighter", capacity: "10t" },
      { plateNumber: "T 456 DEF", makeModel: "Scania G460", capacity: "25t" },
    ])
    .returning();

  const [cust1, cust2] = await db
    .insert(customers)
    .values([
      {
        name: "Kilimanjaro Traders Ltd",
        phone: "+255 710 111 222",
        email: "orders@kilitraders.co.tz",
        address: "Moshi, Kilimanjaro",
      },
      {
        name: "Bahari Distributors",
        phone: "+255 720 333 444",
        email: "logistics@bahari.co.tz",
        address: "Dar es Salaam",
      },
    ])
    .returning();

  const [ship1, ship2] = await db
    .insert(shipments)
    .values([
      {
        customerId: cust1.id,
        vehicleId: truck1.id,
        origin: "Dar es Salaam",
        destination: "Moshi",
        goodsDescription: "Cement bags",
        weightOrUnits: "8t",
        status: "in_transit",
        price: 2_500_000,
        createdBy: dispatcher.id,
      },
      {
        customerId: cust2.id,
        vehicleId: truck2.id,
        origin: "Dar es Salaam",
        destination: "Mwanza",
        goodsDescription: "Bottled beverages",
        weightOrUnits: "20t",
        status: "delivered",
        price: 5_200_000,
        createdBy: dispatcher.id,
        deliveredAt: new Date(),
      },
    ])
    .returning();

  await db.insert(tripAssignments).values([
    { shipmentId: ship1.id, vehicleId: truck1.id, driverId: driver.id },
    { shipmentId: ship2.id, vehicleId: truck2.id, driverId: driver.id },
  ]);

  await db.insert(expenses).values([
    {
      vehicleId: truck1.id,
      shipmentId: ship1.id,
      category: "fuel",
      amount: 850_000,
      description: "Diesel, Dar depot",
      recordedBy: driver.id,
    },
    {
      vehicleId: truck2.id,
      shipmentId: ship2.id,
      category: "fuel",
      amount: 1_900_000,
      description: "Diesel round trip",
      recordedBy: driver.id,
    },
    {
      vehicleId: truck2.id,
      shipmentId: ship2.id,
      category: "driver_pay",
      amount: 400_000,
      description: "Trip allowance",
      recordedBy: owner.id,
    },
  ]);

  const [inv1] = await db
    .insert(invoices)
    .values([
      {
        customerId: cust2.id,
        shipmentId: ship2.id,
        invoiceNumber: "INV-2026-0001",
        amount: 5_200_000,
        status: "sent",
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      },
    ])
    .returning();

  await db.insert(payments).values({
    invoiceId: inv1.id,
    amount: 2_000_000,
    method: "mpesa",
    reference: "SFE8XK2QW1",
    recordedBy: owner.id,
  });

  console.log("Seeded demo data. Login with owner@example.com / password123 (same password for dispatcher@, driver@, accountant@).");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

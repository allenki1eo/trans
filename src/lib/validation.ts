import { z } from "zod";
import {
  EXPENSE_CATEGORIES,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
  ROLES,
  SHIPMENT_STATUSES,
  VEHICLE_STATUSES,
} from "@/lib/db/schema";

/** Shared between React Hook Form resolvers and server-action validation. */

export const customerSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
});

export const vehicleSchema = z.object({
  plateNumber: z.string().trim().min(1),
  makeModel: z.string().trim().min(1),
  capacity: z.string().trim().optional().or(z.literal("")),
  status: z.enum(VEHICLE_STATUSES),
});

export const shipmentSchema = z.object({
  customerId: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  origin: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  goodsDescription: z.string().trim().min(1),
  weightOrUnits: z.string().trim().optional().or(z.literal("")),
  price: z.coerce.number().min(0),
});

export const shipmentStatusSchema = z.object({
  shipmentId: z.string().min(1),
  status: z.enum(SHIPMENT_STATUSES),
});

export const expenseSchema = z.object({
  vehicleId: z.string().min(1),
  shipmentId: z.string().optional().or(z.literal("")),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive(),
  description: z.string().trim().optional().or(z.literal("")),
});

export const invoiceSchema = z.object({
  shipmentId: z.string().min(1),
  amount: z.coerce.number().positive(),
  dueDate: z.string().optional().or(z.literal("")),
  status: z.enum(INVOICE_STATUSES).default("draft"),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().trim().optional().or(z.literal("")),
});

export const userSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(1),
  phone: z.string().trim().optional().or(z.literal("")),
  role: z.enum(ROLES),
  password: z.string().min(8).optional().or(z.literal("")),
  active: z.coerce.boolean().default(true),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type ShipmentInput = z.infer<typeof shipmentSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type UserInput = z.infer<typeof userSchema>;

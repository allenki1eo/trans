"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { invoiceSchema, type InvoiceInput } from "@/lib/validation";
import { createInvoice } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ShipmentOption = { id: string; label: string; price: number };

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function InvoiceForm({
  shipments,
  labels,
}: {
  shipments: ShipmentOption[];
  labels: {
    shipment: string;
    amount: string;
    dueDate: string;
    save: string;
    cancel: string;
    required: string;
    dueDatePresets: string;
    days7: string;
    days14: string;
    days30: string;
  };
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { shipmentId: "", amount: 0, dueDate: "", status: "draft" },
  });

  const setDueInDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setValue("dueDate", toDateInputValue(d));
  };

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const result = await createInvoice(data);
        if (result.ok) router.push(`/invoices/${result.id}`);
      })}
      className="max-w-lg space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="shipmentId">{labels.shipment}</Label>
        <Select
          id="shipmentId"
          {...register("shipmentId", {
            onChange: (e) => {
              const s = shipments.find((x) => x.id === e.target.value);
              if (s) setValue("amount", s.price);
            },
          })}
        >
          <option value="">—</option>
          {shipments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
        {errors.shipmentId && <p className="text-xs text-danger">{labels.required}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="amount">{labels.amount} (TZS)</Label>
        <Input id="amount" type="number" min="0" step="1" className="font-mono" {...register("amount")} />
        {errors.amount && <p className="text-xs text-danger">{labels.required}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dueDate">{labels.dueDate}</Label>
        <Input id="dueDate" type="date" {...register("dueDate")} />
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-xs text-muted">{labels.dueDatePresets}:</span>
          <button type="button" onClick={() => setDueInDays(7)} className="text-xs text-accent hover:underline">
            {labels.days7}
          </button>
          <button type="button" onClick={() => setDueInDays(14)} className="text-xs text-accent hover:underline">
            {labels.days14}
          </button>
          <button type="button" onClick={() => setDueInDays(30)} className="text-xs text-accent hover:underline">
            {labels.days30}
          </button>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {labels.save}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {labels.cancel}
        </Button>
      </div>
    </form>
  );
}

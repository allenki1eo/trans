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

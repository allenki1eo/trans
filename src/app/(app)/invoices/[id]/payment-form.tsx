"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, type PaymentInput } from "@/lib/validation";
import { recordPayment } from "@/lib/actions/invoices";
import { PAYMENT_METHODS } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function PaymentForm({
  invoiceId,
  suggestedAmount,
  labels,
}: {
  invoiceId: string;
  suggestedAmount: number;
  labels: {
    recordPayment: string;
    amount: string;
    method: string;
    reference: string;
    save: string;
    required: string;
    methods: Record<(typeof PAYMENT_METHODS)[number], string>;
    payFullBalance: string;
  };
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { invoiceId, amount: suggestedAmount, method: "mpesa", reference: "" },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const result = await recordPayment(data);
        if (result.ok) reset({ invoiceId, amount: suggestedAmount, method: "mpesa", reference: "" });
      })}
      className="rounded-md border border-border bg-surface-raised/50 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{labels.recordPayment}</p>
        <button
          type="button"
          onClick={() => setValue("amount", suggestedAmount)}
          className="text-xs text-accent hover:underline"
        >
          {labels.payFullBalance} ({suggestedAmount.toLocaleString("en-US")})
        </button>
      </div>
      <input type="hidden" {...register("invoiceId")} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="pay-amount">{labels.amount} (TZS)</Label>
          <Input
            id="pay-amount"
            type="number"
            min="0"
            max={suggestedAmount}
            step="1"
            className="font-mono"
            {...register("amount")}
          />
          {errors.amount && <p className="text-xs text-danger">{labels.required}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pay-method">{labels.method}</Label>
          <Select id="pay-method" {...register("method")}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {labels.methods[m]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pay-reference">{labels.reference}</Label>
          <Input id="pay-reference" className="font-mono" {...register("reference")} />
        </div>
      </div>
      <Button type="submit" size="sm" className="mt-3" disabled={isSubmitting}>
        {labels.save}
      </Button>
    </form>
  );
}

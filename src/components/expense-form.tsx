"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { expenseSchema, type ExpenseInput } from "@/lib/validation";
import { createExpense } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORIES } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option = { id: string; label: string };

export type ExpenseFormLabels = {
  category: string;
  vehicle: string;
  shipment: string;
  amount: string;
  description: string;
  save: string;
  required: string;
  categories: Record<(typeof EXPENSE_CATEGORIES)[number], string>;
};

/**
 * Shared between the driver quick-add (mobile, big tap targets, category
 * presets as buttons) and the admin expense page.
 */
export function ExpenseForm({
  vehicles,
  shipments,
  defaults,
  labels,
  redirectTo,
  compact = false,
}: {
  vehicles: Option[];
  shipments: Option[];
  defaults?: Partial<ExpenseInput>;
  labels: ExpenseFormLabels;
  redirectTo: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vehicleId: vehicles.length === 1 ? vehicles[0].id : "",
      shipmentId: "",
      category: "fuel",
      amount: undefined as unknown as number,
      description: "",
      ...defaults,
    },
  });

  const category = watch("category");

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const result = await createExpense(data);
        if (result.ok) router.push(redirectTo);
      })}
      className={cn("space-y-4", compact ? "max-w-lg" : "max-w-xl")}
    >
      {/* Category presets — tap, don't type */}
      <div className="space-y-1.5">
        <Label>{labels.category}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue("category", c)}
              className={cn(
                "rounded-md border px-3 py-3 text-sm font-medium transition-colors",
                category === c
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-surface text-muted hover:text-foreground"
              )}
            >
              {labels.categories[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="vehicleId">{labels.vehicle}</Label>
        <Select id="vehicleId" {...register("vehicleId")}>
          <option value="">—</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </Select>
        {errors.vehicleId && <p className="text-xs text-danger">{labels.required}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shipmentId">{labels.shipment}</Label>
        <Select id="shipmentId" {...register("shipmentId")}>
          <option value="">—</option>
          {shipments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="amount">{labels.amount} (TZS)</Label>
        <Input
          id="amount"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          className="h-12 font-mono text-lg"
          {...register("amount")}
        />
        {errors.amount && <p className="text-xs text-danger">{labels.required}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{labels.description}</Label>
        <Input id="description" {...register("description")} />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
        {labels.save}
      </Button>
    </form>
  );
}

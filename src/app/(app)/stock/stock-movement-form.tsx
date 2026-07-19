"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stockMovementSchema, type StockMovementInput } from "@/lib/validation";
import { adjustStock, receiveStock } from "@/lib/actions/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ItemOption } from "@/lib/queries/options";

export function StockMovementForm({
  items,
  kind,
  labels,
}: {
  items: ItemOption[];
  kind: "receive" | "adjust";
  labels: { title: string; item: string; quantity: string; note: string; save: string; required: string };
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockMovementInput>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: { itemId: "", quantity: undefined as unknown as number, note: "" },
  });

  const action = kind === "receive" ? receiveStock : adjustStock;

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const result = await action(data);
        if (result.ok) reset();
      })}
      className="rounded-md border border-border bg-surface-raised/50 p-4"
    >
      <p className="mb-3 text-sm font-semibold">{labels.title}</p>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${kind}-item`}>{labels.item}</Label>
          <Select id={`${kind}-item`} {...register("itemId")}>
            <option value="">—</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.unit})
              </option>
            ))}
          </Select>
          {errors.itemId && <p className="text-xs text-danger">{labels.required}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${kind}-qty`}>{labels.quantity}</Label>
          <Input
            id={`${kind}-qty`}
            type="number"
            step="1"
            className="font-mono"
            {...register("quantity")}
          />
          {errors.quantity && <p className="text-xs text-danger">{labels.required}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${kind}-note`}>{labels.note}</Label>
          <Input id={`${kind}-note`} {...register("note")} />
        </div>
      </div>
      <Button type="submit" size="sm" className="mt-3" disabled={isSubmitting}>
        {labels.save}
      </Button>
    </form>
  );
}

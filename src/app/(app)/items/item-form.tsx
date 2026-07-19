"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { itemSchema, type ItemInput } from "@/lib/validation";
import { upsertItem } from "@/lib/actions/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Labels = {
  name: string;
  unit: string;
  unitHint: string;
  save: string;
  cancel: string;
  required: string;
};

export function ItemForm({
  id,
  defaults,
  labels,
}: {
  id: string | null;
  defaults?: Partial<ItemInput>;
  labels: Labels;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: "", unit: "", ...defaults },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const result = await upsertItem(id, data);
        if (result.ok) router.push("/items");
      })}
      className="max-w-lg space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">{labels.name}</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-danger">{labels.required}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="unit">{labels.unit}</Label>
        <Input id="unit" {...register("unit")} placeholder={labels.unitHint} />
        {errors.unit && <p className="text-xs text-danger">{labels.required}</p>}
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

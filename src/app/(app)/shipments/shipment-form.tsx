"use client";

import { useForm, useFieldArray, useWatch, type Control, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { shipmentSchema, type ShipmentInput } from "@/lib/validation";
import { upsertShipment } from "@/lib/actions/shipments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ItemWithStock } from "@/lib/queries/stock";

type Option = { id: string; label: string };

type Labels = {
  customer: string;
  vehicle: string;
  driver: string;
  origin: string;
  destination: string;
  goods: string;
  weight: string;
  price: string;
  distanceKm: string;
  save: string;
  cancel: string;
  required: string;
  itemsTitle: string;
  item: string;
  quantity: string;
  addLine: string;
  removeLine: string;
  available: string;
  exceedsStock: string;
};

function ItemLineRow({
  control,
  register,
  index,
  items,
  labels,
  onRemove,
}: {
  control: Control<ShipmentInput>;
  register: UseFormRegister<ShipmentInput>;
  index: number;
  items: ItemWithStock[];
  labels: Labels;
  onRemove: () => void;
}) {
  const line = useWatch({ control, name: `items.${index}` });
  const selected = items.find((i) => i.id === line?.itemId);
  const quantity = Number(line?.quantity) || 0;
  const exceeds = selected != null && quantity > selected.depotStock;

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Select {...register(`items.${index}.itemId` as const)}>
            <option value="">{labels.item}</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.unit}) · {labels.available}: {i.depotStock.toLocaleString("en-US")}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-28 space-y-1.5">
          <Input
            type="number"
            min="0"
            step="1"
            placeholder={labels.quantity}
            className={cn("font-mono", exceeds && "border-warning text-warning")}
            {...register(`items.${index}.quantity` as const)}
          />
        </div>
        <Button type="button" variant="ghost" size="sm" title={labels.removeLine} onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {selected && (
        <p className={cn("text-xs", exceeds ? "text-warning" : "text-muted")}>
          {exceeds
            ? `${labels.exceedsStock} (${selected.depotStock.toLocaleString("en-US")} ${selected.unit})`
            : `${labels.available}: ${selected.depotStock.toLocaleString("en-US")} ${selected.unit}`}
        </p>
      )}
    </div>
  );
}

export function ShipmentForm({
  id,
  defaults,
  customers,
  vehicles,
  drivers,
  items,
  labels,
}: {
  id: string | null;
  defaults?: Partial<ShipmentInput>;
  customers: Option[];
  vehicles: Option[];
  drivers: Option[];
  items: ItemWithStock[];
  labels: Labels;
}) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentInput>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      customerId: "",
      vehicleId: "",
      driverId: "",
      origin: "",
      destination: "",
      goodsDescription: "",
      weightOrUnits: "",
      price: 0,
      items: [],
      ...defaults,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const err = (field: keyof ShipmentInput) =>
    errors[field] && <p className="text-xs text-danger">{labels.required}</p>;

  const selectField = (
    field: "customerId" | "vehicleId" | "driverId",
    label: string,
    options: Option[]
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={field}>{label}</Label>
      <Select id={field} {...register(field)}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </Select>
      {err(field)}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        const result = await upsertShipment(id, data);
        if (result.ok) router.push("/shipments");
      })}
      className="max-w-2xl space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {selectField("customerId", labels.customer, customers)}
        {selectField("vehicleId", labels.vehicle, vehicles)}
        {selectField("driverId", labels.driver, drivers)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="origin">{labels.origin}</Label>
          <Input id="origin" {...register("origin")} />
          {err("origin")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="destination">{labels.destination}</Label>
          <Input id="destination" {...register("destination")} />
          {err("destination")}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="goodsDescription">{labels.goods}</Label>
        <Input id="goodsDescription" {...register("goodsDescription")} />
        {err("goodsDescription")}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="weightOrUnits">{labels.weight}</Label>
          <Input id="weightOrUnits" {...register("weightOrUnits")} placeholder="8t / 120 boxes" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">{labels.price} (TZS)</Label>
          <Input id="price" type="number" min="0" step="1" className="font-mono" {...register("price")} />
          {err("price")}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distanceKm">{labels.distanceKm}</Label>
          <Input id="distanceKm" type="number" min="0" step="1" className="font-mono" {...register("distanceKm")} />
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-3 rounded-md border border-border p-4">
          <Label>{labels.itemsTitle}</Label>
          {fields.map((field, index) => (
            <ItemLineRow
              key={field.id}
              control={control}
              register={register}
              index={index}
              items={items}
              labels={labels}
              onRemove={() => remove(index)}
            />
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ itemId: "", quantity: undefined as unknown as number })}
          >
            <Plus className="h-3.5 w-3.5" />
            {labels.addLine}
          </Button>
        </div>
      )}

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

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { shipmentSchema, type ShipmentInput } from "@/lib/validation";
import { upsertShipment } from "@/lib/actions/shipments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

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
};

export function ShipmentForm({
  id,
  defaults,
  customers,
  vehicles,
  drivers,
  labels,
}: {
  id: string | null;
  defaults?: Partial<ShipmentInput>;
  customers: Option[];
  vehicles: Option[];
  drivers: Option[];
  labels: Labels;
}) {
  const router = useRouter();
  const {
    register,
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
      ...defaults,
    },
  });

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
        await upsertShipment(id, data);
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

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { vehicleSchema, type VehicleInput } from "@/lib/validation";
import { upsertVehicle } from "@/lib/actions/vehicles";
import { VEHICLE_STATUSES } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Labels = {
  plate: string;
  makeModel: string;
  capacity: string;
  status: string;
  statuses: Record<(typeof VEHICLE_STATUSES)[number], string>;
  save: string;
  cancel: string;
  required: string;
};

export function VehicleForm({
  id,
  defaults,
  labels,
}: {
  id: string | null;
  defaults?: Partial<VehicleInput>;
  labels: Labels;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { plateNumber: "", makeModel: "", capacity: "", status: "active", ...defaults },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await upsertVehicle(id, data);
      })}
      className="max-w-lg space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="plateNumber">{labels.plate}</Label>
        <Input id="plateNumber" className="font-mono" {...register("plateNumber")} placeholder="T 123 ABC" />
        {errors.plateNumber && <p className="text-xs text-danger">{labels.required}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="makeModel">{labels.makeModel}</Label>
        <Input id="makeModel" {...register("makeModel")} />
        {errors.makeModel && <p className="text-xs text-danger">{labels.required}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="capacity">{labels.capacity}</Label>
        <Input id="capacity" {...register("capacity")} placeholder="10t" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">{labels.status}</Label>
        <Select id="status" {...register("status")}>
          {VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {labels.statuses[s]}
            </option>
          ))}
        </Select>
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

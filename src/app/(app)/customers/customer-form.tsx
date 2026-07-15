"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { customerSchema, type CustomerInput } from "@/lib/validation";
import { upsertCustomer } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Labels = {
  name: string;
  phone: string;
  email: string;
  address: string;
  save: string;
  cancel: string;
  required: string;
};

export function CustomerForm({
  id,
  defaults,
  labels,
}: {
  id: string | null;
  defaults?: Partial<CustomerInput>;
  labels: Labels;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", phone: "", email: "", address: "", ...defaults },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await upsertCustomer(id, data);
      })}
      className="max-w-lg space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">{labels.name}</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-danger">{labels.required}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">{labels.phone}</Label>
        <Input id="phone" {...register("phone")} placeholder="+255 …" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{labels.email}</Label>
        <Input id="email" type="email" {...register("email")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="address">{labels.address}</Label>
        <Input id="address" {...register("address")} />
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

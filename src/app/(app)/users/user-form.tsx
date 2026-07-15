"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { userSchema, type UserInput } from "@/lib/validation";
import { upsertUser } from "@/lib/actions/users";
import { ROLES } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Labels = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  passwordHint: string;
  roles: Record<(typeof ROLES)[number], string>;
  save: string;
  cancel: string;
  required: string;
};

export function UserForm({
  id,
  defaults,
  labels,
}: {
  id: string | null;
  defaults?: Partial<UserInput>;
  labels: Labels;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      fullName: "",
      phone: "",
      role: "dispatcher",
      password: "",
      active: true,
      ...defaults,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        await upsertUser(id, data);
      })}
      className="max-w-lg space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor="fullName">{labels.fullName}</Label>
        <Input id="fullName" {...register("fullName")} />
        {errors.fullName && <p className="text-xs text-danger">{labels.required}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{labels.email}</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-danger">{labels.required}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">{labels.phone}</Label>
        <Input id="phone" {...register("phone")} placeholder="+255 …" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="role">{labels.role}</Label>
        <Select id="role" {...register("role")}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {labels.roles[r]}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{labels.password}</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {id ? (
          <p className="text-xs text-muted">{labels.passwordHint}</p>
        ) : (
          errors.password && <p className="text-xs text-danger">{labels.required}</p>
        )}
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

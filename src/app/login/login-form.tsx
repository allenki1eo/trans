"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login, type ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function LoginForm({
  labels,
}: {
  labels: { email: string; password: string; login: string; invalidCredentials: string };
}) {
  const [state, formAction] = useFormState<ActionResult | null, FormData>(login, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{labels.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{labels.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state && !state.ok && <p className="text-sm text-danger">{labels.invalidCredentials}</p>}
      <SubmitButton label={labels.login} />
    </form>
  );
}

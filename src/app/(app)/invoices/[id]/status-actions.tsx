"use client";

import { useTransition } from "react";
import { updateInvoiceStatus } from "@/lib/actions/invoices";
import { Button } from "@/components/ui/button";
import type { InvoiceStatus } from "@/lib/db/schema";

export function InvoiceStatusActions({
  invoiceId,
  status,
  labels,
}: {
  invoiceId: string;
  status: InvoiceStatus;
  labels: { markSent: string; markPaid: string };
}) {
  const [pending, startTransition] = useTransition();
  const update = (next: InvoiceStatus) =>
    startTransition(async () => {
      await updateInvoiceStatus(invoiceId, next);
    });

  if (status === "paid") return null;

  return (
    <div className="flex gap-2">
      {status === "draft" && (
        <Button variant="secondary" disabled={pending} onClick={() => update("sent")}>
          {labels.markSent}
        </Button>
      )}
      <Button disabled={pending} onClick={() => update("paid")}>
        {labels.markPaid}
      </Button>
    </div>
  );
}

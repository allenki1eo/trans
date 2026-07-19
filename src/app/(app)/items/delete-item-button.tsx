"use client";

import { deleteItem } from "@/lib/actions/items";
import { DeleteButton } from "@/components/delete-button";

export function DeleteItemButton({
  itemId,
  confirmMessage,
  label,
  inUseMessage,
}: {
  itemId: string;
  confirmMessage: string;
  label: string;
  inUseMessage: string;
}) {
  return (
    <DeleteButton
      onDelete={deleteItem.bind(null, itemId)}
      confirmMessage={confirmMessage}
      label={label}
      onError={(error) => {
        if (error === "in_use") window.alert(inUseMessage);
      }}
    />
  );
}

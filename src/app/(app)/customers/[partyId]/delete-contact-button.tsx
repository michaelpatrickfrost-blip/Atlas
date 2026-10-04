"use client";

import { Button } from "@/components/ui/button";
import { deleteContactFormAction } from "@/app/(app)/customers/[partyId]/actions";

export function DeleteContactButton({ contactId, partyId, contactName }: { contactId: string; partyId: string; contactName: string }) {
  return (
    <Button
      variant="ghost"
      className="text-[var(--color-status-danger)]"
      onClick={() => {
        if (window.confirm(`Delete ${contactName}? This cannot be undone.`)) {
          void deleteContactFormAction(contactId, partyId);
        }
      }}
    >
      Delete
    </Button>
  );
}

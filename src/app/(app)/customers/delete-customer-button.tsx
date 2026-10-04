'use client';

import { Button } from '@/components/ui/button';
import { deleteCustomerFormAction } from '@/app/(app)/customers/[partyId]/actions';

export function DeleteCustomerButton({
  partyId,
  customerName,
  disabled = false,
}: {
  partyId: string;
  customerName: string;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="danger"
      onClick={() => {
        if (
          window.confirm(
            `Delete ${customerName}? This will mark them as closed and cannot be undone.`
          )
        ) {
          void deleteCustomerFormAction(partyId);
        }
      }}
      disabled={disabled}
    >
      Delete Customer
    </Button>
  );
}

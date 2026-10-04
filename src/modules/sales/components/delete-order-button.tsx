'use client';

import { Button } from '@/components/ui/button';
import { deleteOrderForm } from '@/app/(app)/sales/orders/actions';

export function DeleteOrderButton({ orderId, orderReference }: { orderId: string; orderReference: string }) {
  return (
    <Button
      variant="danger"
      onClick={() => {
        if (window.confirm(`Delete ${orderReference}? This cannot be undone. Only draft orders can be deleted.`)) {
          void deleteOrderForm(orderId);
        }
      }}
    >
      Delete
    </Button>
  );
}

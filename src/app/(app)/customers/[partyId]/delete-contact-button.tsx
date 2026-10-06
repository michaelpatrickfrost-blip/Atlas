'use client';

import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { deleteContactFormAction } from '@/app/(app)/customers/[partyId]/actions';

export function DeleteContactButton({ contactId, partyId, contactName }: { contactId: string; partyId: string; contactName: string }) {
  return (
    <ConfirmationDialog
      title="Delete Contact"
      message={`Delete ${contactName}? If linked records prevent removal, the contact will be marked inactive instead.`}
      confirmLabel="Delete"
      confirmVariant="danger"
      onConfirm={async () => { await deleteContactFormAction(contactId, partyId); }}
      trigger={(openDialog) => (
        <button
          type="button"
          onClick={openDialog}
          className="text-xs text-[var(--color-status-danger)] hover:underline"
        >
          Delete
        </button>
      )}
    />
  );
}

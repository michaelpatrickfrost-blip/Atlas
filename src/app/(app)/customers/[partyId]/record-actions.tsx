"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { archiveCustomerFormAction, unarchiveCustomerFormAction, deleteCustomerFormAction } from "@/app/(app)/customers/[partyId]/actions";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { useOnClickOutside } from "@/components/hooks/use-on-click-outside";

export function CustomerRecordActions({
  partyId,
  customerName,
  archived = false,
}: {
  partyId: string;
  customerName: string;
  archived?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-atlas-blue)] hover:text-[var(--color-atlas-blue)]"
      >
        Manage Record
        <ChevronDown size={14} strokeWidth={2} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-[var(--color-border)] bg-white p-1.5 shadow-lg">
          {archived ? (
            <ConfirmationDialog
              title="Unarchive Customer"
              message={`Restore ${customerName} to active lists?`}
              confirmLabel="Restore"
              confirmVariant="primary"
              onConfirm={async () => { await archiveCustomerFormAction(partyId); }}
              trigger={(openDialog) => (
                <div
                  role="menuitem"
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04] hover:text-[var(--color-ink)] cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    openDialog();
                  }}
                >
                  Unarchive Customer
                </div>
              )}
            />
          ) : (
            <ConfirmationDialog
              title="Archive Customer"
              message={`Archive ${customerName}? They will be hidden from active lists but their history will be preserved.`}
              confirmLabel="Archive"
              confirmVariant="primary"
              onConfirm={async () => { await archiveCustomerFormAction(partyId); }}
              trigger={(openDialog) => (
                <div
                  role="menuitem"
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04] hover:text-[var(--color-ink)] cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    openDialog();
                  }}
                >
                  Archive Customer
                </div>
              )}
            />
          )}
          <ConfirmationDialog
            title="Delete Customer"
            message={`Delete ${customerName}? This will mark them as closed and cannot be undone.`}
            confirmLabel="Delete"
            confirmVariant="danger"
            onConfirm={async () => { await deleteCustomerFormAction(partyId); }}
            trigger={(openDialog) => (
              <div
                role="menuitem"
                className="block rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  openDialog();
                }}
              >
                Delete Customer
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}

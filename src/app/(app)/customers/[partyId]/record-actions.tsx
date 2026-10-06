"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { archiveCustomerFormAction, unarchiveCustomerFormAction, deleteCustomerFormAction } from "@/app/(app)/customers/[partyId]/actions";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { useOnClickOutside } from "@/components/hooks/use-on-click-outside";

type PendingAction = "archive" | "unarchive" | "delete" | null;

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
  const [pending, setPending] = useState<PendingAction>(null);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, open, () => setOpen(false));

  // The confirmation dialogs are rendered outside the menu. If they lived
  // inside `{open && ...}` the click that closes the menu would unmount them
  // before they could open, so the confirmation would never appear.
  const choose = (action: Exclude<PendingAction, null>) => {
    setOpen(false);
    setPending(action);
  };

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
            <button
              type="button"
              role="menuitem"
              className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04] hover:text-[var(--color-ink)]"
              onClick={() => choose("unarchive")}
            >
              Unarchive Customer
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--color-ink-muted)] hover:bg-black/[0.04] hover:text-[var(--color-ink)]"
              onClick={() => choose("archive")}
            >
              Archive Customer
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            onClick={() => choose("delete")}
          >
            Delete Customer
          </button>
        </div>
      )}

      <ConfirmationDialog
        open={pending === "unarchive"}
        onOpenChange={(next) => { if (!next) setPending(null); }}
        title="Unarchive Customer"
        message={`Restore ${customerName} to active lists?`}
        confirmLabel="Restore"
        confirmVariant="primary"
        onConfirm={async () => { await unarchiveCustomerFormAction(partyId); }}
      />
      <ConfirmationDialog
        open={pending === "archive"}
        onOpenChange={(next) => { if (!next) setPending(null); }}
        title="Archive Customer"
        message={`Archive ${customerName}? They will be hidden from active lists but their history will be preserved.`}
        confirmLabel="Archive"
        confirmVariant="primary"
        onConfirm={async () => { await archiveCustomerFormAction(partyId); }}
      />
      <ConfirmationDialog
        open={pending === "delete"}
        onOpenChange={(next) => { if (!next) setPending(null); }}
        title="Delete Customer"
        message={`Delete ${customerName}? Accounts with linked history will be marked as closed instead of removed.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={async () => { await deleteCustomerFormAction(partyId); }}
      />
    </div>
  );
}

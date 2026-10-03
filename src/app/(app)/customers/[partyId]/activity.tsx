import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";
import type { getCustomer } from "@/core/customers/queries";
import type { getCustomerActivity } from "@/core/activity/log";
import { createNoteFormAction } from "@/app/(app)/customers/[partyId]/actions";

type Customer = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
type ActivityEntry = Awaited<ReturnType<typeof getCustomerActivity>>[number];

function formatDate(date: Date): string {
  return date.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Unified timeline — Core only renders what it's given (activity rows already
 *  filtered to this customer at the query level) plus notes. It never knows
 *  which module produced a given activity type beyond the label text already
 *  written at source (§29). Restricted notes are filtered server-side before
 *  this component ever sees them. */
export function CustomerActivity({ customer, activity, session }: { customer: Customer; activity: ActivityEntry[]; session: Session }) {
  const canSeeRestricted = can(session, CUSTOMER_CAPABILITIES.restrictedNotesRead);
  const canManageRestricted = can(session, CUSTOMER_CAPABILITIES.restrictedNotesManage);
  const visibleNotes = customer.notes.filter((note) => !note.restricted || canSeeRestricted);

  return (
    <div className="flex flex-col gap-8">
      {visibleNotes.some((note) => note.pinned) && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Pinned notes</h2>
          <div className="flex flex-col gap-2">
            {visibleNotes
              .filter((note) => note.pinned)
              .map((note) => (
                <Card key={note.id} className="flex items-start justify-between gap-3 p-4">
                  <p className="text-sm text-[var(--color-ink)]">{note.body}</p>
                  {note.restricted && <StatusPill label="Restricted" tone="warning" />}
                </Card>
              ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Add a note</h2>
        <form action={createNoteFormAction.bind(null, customer.id)} className="flex flex-col gap-2 rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <textarea name="body" required rows={2} placeholder="Note..." className="resize-none rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-atlas-blue)]" />
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm text-[var(--color-ink-muted)]">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" name="pinned" /> Pin
              </label>
              {canManageRestricted && (
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" name="restricted" /> Restricted
                </label>
              )}
            </div>
            <Button type="submit" variant="secondary">
              Add note
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--color-ink-muted)]">Timeline</h2>
        {activity.length === 0 && visibleNotes.filter((note) => !note.pinned).length === 0 ? (
          <EmptyState title="No activity yet." description="Actions across Atlas that relate to this customer will appear here." />
        ) : (
          <div className="flex flex-col">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 border-b border-[var(--color-border)] py-3 text-sm last:border-0">
                <span className="w-32 shrink-0 text-[var(--color-ink-faint)]">{formatDate(entry.createdAt)}</span>
                <span className="text-[var(--color-ink)]">{entry.summary}</span>
              </div>
            ))}
            {visibleNotes
              .filter((note) => !note.pinned)
              .map((note) => (
                <div key={note.id} className="flex items-start gap-4 border-b border-[var(--color-border)] py-3 text-sm last:border-0">
                  <span className="w-32 shrink-0 text-[var(--color-ink-faint)]">{formatDate(note.createdAt)}</span>
                  <span className="text-[var(--color-ink)]">
                    {note.body}
                    {note.restricted && <StatusPill label="Restricted" tone="warning" />}
                  </span>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

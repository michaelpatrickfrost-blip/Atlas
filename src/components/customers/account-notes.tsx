import { StickyNote, Pin, LockKeyhole } from "lucide-react";
import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { createNoteFormAction } from "@/app/(app)/customers/[partyId]/actions";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";

type AccountNote = {
  id: string;
  body: string;
  pinned: boolean;
  restricted: boolean;
  createdAt: Date;
};
export function AccountNotes({
  partyId,
  notes,
  session,
  compact = false,
}: {
  partyId: string;
  notes: AccountNote[];
  session: Session;
  compact?: boolean;
}) {
  const restricted = can(session, CUSTOMER_CAPABILITIES.restrictedNotesManage);
  const visible = notes.filter(
    (note) =>
      !note.restricted ||
      can(session, CUSTOMER_CAPABILITIES.restrictedNotesRead),
  );
  const shown = compact ? visible.slice(0, 3) : visible;
  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      aria-label="Account notes"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 p-5">
        <span className="rounded-xl bg-blue-50 p-2 text-blue-600">
          <StickyNote size={18} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Account notes
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Shared with this customer record across Atlas.
          </p>
        </div>
        <span className="ml-auto text-xs text-slate-400">{visible.length}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {shown.map((note) => (
          <article key={note.id} className="p-5">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
              {note.pinned && (
                <span className="inline-flex items-center gap-1 text-blue-600">
                  <Pin size={12} />
                  Pinned
                </span>
              )}
              {note.restricted && (
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <LockKeyhole size={12} />
                  Restricted
                </span>
              )}
              <time dateTime={note.createdAt.toISOString()} className="ml-auto">
                {note.createdAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
              {note.body}
            </p>
          </article>
        ))}
        {!shown.length && (
          <p className="p-5 text-sm text-slate-500">
            Capture the context that helps your team: priorities, conversations
            and next steps.
          </p>
        )}
      </div>
      {(can(session, CUSTOMER_CAPABILITIES.edit) || restricted) && (
        <ActionForm
          action={createNoteFormAction.bind(null, partyId)}
          className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-5"
        >
          <label
            className="block text-xs font-medium text-slate-600"
            htmlFor={`note-${partyId}`}
          >
            Add an account note
          </label>
          <textarea
            id={`note-${partyId}`}
            name="body"
            required
            maxLength={10000}
            rows={3}
            placeholder="What should the team know?"
            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-4 text-xs text-slate-500">
              <label className="flex items-center gap-2">
                <input name="pinned" type="checkbox" />
                Pin note
              </label>
              {restricted && (
                <label className="flex items-center gap-2">
                  <input
                    name="restricted"
                    type="checkbox"
                    defaultChecked={!can(session, CUSTOMER_CAPABILITIES.edit)}
                  />
                  Restricted
                </label>
              )}
            </div>
            <Button type="submit" variant="secondary">
              Save note
            </Button>
          </div>
        </ActionForm>
      )}
    </section>
  );
}

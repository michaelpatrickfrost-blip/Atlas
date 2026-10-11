"use client";

import { useState, type ReactNode } from "react";

/** Save/CAS remain server-owned. Keep visible unsaved edits from being mistaken
 * for the saved draft that review/publication/restore actually operates on. */
export function SetupDraftGuard({ editor, controls }: { editor: ReactNode; controls: ReactNode }) {
  const [dirty, setDirty] = useState(false);
  return <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
    <div onChangeCapture={() => setDirty(true)}>{editor}</div>
    <div className="space-y-4">
      {dirty && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Save your changes before reviewing, going live or restoring a version.</p>}
      <fieldset disabled={dirty} className="contents"><legend className="sr-only">Saved setup review and published versions</legend>{controls}</fieldset>
    </div>
  </div>;
}

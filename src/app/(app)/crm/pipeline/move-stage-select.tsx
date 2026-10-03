"use client";

import { useTransition } from "react";
import { moveOpportunityStage } from "@/modules/crm/services/opportunities";

/** Click-to-move stage control — Pipeline isn't drag-and-drop in this slice
 *  (no DnD dependency added for it), but moving stage is still one click. */
export function MoveStageSelect({ opportunityId, stageId, stages }: { opportunityId: string; stageId: string; stages: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={stageId}
      disabled={pending}
      onChange={(event) => startTransition(() => moveOpportunityStage(opportunityId, event.target.value))}
      className="w-full rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-ink-muted)] outline-none focus:border-[var(--color-atlas-blue)]"
      onClick={(event) => event.stopPropagation()}
    >
      {stages.map((stage) => (
        <option key={stage.id} value={stage.id}>
          {stage.name}
        </option>
      ))}
    </select>
  );
}

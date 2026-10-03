"use client";

import { useTransition } from "react";
import { toggleMilestoneFormAction } from "@/app/(app)/crm/opportunities/[opportunityId]/actions";

export function MilestoneToggle({ milestoneId, opportunityId, done, disabled }: { milestoneId: string; opportunityId: string; done: boolean; disabled: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      checked={done}
      disabled={disabled || pending}
      onChange={(event) => startTransition(() => toggleMilestoneFormAction(milestoneId, opportunityId, event.target.checked))}
      className="size-4 shrink-0 accent-[var(--color-atlas-blue)]"
    />
  );
}

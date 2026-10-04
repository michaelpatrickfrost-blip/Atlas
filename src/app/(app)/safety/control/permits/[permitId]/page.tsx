import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { permitDetail } from "@/modules/safety/services/queries";
import { advancePermit, extendPermit } from "@/modules/safety/services/control";
import { Field, inputClass } from "../../../ui";

const NEXT: Record<string, string> = {
  REQUESTED: "RISK_REVIEWED",
  RISK_REVIEWED: "CONTROLS_CONFIRMED",
  CONTROLS_CONFIRMED: "AUTHORISED",
  ISOLATION_CONFIRMED: "AUTHORISED",
  AUTHORISED: "IN_PROGRESS",
  IN_PROGRESS: "WORK_COMPLETE",
  WORK_COMPLETE: "AREA_INSPECTED",
  AREA_INSPECTED: "HANDED_BACK",
  HANDED_BACK: "CLOSED",
  EXPIRED: "CLOSED",
};

export default async function PermitPage({ params }: { params: Promise<{ permitId: string }> }) {
  const session = await requireSession();
  const permit = await permitDetail(session.organisationId, (await params).permitId);
  if (!permit) notFound();
  const next = permit.shown === "CONTROLS_CONFIRMED" && permit.isolationRequired ? "ISOLATION_CONFIRMED" : NEXT[permit.shown];
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-[var(--color-ink-muted)]">{permit.reference} · {permit.kind.replaceAll("_", " ").toLowerCase()}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{permit.title}</h1>
        <p className={`mt-3 text-lg ${permit.shown === "EXPIRED" ? "text-rose-700" : "text-[var(--color-atlas-blue)]"}`}>{permit.shown.replaceAll("_", " ")}</p>
        {permit.expiresAt && <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Expires {permit.expiresAt.toLocaleString("en-GB")} · {permit.extensionCount} extension{permit.extensionCount === 1 ? "" : "s"}</p>}
      </header>
      <p className="max-w-xl text-sm leading-relaxed">{permit.description}</p>
      <p className="text-sm text-[var(--color-ink-muted)]">{permit.hazards}</p>
      {next && (can(session, C.permitIssue) || can(session, C.permitAuthorise) || can(session, C.permitClose) || can(session, C.permitRequest)) && (
        <ActionForm action={advancePermit}>
          <input type="hidden" name="permitId" value={permit.id} />
          <input type="hidden" name="to" value={next} />
          <Button type="submit" variant="primary">Move to {next.replaceAll("_", " ").toLowerCase()}</Button>
        </ActionForm>
      )}
      {can(session, C.permitAuthorise) && ["AUTHORISED", "IN_PROGRESS"].includes(permit.shown) && (
        <ActionForm action={extendPermit} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="permitId" value={permit.id} />
          <Field label="New expiry"><input type="datetime-local" name="expiresAt" required className={inputClass} /></Field>
          <Field label="Why"><input name="reason" required className={inputClass} /></Field>
          <Button type="submit">Extend</Button>
        </ActionForm>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { recordDetail } from "@/modules/safety/services/queries";
import { commitmentLabel } from "@/modules/safety/domain/work";

export default async function SafetyRecordPage({ params }: { params: Promise<{ recordId: string }> }) {
  const session = await requireSession();
  const record = await recordDetail(session, (await params).recordId);
  if (!record) notFound();
  const payload = record.payload as { detail?: string | null };
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-ink-muted)]">{record.reference} · {record.kind.replaceAll("_", " ").toLowerCase()}</p>
      <h1 className="text-4xl font-semibold tracking-tight">{record.title}</h1>
      <p className="text-sm">{commitmentLabel(record.commitment === "PENDING" ? "PENDING" : "COMMITTED")}</p>
      {payload.detail && <p className="max-w-xl text-sm leading-relaxed">{payload.detail}</p>}
      {record.kind === "ASBESTOS" && <p className="text-sm">{record.asbestosNote}</p>}
      {record.kind === "HEALTH_REQUIREMENT" && <p className="text-sm text-[var(--color-ink-muted)]">This records the surveillance requirement and the work-relevant outcome. It is not a clinical record.</p>}
      {record.kind === "PEEP" && <p className="text-sm text-[var(--color-ink-muted)]">Only the operational information needed for evacuation is kept here.</p>}
      {record.kind === "LONE_WORK" && <p className="text-sm text-[var(--color-ink-muted)]">Atlas can hold the assessment, the check-in and the escalation contact. It does not replace a monitored lone-worker service.</p>}
    </div>
  );
}

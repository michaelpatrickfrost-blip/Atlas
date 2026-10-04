import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { equipmentDetail } from "@/modules/safety/services/queries";
import { PUWER_CHECKS } from "@/modules/safety/domain/work";

export default async function EquipmentPage({ params }: { params: Promise<{ checkId: string }> }) {
  const session = await requireSession();
  const check = await equipmentDetail(session.organisationId, (await params).checkId);
  if (!check) notFound();
  const checklist = (check.checklist ?? {}) as Record<string, string>;
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-[var(--color-ink-muted)]">{check.reference} · {check.kind}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{check.assetLabel}</h1>
        <p className={`mt-3 text-lg font-medium ${check.overall === "UNSAFE_FOR_USE" || check.seriousDefect ? "text-rose-700" : "text-emerald-700"}`}>{check.overall?.replaceAll("_", " ") ?? check.status}</p>
      </header>
      {check.safeWorkingLoad && <p className="text-sm">Safe working load · {check.safeWorkingLoad}</p>}
      {check.defectSummary && <p className="text-sm">{check.defectSummary}</p>}
      <ul className="divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white text-sm">
        {PUWER_CHECKS.map(([key, label]) => <li key={key} className="flex justify-between px-5 py-3"><span>{label}</span><span>{checklist[key] ?? "—"}</span></li>)}
      </ul>
      <p className="text-sm text-[var(--color-ink-muted)]">{check.nextDueAt ? `Next examination ${check.nextDueAt.toLocaleDateString("en-GB")}` : "No next date"} · {check.examiner ?? "Examiner not recorded"}</p>
    </div>
  );
}

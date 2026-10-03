import Link from "next/link";
import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { calculateBradfordFactor } from "@/modules/people/domain/bradford-factor";
import { logAbsence } from "./actions";

const ABSENCE_TYPES = ["SICKNESS", "HOLIDAY", "UNPAID", "COMPASSIONATE", "MATERNITY_PATERNITY", "OTHER"];
const BAND_TONE: Record<string, StatusTone> = { none: "success", watch: "warning", concern: "warning", serious: "danger" };

export default async function AbsencePage({ searchParams }: { searchParams: Promise<{ employeeId?: string }> }) {
  const { employeeId } = await searchParams;
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.absenceRead);
  const manage = can(session, HR_CAPABILITIES.absenceManage);

  const employees = await db.employee.findMany({
    where: { organisationId: session.organisationId, status: { not: "LEFT" } },
    select: { id: true, firstName: true, lastName: true, absences: { select: { type: true, startDate: true, endDate: true } } },
    orderBy: { lastName: "asc" },
  });

  const bradfordRows = employees
    .map((e) => ({ ...e, bradford: calculateBradfordFactor(e.absences.filter((a) => a.type === "SICKNESS")) }))
    .sort((a, b) => b.bradford.score - a.bradford.score);

  const recentAbsences = await db.absenceRecord.findMany({
    where: { organisationId: session.organisationId },
    include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { startDate: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Absence &amp; Sickness</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">Bradford Factor is calculated live from sickness episodes in the last 12 months (S² × D).</p>
        </div>
        {manage && (
          <CreateDialog title="Log absence" label="Log absence">
            <ActionForm action={logAbsence} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">Employee
                <select name="employeeId" required defaultValue={employeeId ?? ""} className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                  <option value="">Choose employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </label>
              <label className="text-sm">Type
                <select name="type" required className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                  {ABSENCE_TYPES.map((t) => <option key={t} value={t}>{t.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="certifiedByDoctor" /> Doctor certified</label>
              <label className="text-sm">Start date<input type="date" name="startDate" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">End date<input type="date" name="endDate" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm sm:col-span-2">Reason<textarea name="reason" className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
              <Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">Log absence</Button>
            </ActionForm>
          </CreateDialog>
        )}
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Bradford Factor by employee</h3>
        <DataTable
          rows={bradfordRows}
          getHref={(e) => `/people/${e.id}`}
          emptyLabel="No active employees."
          columns={[
            { header: "Employee", render: (e) => <span className="font-medium">{e.firstName} {e.lastName}</span> },
            { header: "Episodes (12mo)", render: (e) => e.bradford.episodes, align: "right" },
            { header: "Days (12mo)", render: (e) => e.bradford.days, align: "right" },
            { header: "Score", render: (e) => e.bradford.score, align: "right" },
            { header: "Band", render: (e) => <StatusPill label={e.bradford.band === "none" ? "OK" : e.bradford.band} tone={BAND_TONE[e.bradford.band]} /> },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Recent absence records</h3>
        <DataTable
          rows={recentAbsences}
          emptyLabel="No absence logged yet."
          columns={[
            { header: "Employee", render: (a) => <Link href={`/people/${a.employee.id}`} className="font-medium text-[var(--color-atlas-blue)]">{a.employee.firstName} {a.employee.lastName}</Link> },
            { header: "Type", render: (a) => a.type.replaceAll("_", " ") },
            { header: "Dates", render: (a) => `${a.startDate.toLocaleDateString("en-GB")} – ${a.endDate.toLocaleDateString("en-GB")}` },
            { header: "Certified", render: (a) => (a.certifiedByDoctor ? "Yes" : "No") },
            { header: "Reason", render: (a) => a.reason ?? "—" },
          ]}
        />
      </section>
    </div>
  );
}

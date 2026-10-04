import Link from "next/link";
import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";
import { listPayrollRuns } from "@/modules/payroll/services/queries";
import { createPayrollRun } from "./actions";

const TONE: Record<string, StatusTone> = { DRAFT: "neutral", FINALISED: "warning", PAID: "success" };

export default async function PayrollPage() {
  const session = await requireSession();
  assertCapability(session, PAYROLL_CAPABILITIES.runRead);
  const manage = can(session, PAYROLL_CAPABILITIES.runManage);
  const runs = await listPayrollRuns(session);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Payroll</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">
            PAYE, National Insurance, pension and statutory pay are calculated from HMRC&rsquo;s published rates — this is calculation, not a submission to HMRC.
            <Link href="/payroll/settings" className="ml-1 text-[var(--color-atlas-blue)]">Payroll settings →</Link>
          </p>
        </div>
        {manage && (
          <CreateDialog title="Create payroll run" label="New payroll run">
            <ActionForm action={createPayrollRun} className="mt-5 grid gap-4">
              <label className="text-sm">Period label<input name="periodLabel" required maxLength={100} placeholder="October 2026" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Period start<input type="date" name="periodStart" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Period end<input type="date" name="periodEnd" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <Button type="submit" variant="primary" className="justify-self-start">Create run &amp; generate payslips</Button>
            </ActionForm>
          </CreateDialog>
        )}
      </div>

      <DataTable
        rows={runs}
        getHref={(r) => `/payroll/${r.id}`}
        emptyLabel="No payroll runs yet."
        columns={[
          { header: "Period", render: (r) => <span className="font-medium">{r.periodLabel}</span> },
          { header: "Payslips", render: (r) => r._count.payslips },
          { header: "Status", render: (r) => <StatusPill label={r.status} tone={TONE[r.status]} /> },
        ]}
      />
      <p className="text-xs text-[var(--color-ink-muted)]"><Link href="/people/absence" className="text-[var(--color-atlas-blue)]">Check absence and rotas</Link> before finalising — approved sickness, holiday and confirmed shifts all feed the run, but a late change still needs re-running.</p>
    </div>
  );
}

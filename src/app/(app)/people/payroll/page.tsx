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
import { createPayrollRun } from "./actions";

const TONE: Record<string, StatusTone> = { DRAFT: "neutral", FINALISED: "warning", PAID: "success" };

function formatMoney(minorUnits: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minorUnits / 100);
}

export default async function PayrollPage() {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.payrollRead);
  const manage = can(session, HR_CAPABILITIES.payrollManage);

  const runs = await db.payrollRun.findMany({
    where: { organisationId: session.organisationId },
    include: { payslips: true },
    orderBy: { periodStart: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Payroll</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">Monthly gross pay is drawn from each employee&rsquo;s annual salary. Add deductions per payslip before finalising a run.</p>
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
        getHref={(r) => `/people/payroll/${r.id}`}
        emptyLabel="No payroll runs yet."
        columns={[
          { header: "Period", render: (r) => <span className="font-medium">{r.periodLabel}</span> },
          { header: "Payslips", render: (r) => r.payslips.length },
          { header: "Net total", render: (r) => formatMoney(r.payslips.reduce((s, p) => s + p.netMinorUnits, 0)) },
          { header: "Status", render: (r) => <StatusPill label={r.status} tone={TONE[r.status]} /> },
        ]}
      />
      <p className="text-xs text-[var(--color-ink-muted)]"><Link href="/people/absence" className="text-[var(--color-atlas-blue)]">Check absence</Link> before finalising — unpaid leave isn&rsquo;t automatically deducted.</p>
    </div>
  );
}

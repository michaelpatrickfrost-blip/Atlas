import {WorkspaceStats} from "@/components/ui/people-workspace";
import Link from "next/link";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";
import { getPayrollRun } from "@/modules/payroll/services/queries";
import { updatePayslipDeductions, finalisePayrollRun, markPayrollRunPaid } from "../actions";

const TONE: Record<string, StatusTone> = { DRAFT: "neutral", FINALISED: "warning", PAID: "success" };

function formatMoney(minorUnits: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minorUnits / 100);
}

export default async function PayrollRunPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const session = await requireSession();
  assertCapability(session, PAYROLL_CAPABILITIES.runRead);
  const { run, manage } = await getPayrollRun(session, runId);
  const editable = manage && run.status === "DRAFT";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/payroll" className="text-xs text-[var(--color-atlas-blue)]">← All payroll runs</Link>
          <h2 className="text-lg font-semibold">{run.periodLabel}</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">{run.periodStart.toLocaleDateString("en-GB")} – {run.periodEnd.toLocaleDateString("en-GB")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill label={run.status} tone={TONE[run.status]} />
          {manage && run.status === "DRAFT" && <ActionForm action={finalisePayrollRun.bind(null, run.id)} className="flex flex-wrap items-center gap-3"><label className="flex items-start gap-2 text-xs"><input type="checkbox" name="reviewed" required/>I reviewed every payslip and the calculation scope.</label><Button type="submit" variant="primary">Finalise run</Button></ActionForm>}
          {manage && run.status === "FINALISED" && <form action={markPayrollRunPaid.bind(null, run.id)}><Button type="submit" variant="primary">Mark as paid</Button></form>}
        </div>
      </div>

      {editable&&<Link href={`/payroll/prepare?run=${run.id}`} className="inline-block rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">Review inputs & refresh draft →</Link>}
      <WorkspaceStats items={[{label:"Payslips",value:run.payslips.length},{label:"Approved actual hours",value:run.payslips.reduce((n,p)=>n+p.approvedHours,0).toFixed(1)},{label:"Net pay",value:formatMoney(run.payslips.reduce((n,p)=>n+p.netMinorUnits,0))},{label:"Employer NI + pension",value:formatMoney(run.payslips.reduce((n,p)=>n+p.employerNiMinorUnits+p.employerPensionMinorUnits,0))}]}/>
      <DataTable
        rows={run.payslips}
        emptyLabel="No employees were active for this period."
        columns={[
          { header: "Employee", render: (p) => <Link href={`/people/${p.employee.id}`} className="font-medium text-[var(--color-atlas-blue)]">{p.employee.firstName} {p.employee.lastName}</Link> },
          { header: "Approved time", render: (p) => `${p.approvedHours.toFixed(1)}h`, align: "right" },
          { header: "Gross", render: (p) => formatMoney(p.grossMinorUnits + p.overtimeMinorUnits + p.statutoryPayMinorUnits + p.additionalPayMinorUnits - p.unpaidLeaveDeductionMinorUnits, p.currency), align: "right" },
          { header: "Tax", render: (p) => formatMoney(p.taxMinorUnits, p.currency), align: "right" },
          { header: "NI", render: (p) => formatMoney(p.employeeNiMinorUnits, p.currency), align: "right" },
          { header: "Pension", render: (p) => formatMoney(p.employeePensionMinorUnits, p.currency), align: "right" },
          { header: "Student loan", render: (p) => formatMoney(p.studentLoanMinorUnits, p.currency), align: "right" },
          {
            header: "Other adjustment",
            align: "right",
            render: (p) =>
              editable ? (
                <ActionForm action={updatePayslipDeductions.bind(null, p.id)} className="flex items-center justify-end gap-2">
                  <input type="number" step="0.01" min="0" name="deductions" defaultValue={p.deductionsMinorUnits / 100} className="w-24 border border-[var(--color-border)] p-1 text-right text-xs" />
                  <Button type="submit" className="text-xs">Save</Button>
                </ActionForm>
              ) : (
                formatMoney(p.deductionsMinorUnits, p.currency)
              ),
          },
          { header: "Net", render: (p) => <span className="font-semibold">{formatMoney(p.netMinorUnits, p.currency)}</span>, align: "right" },
        ]}
      />
      <p className="text-xs text-[var(--color-ink-muted)]">Tax, NI and pension are calculated against HMRC&rsquo;s published rates for the organisation&rsquo;s current tax year. This is not a submission to HMRC.</p>
    </div>
  );
}

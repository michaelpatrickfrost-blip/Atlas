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
      <div className="flex items-center justify-between">
        <div>
          <Link href="/payroll" className="text-xs text-[var(--color-atlas-blue)]">← All payroll runs</Link>
          <h2 className="text-lg font-semibold">{run.periodLabel}</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">{run.periodStart.toLocaleDateString("en-GB")} – {run.periodEnd.toLocaleDateString("en-GB")}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill label={run.status} tone={TONE[run.status]} />
          {manage && run.status === "DRAFT" && <form action={finalisePayrollRun.bind(null, run.id)}><Button type="submit" variant="primary">Finalise run</Button></form>}
          {manage && run.status === "FINALISED" && <form action={markPayrollRunPaid.bind(null, run.id)}><Button type="submit" variant="primary">Mark as paid</Button></form>}
        </div>
      </div>

      <DataTable
        rows={run.payslips}
        emptyLabel="No employees were active for this period."
        columns={[
          { header: "Employee", render: (p) => <Link href={`/people/${p.employee.id}`} className="font-medium text-[var(--color-atlas-blue)]">{p.employee.firstName} {p.employee.lastName}</Link> },
          { header: "Gross", render: (p) => formatMoney(p.grossMinorUnits + p.overtimeMinorUnits + p.statutoryPayMinorUnits, p.currency), align: "right" },
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

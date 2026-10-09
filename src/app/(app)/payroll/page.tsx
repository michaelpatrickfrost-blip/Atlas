import {PeopleWorkspaceHeader,WorkspaceStats} from "@/components/ui/people-workspace";
import Link from "next/link";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";
import { listPayrollRuns } from "@/modules/payroll/services/queries";

const TONE: Record<string, StatusTone> = { DRAFT: "neutral", FINALISED: "warning", PAID: "success" };

export default async function PayrollPage() {
  const session = await requireSession();
  assertCapability(session, PAYROLL_CAPABILITIES.runRead);
  const manage = can(session, PAYROLL_CAPABILITIES.runManage);
  const runs = await listPayrollRuns(session);

  return (
    <div className="space-y-6">
      <PeopleWorkspaceHeader eyebrow="Pay & time" title="UK payroll" description="From approved actual time to reviewed payslips. Keep draft preparation, finalisation and payment status clear, with the employee record and source inputs always connected." actions={<>{can(session,PAYROLL_CAPABILITIES.employeeManage)&&<Link href="/payroll/employees" className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700">Employee pay setup</Link>}{manage&&<Link href="/payroll/prepare" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Prepare payroll →</Link>}</>}/>
      <WorkspaceStats items={[{label:"Draft runs",value:runs.filter(r=>r.status==="DRAFT").length},{label:"Awaiting payment",value:runs.filter(r=>r.status==="FINALISED").length},{label:"Paid runs",value:runs.filter(r=>r.status==="PAID").length,tone:"success"},{label:"Employee integration",value:"HR + Time",detail:"UK calculation; RTI filing and bank transfers are external."}]}/>
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
      <p className="text-xs text-slate-500">Approved timesheets feed actual pay hours. Review pay setup and absence in preparation; a changed source requires a reviewed draft refresh before finalisation.</p>
    </div>
  );
}

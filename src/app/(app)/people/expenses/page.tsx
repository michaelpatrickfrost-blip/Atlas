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
import { submitExpenseClaim, approveExpenseClaim, rejectExpenseClaim } from "./actions";

const TONE: Record<string, StatusTone> = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

function formatMoney(minorUnits: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minorUnits / 100);
}

export default async function ExpensesPage() {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.expenseRead);
  const canApprove = can(session, HR_CAPABILITIES.expenseApprove);
  const manage = can(session, HR_CAPABILITIES.employeeManage);

  const [claims, employees] = await Promise.all([
    db.expenseClaim.findMany({
      where: { organisationId: session.organisationId },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ status: "asc" }, { incurredOn: "desc" }],
    }),
    manage ? db.employee.findMany({ where: { organisationId: session.organisationId, status: { not: "LEFT" } }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }) : [],
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Expenses</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">Claims submitted by employees, awaiting or decided by their approver.</p>
        </div>
        <CreateDialog title="Submit expense claim" label="Submit claim">
          <ActionForm action={submitExpenseClaim} className="mt-5 grid gap-4 sm:grid-cols-2">
            {manage && (
              <label className="text-sm sm:col-span-2">On behalf of (optional — leave blank to submit your own)
                <select name="employeeId" className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                  <option value="">Myself</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </label>
            )}
            <label className="text-sm">Category<input name="category" required maxLength={100} placeholder="Travel" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <label className="text-sm">Amount (£)<input type="number" step="0.01" min="0.01" name="amount" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <label className="text-sm">Date incurred<input type="date" name="incurredOn" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
            <label className="text-sm sm:col-span-2">Description<textarea name="description" className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
            <Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">Submit claim</Button>
          </ActionForm>
        </CreateDialog>
      </div>

      <DataTable
        rows={claims}
        emptyLabel="No expense claims yet."
        columns={[
          { header: "Employee", render: (c) => <Link href={`/people/${c.employee.id}`} className="font-medium text-[var(--color-atlas-blue)]">{c.employee.firstName} {c.employee.lastName}</Link> },
          { header: "Category", render: (c) => c.category },
          { header: "Date", render: (c) => c.incurredOn.toLocaleDateString("en-GB") },
          { header: "Amount", render: (c) => formatMoney(c.amountMinorUnits, c.currency), align: "right" },
          {
            header: "Status",
            render: (c) =>
              c.status === "PENDING" && canApprove ? (
                <div className="flex items-center justify-end gap-2">
                  <form action={approveExpenseClaim.bind(null, c.id)}><Button type="submit" className="text-xs">Approve</Button></form>
                  <ActionForm action={rejectExpenseClaim.bind(null, c.id)} className="flex items-center gap-1">
                    <input name="rejectionReason" placeholder="Reason" className="w-24 border border-[var(--color-border)] p-1 text-xs" />
                    <Button type="submit" variant="danger" className="text-xs">Reject</Button>
                  </ActionForm>
                </div>
              ) : (
                <StatusPill label={c.status} tone={TONE[c.status]} />
              ),
            align: "right",
          },
        ]}
      />
    </div>
  );
}

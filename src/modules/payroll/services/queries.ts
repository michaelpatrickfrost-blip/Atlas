import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";

export async function listPayrollRuns(session: Session) {
  return db.payrollRun.findMany({ where: { organisationId: session.organisationId }, orderBy: { periodStart: "desc" }, include: { _count: { select: { payslips: true } } } });
}

export async function getPayrollRun(session: Session, runId: string) {
  const manage = can(session, PAYROLL_CAPABILITIES.runManage);
  return { run: await db.payrollRun.findFirstOrThrow({ where: { id: runId, organisationId: session.organisationId }, include: { payslips: { include: { employee: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: "asc" } } } }), manage };
}

/** A person's own payslips and leaver/year-end documents, for their profile. */
export async function myPayslips(session: Session) {
  const employee = await db.employee.findFirst({ where: { organisationId: session.organisationId, userId: session.userId } });
  if (!employee) return { payslips: [], documents: [] };
  const [payslips, documents] = await Promise.all([
    db.payslip.findMany({ where: { organisationId: session.organisationId, employeeId: employee.id }, orderBy: { createdAt: "desc" }, take: 12, include: { payrollRun: { select: { periodLabel: true } } } }),
    db.payrollDocument.findMany({ where: { organisationId: session.organisationId, employeeId: employee.id }, orderBy: { generatedAt: "desc" } }),
  ]);
  return { payslips, documents };
}

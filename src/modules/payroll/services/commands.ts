import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { preparePayroll, payrollPeriod, type PayrollFrequency } from "./preparation";
import type { Prisma } from "@/generated/prisma/client";
import { CURRENT_TAX_YEAR } from "@/modules/payroll/domain/tax-tables";

export async function getPayrollSettings(organisationId: string) {
  const existing = await db.payrollSettings.findUnique({ where: { organisationId } });
  if (existing) return existing;
  return db.payrollSettings.create({ data: { organisationId, currentTaxYear: CURRENT_TAX_YEAR } });
}

export async function savePayrollSettings(session: Session, form: FormData) {
  assertCapability(session, PAYROLL_CAPABILITIES.settingsManage);
  const payeReference = String(form.get("payeReference") ?? "").trim() || null;
  const accountsOfficeReference = String(form.get("accountsOfficeReference") ?? "").trim() || null;
  const pensionSchemeName = String(form.get("pensionSchemeName") ?? "").trim() || null;
  const employerPensionPercent = Number(form.get("employerPensionPercent") ?? 3);
  const employeePensionPercent = Number(form.get("employeePensionPercent") ?? 5);
  if (employerPensionPercent < 0 || employerPensionPercent > 100 || employeePensionPercent < 0 || employeePensionPercent > 100) {
    throw new Error("Pension percentages must be between 0 and 100.");
  }
  await db.payrollSettings.upsert({
    where: { organisationId: session.organisationId },
    create: { organisationId: session.organisationId, currentTaxYear: CURRENT_TAX_YEAR, payeReference, accountsOfficeReference, pensionSchemeName, employerPensionPercent, employeePensionPercent },
    update: { payeReference, accountsOfficeReference, pensionSchemeName, employerPensionPercent, employeePensionPercent },
  });
}

type Prepared = Awaited<ReturnType<typeof preparePayroll>>;
function reviewed(form:FormData,data:Prepared) {
  if(form.get("reviewed")!=="on")throw new Error("Confirm the pay inputs have been reviewed.");
  if(String(form.get("inputDigest"))!==data.inputDigest)throw new Error("Payroll inputs changed since the review. Refresh and review them again.");
  if(!data.rows.length)throw new Error("No eligible employees for this pay frequency and period.");
  if(data.issues)throw new Error("Resolve every blocking payroll issue before generating payslips.");
}
async function writePayslips(tx:Prisma.TransactionClient,session:Session,runId:string,data:Prepared) {
  const organisationId=session.organisationId;
  const previous=await tx.payslip.findMany({where:{organisationId,payrollRunId:runId}});
  for(const row of data.rows) {
    if(!row.result)throw new Error("A payroll calculation is unavailable.");
    const deductionsMinorUnits=previous.find(p=>p.employeeId===row.employeeId)?.deductionsMinorUnits??0;
    const values={...row.result,deductionsMinorUnits,netMinorUnits:row.result.netMinorUnits-deductionsMinorUnits,approvedHours:row.approvedHours,sourceTimesheetIds:row.sourceTimesheetIds,unpaidLeaveDays:row.unpaidDays};
    if(values.netMinorUnits<0)throw new Error("A retained deduction would make net pay negative. Review the draft deduction first.");
    await tx.payslip.upsert({where:{payrollRunId_employeeId:{payrollRunId:runId,employeeId:row.employeeId}},create:{...values,organisationId,payrollRunId:runId,employeeId:row.employeeId},update:values});
  }
  await tx.payslip.deleteMany({where:{organisationId,payrollRunId:runId,employeeId:{notIn:data.rows.map(r=>r.employeeId)}}});
  await tx.payrollRun.update({where:{id:runId,organisationId,status:"DRAFT"},data:{taxYear:data.taxYear,payFrequency:data.frequency,inputDigest:data.inputDigest,inputSnapshot:data.inputSnapshot,version:{increment:1}}});
}
export async function createPayrollRun(session:Session,form:FormData) {
  assertCapability(session,PAYROLL_CAPABILITIES.runManage);
  const periodLabel=String(form.get("periodLabel")??"").trim(),start=String(form.get("periodStart")),end=String(form.get("periodEnd")),frequency=String(form.get("payFrequency")) as PayrollFrequency;
  if(!periodLabel||periodLabel.length>100)throw new Error("Name the pay period.");
  return db.$transaction(async tx=>{
    const data=await preparePayroll(session,start,end,frequency,tx);reviewed(form,data);
    if(await tx.payrollRun.count({where:{organisationId:session.organisationId,periodStart:{lte:data.periodEnd},periodEnd:{gte:data.periodStart},payslips:{some:{employeeId:{in:data.rows.map(r=>r.employeeId)}}}}}))throw new Error("An existing payroll run already covers employees in this period. Refresh its draft instead of paying them twice.");
    if(await tx.payrollRun.count({where:{organisationId:session.organisationId,status:{in:["FINALISED","PAID"]},periodStart:{gt:data.periodEnd},payslips:{some:{employeeId:{in:data.rows.map(r=>r.employeeId)}}}}}))throw new Error("A later period is already finalised for these employees. Process corrections through a verified payroll review.");
    const run=await tx.payrollRun.create({data:{organisationId:session.organisationId,periodLabel,periodStart:data.periodStart,periodEnd:data.periodEnd,payFrequency:frequency}});
    await writePayslips(tx,session,run.id,data);
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"payroll_run.created",entityType:"PayrollRun",entityId:run.id,after:{approvedHours:data.approvedHours,inputDigest:data.inputDigest}}});
    return run;
  },{isolationLevel:"Serializable",timeout:30000});
}
export async function refreshPayrollRun(session:Session,runId:string,form:FormData) {
  assertCapability(session,PAYROLL_CAPABILITIES.runManage);
  await db.$transaction(async tx=>{
    const run=await tx.payrollRun.findFirstOrThrow({where:{id:runId,organisationId:session.organisationId,status:"DRAFT"}});
    const data=await preparePayroll(session,run.periodStart.toISOString().slice(0,10),run.periodEnd.toISOString().slice(0,10),run.payFrequency??"MONTHLY",tx);reviewed(form,data);
    await writePayslips(tx,session,run.id,data);
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"payroll_run.refreshed",entityType:"PayrollRun",entityId:run.id,after:{inputDigest:data.inputDigest}}});
  },{isolationLevel:"Serializable",timeout:30000});
}
export async function savePeriodAdjustment(session:Session,form:FormData) {
  assertCapability(session,PAYROLL_CAPABILITIES.runManage);
  const employeeId=String(form.get("employeeId")),{periodStart,periodEnd}=payrollPeriod(String(form.get("periodStart")),String(form.get("periodEnd")),String(form.get("payFrequency")) as PayrollFrequency);
  const statutoryPayMinorUnits=Math.round(Number(form.get("statutoryPay"))*100),salaryReductionMinorUnits=Math.round(Number(form.get("salaryReduction"))*100),additionalPayMinorUnits=Math.round(Number(form.get("additionalPay")??0)*100),note=String(form.get("note")??"").trim();
  if(!note||note.length>1000||![statutoryPayMinorUnits,salaryReductionMinorUnits,additionalPayMinorUnits].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000))throw new Error("Enter non-negative pay amounts and the reason/evidence for this review.");
  await db.$transaction(async tx=>{
    if(!await tx.employee.count({where:{id:employeeId,organisationId:session.organisationId}}))throw new Error("Employee unavailable.");
    if(await tx.payrollRun.count({where:{organisationId:session.organisationId,status:{in:["FINALISED","PAID"]},periodStart:{lte:periodEnd},periodEnd:{gte:periodStart},payslips:{some:{employeeId}}}}))throw new Error("This employee’s pay has already been finalised for this period.");
    const where={organisationId_employeeId_periodStart_periodEnd:{organisationId:session.organisationId,employeeId,periodStart,periodEnd}},data={statutoryPayMinorUnits,salaryReductionMinorUnits,additionalPayMinorUnits,statutoryReviewed:form.get("statutoryReviewed")==="on",note,reviewedByUserId:session.userId};
    const existing=await tx.payrollPeriodAdjustment.findUnique({where});let id:string;
    if(existing){const changed=await tx.payrollPeriodAdjustment.updateMany({where:{id:existing.id,organisationId:session.organisationId,version:Number(form.get("version"))},data:{...data,version:{increment:1}}});if(changed.count!==1)throw new Error("Another reviewer changed these pay inputs. Refresh first.");id=existing.id;}
    else {if(Number(form.get("version")??-1)!==-1)throw new Error("The pay review changed. Refresh first.");const row=await tx.payrollPeriodAdjustment.create({data:{...data,organisationId:session.organisationId,employeeId,periodStart,periodEnd}});id=row.id;}
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"payroll.inputs.reviewed",entityType:"PayrollPeriodAdjustment",entityId:id,after:{employeeId,statutoryPayMinorUnits,salaryReductionMinorUnits,statutoryReviewed:data.statutoryReviewed}}});
  },{isolationLevel:"Serializable"});
}
export async function updatePayslipDeductions(session:Session,payslipId:string,form:FormData) {
  assertCapability(session,PAYROLL_CAPABILITIES.runManage);
  const pounds=Number(form.get("deductions"));if(!Number.isFinite(pounds)||pounds<0||pounds>1000000)throw new Error("Enter a deduction between £0 and £1,000,000.");
  await db.$transaction(async tx=>{
    const slip=await tx.payslip.findFirstOrThrow({where:{id:payslipId,organisationId:session.organisationId},include:{payrollRun:true}});if(slip.payrollRun.status!=="DRAFT")throw new Error("This run is already finalised.");
    const deductionsMinorUnits=Math.round(pounds*100),netMinorUnits=slip.netMinorUnits+slip.deductionsMinorUnits-deductionsMinorUnits;if(netMinorUnits<0)throw new Error("A deduction cannot exceed available net pay.");
    await tx.payrollRun.update({where:{id:slip.payrollRunId,organisationId:session.organisationId,status:"DRAFT",version:slip.payrollRun.version},data:{version:{increment:1}}});
    await tx.payslip.update({where:{id:slip.id,organisationId:session.organisationId},data:{deductionsMinorUnits,netMinorUnits,notes:String(form.get("notes")??"").slice(0,1000)||null}});
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"payroll.deduction.updated",entityType:"Payslip",entityId:slip.id,after:{deductionsMinorUnits}}});
  },{isolationLevel:"Serializable"});
}
export async function finalisePayrollRun(session:Session,runId:string,form:FormData) {
  assertCapability(session,PAYROLL_CAPABILITIES.runManage);
  if(form.get("reviewed")!=="on")throw new Error("Confirm you reviewed every payslip and the payroll calculation scope.");
  await db.$transaction(async tx=>{
    const run=await tx.payrollRun.findFirstOrThrow({where:{id:runId,organisationId:session.organisationId,status:"DRAFT"},include:{payslips:true}});
    const data=await preparePayroll(session,run.periodStart.toISOString().slice(0,10),run.periodEnd.toISOString().slice(0,10),run.payFrequency??"MONTHLY",tx);
    if(!run.inputDigest||run.inputDigest!==data.inputDigest||data.issues)throw new Error("The source inputs changed or this is a legacy draft. Review and refresh the draft before finalising.");
    if(await tx.payrollRun.count({where:{organisationId:session.organisationId,id:{not:run.id},status:{in:["FINALISED","PAID"]},periodStart:{gt:data.periodEnd},payslips:{some:{employeeId:{in:data.rows.map(r=>r.employeeId)}}}}}))throw new Error("A later period was finalised. Review the payroll sequence before continuing.");
    if(!run.payslips.length||run.payslips.some(p=>p.netMinorUnits<0))throw new Error("Review the payslips before finalising.");
    await tx.payrollRun.update({where:{id:run.id,organisationId:session.organisationId,status:"DRAFT",version:run.version},data:{status:"FINALISED",finalisedAt:new Date(),version:{increment:1}}});
    for(const slip of run.payslips){const opening=await tx.employeeTaxYearToDate.findUnique({where:{employeeId_taxYear:{employeeId:slip.employeeId,taxYear:data.taxYear}}});const finalised=await tx.payslip.findMany({where:{organisationId:session.organisationId,employeeId:slip.employeeId,payrollRun:{status:{in:["FINALISED","PAID"]},periodStart:{gte:new Date("2026-04-06T00:00:00Z")},periodEnd:{lte:new Date("2027-04-05T00:00:00Z")}}}});const figures={grossToDateMinorUnits:(opening?.openingGrossMinorUnits??0)+finalised.reduce((n,p)=>n+p.grossMinorUnits+p.overtimeMinorUnits+p.statutoryPayMinorUnits+p.additionalPayMinorUnits-p.unpaidLeaveDeductionMinorUnits,0),taxToDateMinorUnits:(opening?.openingTaxMinorUnits??0)+finalised.reduce((n,p)=>n+p.taxMinorUnits,0),niToDateMinorUnits:finalised.reduce((n,p)=>n+p.employeeNiMinorUnits,0)};await tx.employeeTaxYearToDate.upsert({where:{employeeId_taxYear:{employeeId:slip.employeeId,taxYear:data.taxYear}},create:{organisationId:session.organisationId,employeeId:slip.employeeId,taxYear:data.taxYear,...figures},update:figures});}
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"payroll_run.finalised",entityType:"PayrollRun",entityId:run.id}});
  },{isolationLevel:"Serializable",timeout:30000});
}
export async function markPayrollRunPaid(session:Session,runId:string) {
  assertCapability(session,PAYROLL_CAPABILITIES.runManage);
  await db.$transaction(async tx=>{const changed=await tx.payrollRun.updateMany({where:{id:runId,organisationId:session.organisationId,status:"FINALISED"},data:{status:"PAID",paidAt:new Date(),version:{increment:1}}});if(changed.count!==1)throw new Error("Only a finalised, unpaid run can be marked paid.");await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"payroll_run.paid",entityType:"PayrollRun",entityId:runId}});},{isolationLevel:"Serializable"});
}

/** P45: a leaver's year-to-date pay/tax figures, for export — not a filing. */
export async function issueP45(session: Session, employeeId: string) {
  assertCapability(session, PAYROLL_CAPABILITIES.runManage);
  await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });
  const settings = await getPayrollSettings(session.organisationId);
  const ytd = await db.employeeTaxYearToDate.findUnique({ where: { employeeId_taxYear: { employeeId, taxYear: settings.currentTaxYear } } });
  const doc = await db.payrollDocument.create({
    data: { organisationId: session.organisationId, employeeId, type: "P45", taxYear: settings.currentTaxYear, figures: { grossToDateMinorUnits: ytd?.grossToDateMinorUnits ?? 0, taxToDateMinorUnits: ytd?.taxToDateMinorUnits ?? 0, niToDateMinorUnits: ytd?.niToDateMinorUnits ?? 0 } },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "payroll_document.p45_issued", entityType: "PayrollDocument", entityId: doc.id });
  return doc;
}

/** P60: the tax year's final pay/tax/NI figures, for export — not a filing. */
export async function issueP60(session: Session, employeeId: string) {
  assertCapability(session, PAYROLL_CAPABILITIES.runManage);
  await db.employee.findFirstOrThrow({ where: { id: employeeId, organisationId: session.organisationId } });
  const settings = await getPayrollSettings(session.organisationId);
  const ytd = await db.employeeTaxYearToDate.findUniqueOrThrow({ where: { employeeId_taxYear: { employeeId, taxYear: settings.currentTaxYear } } });
  const doc = await db.payrollDocument.create({
    data: { organisationId: session.organisationId, employeeId, type: "P60", taxYear: settings.currentTaxYear, figures: { grossToDateMinorUnits: ytd.grossToDateMinorUnits, taxToDateMinorUnits: ytd.taxToDateMinorUnits, niToDateMinorUnits: ytd.niToDateMinorUnits } },
  });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "payroll_document.p60_issued", entityType: "PayrollDocument", entityId: doc.id });
  return doc;
}

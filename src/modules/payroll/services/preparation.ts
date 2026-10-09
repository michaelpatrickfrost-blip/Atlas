import { createHash } from "node:crypto";
import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { CURRENT_TAX_YEAR } from "../domain/tax-tables";
import { civilDate } from "@/modules/teams/domain/board";
import { calculatePayslip } from "../domain/payroll-run";

export type PayrollFrequency="MONTHLY"|"WEEKLY";
export function payrollPeriod(start:string,end:string,frequency:PayrollFrequency) {
  const periodStart=civilDate(start),periodEnd=civilDate(end),days=(periodEnd.getTime()-periodStart.getTime())/86400000+1;
  if(frequency!=="MONTHLY"&&frequency!=="WEEKLY")throw new Error("Choose weekly or monthly payroll.");
  if(frequency==="WEEKLY"?days!==7:days<28||days>31)throw new Error("Use a seven-day weekly period or a monthly period of 28–31 days.");
  if(periodStart<new Date("2026-04-06T00:00:00Z")||periodEnd>new Date("2027-04-05T00:00:00Z"))throw new Error("This release supports payroll periods wholly within tax year 2026–27.");
  return {periodStart,periodEnd};
}
function workingDates(start:Date,end:Date,workingDays:number[]) { const days:Date[]=[];for(let day=start;day<=end;day=new Date(day.getTime()+86400000))if(workingDays.includes(day.getUTCDay()))days.push(day);return days; }

export async function preparePayroll(session:Session,start:string,end:string,frequency:PayrollFrequency="MONTHLY",tx:Prisma.TransactionClient=db) {
  assertCapability(session,"payroll.run.read");
  const {periodStart,periodEnd}=payrollPeriod(start,end,frequency),organisationId=session.organisationId;
  const until=new Date(periodEnd.getTime()+86400000),taxYearStart=new Date("2026-04-06T00:00:00Z");
  const [employees,org,existingSettings]=await Promise.all([
    tx.employee.findMany({
      where:{organisationId,payFrequency:frequency,status:{in:["ACTIVE","ON_LEAVE","OFFBOARDING","LEFT"]},startDate:{lt:until},OR:[{endDate:null},{endDate:{gte:periodStart}}]},
      include:{
        timesheets:{where:{organisationId,entries:{some:{organisationId,workedOn:{gte:periodStart,lte:periodEnd}}}},include:{entries:{where:{organisationId,workedOn:{gte:periodStart,lte:periodEnd}},orderBy:{workedOn:"asc"}}}},
        absences:{where:{organisationId,status:"APPROVED",startDate:{lte:periodEnd},endDate:{gte:periodStart}},orderBy:{id:"asc"}},
        taxYearToDates:{where:{organisationId,taxYear:CURRENT_TAX_YEAR}},
        payrollAdjustments:{where:{organisationId,periodStart,periodEnd}},
        payslips:{where:{organisationId,payrollRun:{organisationId,status:{in:["FINALISED","PAID"]},periodEnd:{lt:periodStart,gte:taxYearStart}}},orderBy:{id:"asc"}}
      },orderBy:{id:"asc"}
    }),
    tx.organisation.findUniqueOrThrow({where:{id:organisationId},select:{hrStandardWeeklyHours:true,hrOvertimeMultiplier:true}}),
    tx.payrollSettings.findUnique({where:{organisationId}})
  ]);
  const settings=existingSettings??{currentTaxYear:CURRENT_TAX_YEAR,employeePensionPercent:5,employerPensionPercent:3};
  if(settings.currentTaxYear!==CURRENT_TAX_YEAR)throw new Error("Select the supported 2026–27 tax year in payroll settings.");
  const rows=employees.map(employee=>{
    const approved=employee.timesheets.filter(t=>t.status==="APPROVED"),unapproved=employee.timesheets.filter(t=>t.status!=="APPROVED"&&t.entries.some(e=>e.minutes>0));
    const approvedHours=approved.flatMap(t=>t.entries).reduce((n,e)=>n+e.minutes/60,0),issues:string[]=[],adjustment=employee.payrollAdjustments[0];
    if(employee.timesheets.some(sheet=>sheet.entries.some(entry=>entry.minutes>0&&(entry.workedOn<employee.startDate||(employee.endDate&&entry.workedOn>employee.endDate)))))issues.push("Review actual time outside the employee’s employment dates.");
    if(employee.status==="LEFT"&&!employee.endDate)issues.push("Confirm the leaver’s employment end date.");
    if(employee.currency!=="GBP")issues.push("UK payroll requires GBP pay.");
    if(employee.payBasis==="HOURLY"? !employee.hourlyRateMinorUnits||employee.hourlyRateMinorUnits<0 : !employee.annualSalaryMinorUnits||employee.annualSalaryMinorUnits<0)issues.push("Set a positive pay rate for the recorded hourly or salaried contract.");
    if(!["HOURLY","SALARIED"].includes(employee.payBasis))issues.push("Choose hourly or salaried pay.");
    if(employee.payBasis==="HOURLY"&&!approved.length)issues.push("Hourly payroll requires approved actual time for this period.");
    const opening=employee.taxYearToDates[0];
    if(!opening?.openingReviewed)issues.push("Confirm opening pay and tax history, including zero balances if none.");
    if(!employee.taxCode)issues.push("Confirm the HMRC tax code.");
    if(unapproved.length)issues.push("Review every entered timesheet before calculating pay.");
    const standardWeeklyHours=employee.contractedWeeklyHours??org.hrStandardWeeklyHours;
    if(!Number.isFinite(standardWeeklyHours)||standardWeeklyHours<=0||standardWeeklyHours>168||!employee.workingDays.length)issues.push("Set valid contracted hours and working days.");
    if(employee.absences.some(a=>a.type==="SICKNESS"||a.type==="MATERNITY_PATERNITY"||(employee.payBasis==="HOURLY"&&a.type==="HOLIDAY"))&&!adjustment?.statutoryReviewed)issues.push("Verify statutory/holiday pay, earnings history and any salary replacement for this period.");
    const periodDays=workingDates(periodStart,periodEnd,employee.workingDays),employedDays=periodDays.filter(d=>d>=employee.startDate&&(!employee.endDate||d<=employee.endDate));
    const unpaidDays=employedDays.filter(day=>employee.absences.some(a=>a.type==="UNPAID"&&a.startDate<=day&&a.endDate>=day)).length;
    const priorGross=(opening?.openingGrossMinorUnits??0)+employee.payslips.reduce((n,p)=>n+p.grossMinorUnits+p.overtimeMinorUnits+p.statutoryPayMinorUnits+p.additionalPayMinorUnits-p.unpaidLeaveDeductionMinorUnits,0),priorTax=(opening?.openingTaxMinorUnits??0)+employee.payslips.reduce((n,p)=>n+p.taxMinorUnits,0);
    const taxPeriod=frequency==="WEEKLY"?Math.min(53,Math.floor((periodEnd.getTime()-taxYearStart.getTime())/(7*86400000))+1):Math.min(12,Math.max(1,(periodEnd.getUTCFullYear()-2026)*12+periodEnd.getUTCMonth()-3+(periodEnd.getUTCDate()>=6?1:0)));
    if(frequency==="WEEKLY"&&taxPeriod>52)issues.push("Week 53 needs a verified external payroll calculation.");
    let result:ReturnType<typeof calculatePayslip>|null=null;
    if(!issues.length)try { result=calculatePayslip({annualSalaryMinorUnits:employee.annualSalaryMinorUnits,payBasis:employee.payBasis,hourlyRateMinorUnits:employee.hourlyRateMinorUnits,postgraduateLoan:employee.postgraduateLoan,additionalPayMinorUnits:adjustment?.additionalPayMinorUnits??0,currency:employee.currency,taxCode:employee.taxCode,niCategory:employee.niCategory,studentLoanPlan:employee.studentLoanPlan,pensionOptOut:employee.pensionOptOut,payFrequency:employee.payFrequency,taxYear:settings.currentTaxYear,employeePensionPercent:settings.employeePensionPercent,employerPensionPercent:settings.employerPensionPercent,confirmedShiftHours:approvedHours,standardWeeklyHours,overtimeMultiplier:org.hrOvertimeMultiplier,unpaidDaysInPeriod:unpaidDays,statutoryPayMinorUnits:adjustment?.statutoryPayMinorUnits??0,manualAdjustmentMinorUnits:0,periodStart,periodEnd:new Date(periodEnd.getTime()+86400000),workingDaysPerWeek:employee.workingDays.length,salaryFactor:periodDays.length?employedDays.length/periodDays.length:0,salaryReductionMinorUnits:adjustment?.salaryReductionMinorUnits??0,priorGrossMinorUnits:priorGross,priorTaxMinorUnits:priorTax,taxPeriod});if(result.grossMinorUnits<0||result.netMinorUnits<0)issues.push("Salary replacement or deductions would create negative pay; review the inputs.");}catch(error){issues.push(error instanceof Error?error.message:"The payroll inputs could not be calculated.");}
    const snapshot={employeeId:employee.id,annualSalaryMinorUnits:employee.annualSalaryMinorUnits,payBasis:employee.payBasis,hourlyRateMinorUnits:employee.hourlyRateMinorUnits,postgraduateLoan:employee.postgraduateLoan,additionalPayMinorUnits:adjustment?.additionalPayMinorUnits??0,currency:employee.currency,taxCode:employee.taxCode,niCategory:employee.niCategory,studentLoanPlan:employee.studentLoanPlan,pensionOptOut:employee.pensionOptOut,standardWeeklyHours,workingDays:employee.workingDays,startDate:employee.startDate,endDate:employee.endDate,timesheets:employee.timesheets.map(t=>({id:t.id,status:t.status,entries:t.entries.map(e=>({id:e.id,workedOn:e.workedOn,minutes:e.minutes}))})).sort((a,b)=>a.id.localeCompare(b.id)),absences:employee.absences.map(a=>({id:a.id,type:a.type,start:a.startDate,end:a.endDate})),adjustment:adjustment?{id:adjustment.id,version:adjustment.version,statutoryPayMinorUnits:adjustment.statutoryPayMinorUnits,additionalPayMinorUnits:adjustment.additionalPayMinorUnits,salaryReductionMinorUnits:adjustment.salaryReductionMinorUnits,statutoryReviewed:adjustment.statutoryReviewed}:null,priorGross,priorTax};
    return {employeeId:employee.id,name:`${employee.firstName} ${employee.lastName}`,employeeNumber:employee.employeeNumber,department:employee.department,annualSalaryMinorUnits:employee.annualSalaryMinorUnits,taxCode:employee.taxCode,niCategory:employee.niCategory,approvedHours,awaitingApproval:unapproved.length,missingTimesheets:approved.length===0,issues,result,unpaidDays,adjustment,sourceTimesheetIds:approved.map(t=>t.id),snapshot};
  });
  const inputSnapshot=JSON.parse(JSON.stringify({calculationVersion:"atlas-uk-2026-27-v2",periodStart,periodEnd,frequency,settings:{taxYear:settings.currentTaxYear,employeePensionPercent:settings.employeePensionPercent,employerPensionPercent:settings.employerPensionPercent},org,rows:rows.map(r=>r.snapshot)})) as Prisma.InputJsonValue;
  const inputDigest=createHash("sha256").update(JSON.stringify(inputSnapshot)).digest("hex");
  return {periodStart,periodEnd,frequency,rows,inputDigest,inputSnapshot,taxYear:settings.currentTaxYear,issues:rows.reduce((n,r)=>n+r.issues.length,0),approvedHours:rows.reduce((n,r)=>n+r.approvedHours,0),awaitingApproval:rows.reduce((n,r)=>n+r.awaitingApproval,0)};
}

export async function payrollReadinessProvider(session:Session,start:string,end:string) {assertCapability(session,"payroll.run.read");await assertModuleEnabled(session,"payroll");const data=process.env.ATLAS_RUNTIME==="desktop"?await (await import("@/app/(app)/payroll/actions")).getPayrollPreparation(start,end,"MONTHLY"):await preparePayroll(session,start,end);return {employees:data.rows.length,issues:data.issues,approvedHours:data.approvedHours,awaitingApproval:data.awaitingApproval};}

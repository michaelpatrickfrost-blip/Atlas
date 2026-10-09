"use server";
import {withFormFeedback} from "@/core/shared/form-feedback";
import {db} from "@/core/db/client";
import {requireSession} from "@/core/auth/session";
import {assertCapability} from "@/core/permissions/check";
import {assertModuleEnabled} from "@/core/modules/access";
import {CURRENT_TAX_YEAR} from "@/modules/payroll/domain/tax-tables";
import {allowanceFromTaxCode} from "@/modules/payroll/domain/paye";
import {revalidatePath} from "next/cache";

export async function getPayEmployees(query:string) {
  const session=await requireSession();assertCapability(session,"payroll.employee.manage");await assertModuleEnabled(session,"payroll");
  const q=query.trim().slice(0,100);return db.employee.findMany({where:{organisationId:session.organisationId,status:{not:"LEFT"},...(q?{OR:[{firstName:{contains:q,mode:"insensitive"}},{lastName:{contains:q,mode:"insensitive"}},{employeeNumber:{contains:q,mode:"insensitive"}},{department:{contains:q,mode:"insensitive"}}]}:{})},select:{id:true,employeeNumber:true,firstName:true,lastName:true,department:true,annualSalaryMinorUnits:true,payBasis:true,hourlyRateMinorUnits:true,currency:true,contractedWeeklyHours:true,payFrequency:true,taxCode:true,niCategory:true,niNumber:true,studentLoanPlan:true,postgraduateLoan:true,pensionOptOut:true,bankAccountName:true,bankSortCode:true,bankAccountNumber:true,updatedAt:true,taxYearToDates:{where:{taxYear:CURRENT_TAX_YEAR},select:{openingGrossMinorUnits:true,openingTaxMinorUnits:true,openingReviewNote:true,openingReviewed:true}}},orderBy:[{lastName:"asc"},{firstName:"asc"}],take:200});
}
export async function savePayEmployee(form:FormData) {
  const session=await requireSession();assertCapability(session,"payroll.employee.manage");
 return withFormFeedback(async()=> {
await assertModuleEnabled(session,"payroll");
  const id=String(form.get("employeeId")),payBasis=String(form.get("payBasis")),payFrequency=String(form.get("payFrequency")),taxCode=String(form.get("taxCode")??"").trim().toUpperCase(),niCategory=String(form.get("niCategory")),loan=String(form.get("studentLoanPlan")??""),note=String(form.get("openingReviewNote")??"").trim();
  const minor=(key:string)=>{const n=Math.round(Number(form.get(key))*100);if(!Number.isSafeInteger(n)||n<0||n>100000000)throw new Error("Enter valid non-negative pay amounts.");return n;};
  const annualSalaryMinorUnits=minor("salary"),hourlyRateMinorUnits=minor("hourlyRate"),openingGrossMinorUnits=minor("openingGross"),openingTaxMinorUnits=minor("openingTax"),hours=Number(form.get("contractedWeeklyHours"));
  if(!["SALARIED","HOURLY"].includes(payBasis)||!["WEEKLY","MONTHLY"].includes(payFrequency)||!Number.isFinite(hours)||hours<=0||hours>168||!(payBasis==="HOURLY"?hourlyRateMinorUnits:annualSalaryMinorUnits))throw new Error("Choose a pay basis, frequency, positive rate and contracted weekly hours.");
  if(!taxCode)throw new Error("Confirm the HMRC tax code.");allowanceFromTaxCode(taxCode,12570);
  if(!["A","B","C","D","E","F","H","I","J","K","L","M","N","S","V","Z"].includes(niCategory))throw new Error("Choose a supported NI category.");
  if(!["","PLAN_1","PLAN_2","PLAN_4","PLAN_5","POSTGRADUATE"].includes(loan))throw new Error("Choose a loan plan.");
  const niNumber=String(form.get("niNumber")??"").replaceAll(" ","").toUpperCase(),bankSortCode=String(form.get("bankSortCode")??"").replace(/[ -]/g,""),bankAccountNumber=String(form.get("bankAccountNumber")??"").replaceAll(" ",""),bankAccountName=String(form.get("bankAccountName")??"").trim();
  if(niNumber&&!/^[A-Z]{2}\d{6}[A-D]$/.test(niNumber))throw new Error("Enter a valid National Insurance number.");
  if((bankSortCode&&!/^\d{6}$/.test(bankSortCode))||(bankAccountNumber&&!/^\d{8}$/.test(bankAccountNumber))||bankAccountName.length>100)throw new Error("Enter a six-digit sort code, eight-digit account number and account name.");
  if(openingTaxMinorUnits>openingGrossMinorUnits)throw new Error("Opening tax cannot exceed opening taxable pay. Check the source figures.");
  const openingReviewed=form.get("openingReviewed")==="on";if(openingReviewed&&(!note||note.length>1000))throw new Error("Record the opening-balance evidence or confirm why no prior pay exists.");
  await db.$transaction(async tx=>{
    const existing=await tx.employee.findFirstOrThrow({where:{id,organisationId:session.organisationId}}),opening=await tx.employeeTaxYearToDate.findUnique({where:{employeeId_taxYear:{employeeId:id,taxYear:CURRENT_TAX_YEAR}}});
    if((openingGrossMinorUnits!==(opening?.openingGrossMinorUnits??0)||openingTaxMinorUnits!==(opening?.openingTaxMinorUnits??0)||openingReviewed!==(opening?.openingReviewed??false))&&await tx.payslip.count({where:{organisationId:session.organisationId,employeeId:id,payrollRun:{status:{in:["FINALISED","PAID"]},periodStart:{gte:new Date("2026-04-06T00:00:00Z")}}}}))throw new Error("Opening balances are locked after the first finalised run. Review corrections outside this payroll year’s opening setup.");
    const changed=await tx.employee.updateMany({where:{id,organisationId:session.organisationId,updatedAt:new Date(String(form.get("updatedAt")))},data:{payBasis,payFrequency:payFrequency as "WEEKLY"|"MONTHLY",annualSalaryMinorUnits:payBasis==="SALARIED"?annualSalaryMinorUnits:null,hourlyRateMinorUnits:payBasis==="HOURLY"?hourlyRateMinorUnits:null,currency:"GBP",contractedWeeklyHours:hours,taxCode,niCategory,niNumber:niNumber||null,studentLoanPlan:(loan||null) as "PLAN_1"|"PLAN_2"|"PLAN_4"|"PLAN_5"|"POSTGRADUATE"|null,postgraduateLoan:form.get("postgraduateLoan")==="on",pensionOptOut:form.get("pensionOptOut")==="on",bankAccountName:bankAccountName||null,bankSortCode:bankSortCode||null,bankAccountNumber:bankAccountNumber||null}});
    if(changed.count!==1)throw new Error("This employee changed in another window. Refresh before saving pay setup.");
    const data={openingGrossMinorUnits,openingTaxMinorUnits,openingReviewNote:note||null,openingReviewed};await tx.employeeTaxYearToDate.upsert({where:{employeeId_taxYear:{employeeId:id,taxYear:CURRENT_TAX_YEAR}},create:{organisationId:session.organisationId,employeeId:id,taxYear:CURRENT_TAX_YEAR,...data,grossToDateMinorUnits:openingGrossMinorUnits,taxToDateMinorUnits:openingTaxMinorUnits},update:data});
    await tx.auditEntry.create({data:{organisationId:session.organisationId,actorUserId:session.userId,action:"payroll.employee.setup",entityType:"Employee",entityId:existing.id,after:{payBasis,payFrequency,openingReviewed}}});
  },{isolationLevel:"Serializable"});
  for(const path of ["/payroll/employees","/payroll/prepare","/people/pay",`/people/${id}`])revalidatePath(path);

 });
}

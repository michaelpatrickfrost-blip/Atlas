import {describe,it,expect} from "vitest";
import {attainment,weightedAttainment} from "@/modules/kpis/domain/scorecards";
import {requiredPeople,intervalCoverage,skillsMatch} from "@/modules/scheduling/domain/coverage";
import {distributeWork,shiftCapacityHours} from "@/modules/teams/domain/capacity";
import {calculateNi} from "@/modules/payroll/domain/ni";
import {calculatePaye} from "@/modules/payroll/domain/paye";
import {calculatePayslip,calculateStudentLoan} from "@/modules/payroll/domain/payroll-run";

const instant=(time:string)=>new Date(`2026-10-12T${time}:00Z`);
const interval={startsAt:instant("09:00"),endsAt:instant("09:30"),requiredSkills:["French"]};
const shift={startsAt:instant("08:00"),endsAt:instant("17:00"),breakMinutes:0,breakStartsAt:null,skills:["French"],role:"Inbound"};
describe("weighted company results",()=>{
  it("combines mixed units only as capped attainment",()=>{expect(weightedAttainment([{actual:200,target:100,direction:"AT_LEAST",weight:1},{actual:25,target:50,direction:"AT_LEAST",weight:3}]).value).toBe(62.5);});
  it("leaves missing and inaccessible sources unscored",()=>{expect(weightedAttainment([{actual:null,target:100,direction:"AT_LEAST",weight:1},{actual:100,target:100,direction:"AT_LEAST",weight:9}])).toEqual({value:null,missing:1});expect(weightedAttainment([]).value).toBeNull();});
  it("handles maximum targets and zero limits",()=>{expect(attainment(20,10,"AT_MOST")).toBe(50);expect(attainment(0,0,"AT_MOST")).toBe(100);expect(attainment(1,0,"AT_MOST")).toBe(0);expect(attainment(0,0,"AT_LEAST")).toBe(100);});
});
describe("intraday department coverage",()=>{
  it("sizes a contact workload with occupancy and shrinkage",()=>{expect(requiredPeople({...interval,volume:100,handlingMinutes:4,shrinkagePercent:20,occupancyPercent:80,minimumPeople:1})).toBe(21);expect(requiredPeople({...interval,volume:0,handlingMinutes:4,shrinkagePercent:20,occupancyPercent:80,minimumPeople:3})).toBe(3);});
  it("requires every skill and the entire interval",()=>{expect(skillsMatch([" french ","Sales"],["FRENCH"])).toBe(true);expect(intervalCoverage([shift,{...shift,skills:[]},{...shift,startsAt:instant("09:15")},{...shift,unavailable:true}],interval).available).toBe(1);});
  it("never promises cover while an unpaid break is unplaced",()=>{expect(intervalCoverage([{...shift,breakMinutes:30}],interval)).toEqual({scheduled:1,available:0,unplacedBreaks:1});});
  it("subtracts timed breaks with exact boundary semantics",()=>{expect(intervalCoverage([{...shift,breakMinutes:30,breakStartsAt:instant("09:15")}],interval).available).toBe(0);expect(intervalCoverage([{...shift,breakMinutes:30,breakStartsAt:instant("09:30")}],interval).available).toBe(1);});
  it("does not count training/offline time or another queue",()=>{expect(intervalCoverage([{...shift,activities:[{startsAt:instant("09:00"),endsAt:instant("10:00"),kind:"TRAINING",label:"Coaching"}]}],interval).available).toBe(0);expect(intervalCoverage([shift],{...interval,role:"Outbound"}).available).toBe(0);expect(intervalCoverage([{...shift,activities:[{startsAt:instant("09:00"),endsAt:instant("10:00"),kind:"WORK",label:"Outbound"}]}],{...interval,role:"Outbound"}).available).toBe(1);});
});
describe("team workload allocation",()=>{
  it("spreads effort across working days only",()=>{expect(distributeWork(12,"2026-10-09","2026-10-13",[1,2,3,4,5])).toEqual([{day:"2026-10-09",hours:4},{day:"2026-10-12",hours:4},{day:"2026-10-13",hours:4}]);});
  it("retains a deadline on a non-working day as visible overload",()=>{expect(distributeWork(4,null,"2026-10-11",[1,2,3,4,5])).toEqual([{day:"2026-10-11",hours:4}]);expect(distributeWork(4,null,null,[1])).toEqual([]);});
});
describe("UK 2026–27 payroll calculations",()=>{
  it("uses published periodic NI thresholds and rates",()=>{expect(calculateNi({grossMinorUnits:300000,niCategory:"A",payPeriodsPerYear:12,taxYear:"2026-27"})).toMatchObject({employeeNiMinorUnits:15616,employerNiMinorUnits:38745});});
  it("supports category exemptions and rejects unknown categories",()=>{expect(calculateNi({grossMinorUnits:300000,niCategory:"C",payPeriodsPerYear:12,taxYear:"2026-27"}).employeeNiMinorUnits).toBe(0);expect(calculateNi({grossMinorUnits:300000,niCategory:"M",payPeriodsPerYear:12,taxYear:"2026-27"}).employerNiMinorUnits).toBe(0);expect(()=>calculateNi({grossMinorUnits:300000,niCategory:"Q",payPeriodsPerYear:12,taxYear:"2026-27"})).toThrow("supported");});
  it("uses reviewed prior pay and tax for cumulative PAYE",()=>{expect(calculatePaye({grossMinorUnits:300000,taxCode:"1257L",payPeriodsPerYear:12,taxYear:"2026-27",priorGrossMinorUnits:2000000,priorTaxMinorUnits:200000,taxPeriod:7}).taxMinorUnits).toBe(113350);});
  it("keeps explicit month-one codes non-cumulative",()=>{expect(calculatePaye({grossMinorUnits:300000,taxCode:"1257L M1",payPeriodsPerYear:12,taxYear:"2026-27",priorGrossMinorUnits:2000000,priorTaxMinorUnits:200000,taxPeriod:7}).taxMinorUnits).toBe(39050);expect(()=>calculatePaye({grossMinorUnits:300000,taxCode:"S1257L",payPeriodsPerYear:12,taxYear:"2026-27"})).toThrow("Unsupported");});
  it("uses new student-loan thresholds and whole-pound deductions",()=>{expect(calculateStudentLoan({grossMinorUnits:300000,plan:"PLAN_1",payPeriodsPerYear:12,taxYear:"2026-27"})).toBe(6800);expect(calculateStudentLoan({grossMinorUnits:300000,plan:"PLAN_5",payPeriodsPerYear:12,taxYear:"2026-27"})).toBe(8200);});
  it("pays approved hourly work once, adding only the overtime premium",()=>{const result=calculatePayslip({annualSalaryMinorUnits:null,currency:"GBP",taxCode:"NT",niCategory:"A",studentLoanPlan:null,pensionOptOut:true,payFrequency:"WEEKLY",taxYear:"2026-27",employeePensionPercent:5,employerPensionPercent:3,confirmedShiftHours:45,standardWeeklyHours:37.5,overtimeMultiplier:1.5,unpaidDaysInPeriod:0,statutoryPayMinorUnits:0,manualAdjustmentMinorUnits:0,periodStart:new Date("2026-10-12"),periodEnd:new Date("2026-10-19"),payBasis:"HOURLY",hourlyRateMinorUnits:1500});expect(result.grossMinorUnits).toBe(67500);expect(result.overtimeHours).toBe(7.5);expect(result.overtimeMinorUnits).toBe(5625);});
});

describe("rota-backed team capacity",()=>{
  it("deducts training and a break as a union",()=>{expect(shiftCapacityHours({startsAt:instant("09:00"),endsAt:instant("17:00"),breakMinutes:30,breakStartsAt:instant("12:00"),activities:[{kind:"TRAINING",startsAt:instant("12:00"),endsAt:instant("13:00")}]},instant("00:00"),new Date("2026-10-13T00:00:00Z"))).toBe(7);});
  it("keeps work activities within capacity and bounds non-work to the day",()=>{expect(shiftCapacityHours({startsAt:instant("09:00"),endsAt:instant("17:00"),breakMinutes:0,breakStartsAt:null,activities:[{kind:"WORK",startsAt:instant("09:00"),endsAt:instant("12:00")},{kind:"MEETING",startsAt:instant("16:00"),endsAt:instant("17:00")}]},instant("09:00"),instant("16:30"))).toBe(7);});
});

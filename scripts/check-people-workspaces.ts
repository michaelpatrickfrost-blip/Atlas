/** Explicit central Test-company acceptance; existing identities and records are untouched. */
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {mkdirSync} from "node:fs";
import jwt from "jsonwebtoken";
import {chromium,expect,type Page} from "@playwright/test";
import {db} from "../src/core/db/client";
import {sessionForUser} from "../src/core/auth/session";
import {loadScorecards} from "../src/modules/kpis/services/scorecards";
import {kpisAnalytics} from "../src/modules/kpis/services/analytics";
import {loadCapacity} from "../src/modules/teams/services/capacity";
import * as workforce from "../src/modules/scheduling/services/workforce";
import {preparePayroll} from "../src/modules/payroll/services/preparation";
import * as payroll from "../src/modules/payroll/services/commands";

const form=(values:Record<string,string|number>)=>{const data=new FormData();for(const [key,value] of Object.entries(values))data.set(key,String(value));return data;};
async function main() {
  assert(process.platform==="linux"&&process.env.ATLAS_PEOPLE_TEST==="1","Explicit central server Test acceptance required");
  const base=process.env.ATLAS_PEOPLE_TEST_URL??"https://atlassystem.online";
  assert(base==="https://atlassystem.online"||/^http:\/\/127\.0\.0\.1:\d+$/.test(base));
  assert(process.env.SESSION_SECRET&&process.env.ATLAS_GUARDIAN_USER_ID);
  const qa=await db.user.findUniqueOrThrow({where:{id:process.env.ATLAS_GUARDIAN_USER_ID},include:{platformAdmin:true}});
  assert(qa.platformAdmin?.active,"Existing authorised QA staff required");
  const suffix=randomUUID().slice(0,8),evidence=process.env.ATLAS_PEOPLE_EVIDENCE;
  if(evidence)mkdirSync(evidence,{recursive:true,mode:0o700});
  const company=await db.organisation.create({data:{name:`People acceptance ${suffix}`,slug:`people-check-${suffix}`,isTest:true}});
  const foreign=await db.organisation.create({data:{name:`People boundary ${suffix}`,slug:`people-boundary-${suffix}`,isTest:true}});
  const userIds:string[]=[],browser=await chromium.launch({headless:true});
  const errors:string[]=[];
  try {
    const caps=["core.profile.self","people.employee.read","people.employee.manage","people.rota.manage","people.team.manage","people.timesheet.manage","scheduling.read","scheduling.manage","teams.read","teams.manage","kpis.read","kpis.manage","payroll.run.read","payroll.run.manage","payroll.employee.manage","payroll.settings.manage","analytics.dashboard.read","analytics.dashboard.manage"];
    async function actor(label:string,organisationId:string,capabilities:string[]) {
      const user=await db.user.create({data:{name:`${label} ${suffix}`,email:`${label.toLowerCase()}-${suffix}@example.test`,passwordHash:"!no-password-acceptance-only"}});userIds.push(user.id);
      const membership=await db.membership.create({data:{organisationId,userId:user.id,grantedCapabilities:capabilities}});
      const session=await sessionForUser(organisationId,user.id);assert(session);
      const context=await browser.newContext({baseURL:base,locale:"en-GB"});
      await context.addCookies([{name:"atlas_session",value:jwt.sign({userId:user.id,organisationId,authVersion:user.authVersion,sessionVersion:membership.sessionVersion},process.env.SESSION_SECRET!,{algorithm:"HS256",expiresIn:"30m"}),url:base,secure:base.startsWith("https"),httpOnly:true,sameSite:"Lax"}]);
      const page=await context.newPage();page.setDefaultTimeout(15000);page.on("pageerror",error=>errors.push(error.message));page.on("response",response=>{if(response.url().includes("/_next/")&&response.status()>=400)errors.push(`Asset ${response.status()}`);});
      return {user,membership,session,context,page};
    }
    const manager=await actor("Manager",company.id,caps),member=await actor("Member",company.id,["core.profile.self","teams.read","scheduling.read","kpis.read"]),outsider=await actor("Boundary",foreign.id,caps);
    for(const organisationId of [company.id,foreign.id])await db.moduleState.createMany({data:["people","scheduling","teams","kpis","payroll","analytics"].map(moduleId=>({organisationId,moduleId,enabled:true,entitled:true}))});
    const employee=await db.employee.create({data:{organisationId:company.id,userId:manager.user.id,employeeNumber:`M-${suffix}`,firstName:"Alex",lastName:"Manager",email:manager.user.email,jobTitle:"Operations lead",department:"Contact centre",status:"ACTIVE",startDate:new Date("2026-04-06"),workingDays:[1,2,3,4,5],contractedWeeklyHours:40,payFrequency:"WEEKLY",payBasis:"HOURLY",hourlyRateMinorUnits:1500,taxCode:"1257L M1",skills:["French","Inbound calls"]}});
    const staff=await db.employee.create({data:{organisationId:company.id,userId:member.user.id,employeeNumber:`S-${suffix}`,firstName:"Jamie",lastName:"Adviser",email:member.user.email,jobTitle:"Customer adviser",department:"Contact centre",status:"ACTIVE",startDate:new Date("2026-04-06"),managerId:employee.id,workingDays:[1,2,3,4,5],contractedWeeklyHours:37.5,skills:["French","Inbound calls"]}});
    const wrongSkills=await db.employee.create({data:{organisationId:company.id,employeeNumber:`N-${suffix}`,firstName:"Morgan",lastName:"Trainee",email:`trainee-${suffix}@example.test`,jobTitle:"Trainee",department:"Contact centre",status:"ACTIVE",startDate:new Date("2026-04-06"),workingDays:[1,2,3,4,5],skills:["English"]}});
    const team=await db.plannerTeam.create({data:{organisationId:company.id,name:"Customer operations",createdByUserId:manager.user.id,members:{create:[{organisationId:company.id,employeeId:employee.id,lead:true},{organisationId:company.id,employeeId:staff.id}]}}});
    const goal=await db.kpi.create({data:{organisationId:company.id,name:"Customer response target",teamName:"Contact centre",ownerUserId:manager.user.id,target:100,current:80,startsAt:new Date("2026-10-01"),endsAt:new Date("2026-10-31")}});
    await db.kpi.create({data:{organisationId:company.id,name:"Private development evidence",teamName:"Contact centre",ownerUserId:manager.user.id,target:10,current:8,visibility:"PRIVATE",startsAt:new Date("2026-10-01"),endsAt:new Date("2026-10-31")}});
    const page=manager.page;
    async function visit(path:string,title?:string,target:Page=page) {const response=await target.goto(path,{waitUntil:"networkidle"});assert.equal(response?.status(),200,path);if(title)await expect(target.getByRole("heading",{name:title,exact:true}).first()).toBeVisible();}
    await visit("/kpis/scorecards","Strategy scorecards");
    await expect(page.getByText("Private development evidence",{exact:true})).toHaveCount(0);
    const score=page.locator('form').filter({has:page.locator('input[name="title"]')});
    await score.locator('[name="title"]').fill("Operations strategy");await score.locator(`input[name="goalId"][value="${goal.id}"]`).check();await score.getByRole("button",{name:"Create scorecard",exact:true}).click();
    await expect.poll(()=>db.kpiScorecard.count({where:{organisationId:company.id,title:"Operations strategy"}})).toBe(1);
    await page.reload({waitUntil:"networkidle"});await expect(page.getByRole("heading",{name:"Operations strategy",exact:true})).toBeVisible();
    assert.equal((await loadScorecards(manager.session))[0].value,80);
    await db.kpi.update({where:{id:goal.id},data:{current:90}});
    const metric=kpisAnalytics.find(item=>item.id==="kpis.attainment");assert(metric);assert.equal((await metric.query(manager.session,new Date("2026-10-01")))[0].value,90);
    assert.equal((await loadScorecards(outsider.session)).length,0);
    await visit("/analytics?new=1");await page.getByLabel("Dashboard name",{exact:true}).fill("People performance");await page.getByLabel("App",{exact:true}).selectOption("Goals & KPIs");await page.getByLabel("What to show",{exact:true}).selectOption("kpis.attainment");await page.getByLabel("Chart to add",{exact:true}).selectOption("table");await page.getByRole("button",{name:"Add",exact:true}).click();await page.getByRole("button",{name:"Save dashboard",exact:true}).click();await expect.poll(()=>db.dashboard.count({where:{organisationId:company.id,userId:manager.user.id,name:"Analytics · People performance"}})).toBe(1);await page.reload({waitUntil:"networkidle"});await expect(page.getByRole("heading",{name:"Scorecard attainment",exact:true})).toBeVisible();await expect(page.getByText("Operations strategy",{exact:true})).toBeVisible();const dashboard=await db.dashboard.findFirstOrThrow({where:{organisationId:company.id,name:"Analytics · People performance"}});assert(dashboard.widgets.some(widget=>widget.includes("kpis.attainment")));await expect(page.getByRole("cell",{name:"90%",exact:true})).toBeVisible();await db.kpi.update({where:{id:goal.id},data:{current:95}});await page.reload({waitUntil:"networkidle"});await expect(page.getByRole("cell",{name:"95%",exact:true})).toBeVisible();

    console.log("PASS persisted weighted scorecards, saved dashboard UI, changing actuals reach Analytics, personal goals excluded and cross-company reads empty");

    await visit("/payroll/employees","Employee pay setup");
    const payDetails=page.locator('details').filter({has:page.locator(`input[name="employeeId"][value="${employee.id}"]`)}).first();await payDetails.locator('summary').first().click();
    const setup=payDetails.locator('form');await setup.locator('[name="openingReviewNote"]').fill("Synthetic acceptance: verified no prior pay, NI A, pension setup reviewed.");await setup.locator('[name="openingReviewed"]').check();await setup.getByRole("button",{name:"Save employee pay setup",exact:true}).click();
    await expect.poll(()=>db.employeeTaxYearToDate.count({where:{organisationId:company.id,employeeId:employee.id,openingReviewed:true}})).toBe(1);
    const time=await db.timesheet.create({data:{organisationId:company.id,employeeId:employee.id,weekStart:new Date("2026-10-12"),status:"APPROVED",reviewedByUserId:manager.user.id,entries:{create:[1,2,3,4,5].map(offset=>({organisationId:company.id,workedOn:new Date(`2026-10-${11+offset}`),minutes:540}))}},include:{entries:true}});
    const prepared=await preparePayroll(manager.session,"2026-10-12","2026-10-18","WEEKLY");assert.equal(prepared.issues,0);assert.equal(prepared.approvedHours,45);assert.equal(prepared.rows[0].result?.grossMinorUnits,67500);assert.equal(prepared.rows[0].result?.overtimeMinorUnits,3750);
    await visit("/payroll/prepare?start=2026-10-12&end=2026-10-18&frequency=WEEKLY","Prepare payroll");
    const draft=page.locator('form').filter({has:page.locator('input[name="inputDigest"]')});await draft.locator('[name="reviewed"]').check();await draft.getByRole("button",{name:"Generate draft payslips",exact:true}).click();await expect(page).toHaveURL(new RegExp(`${base}/payroll/[^/?]+$`));
    const run=await db.payrollRun.findFirstOrThrow({where:{organisationId:company.id},include:{payslips:true}});assert.equal(run.status,"DRAFT");assert.match(JSON.stringify(run.inputSnapshot),/atlas-uk-2026-27-v2/);assert.equal(run.payslips[0].approvedHours,45);assert.equal((await db.employeeTaxYearToDate.findFirstOrThrow({where:{employeeId:employee.id}})).grossToDateMinorUnits,0);
    await assert.rejects(payroll.markPayrollRunPaid(manager.session,run.id));
    await db.timesheetEntry.update({where:{id:time.entries[0].id},data:{minutes:600}});
    await assert.rejects(payroll.finalisePayrollRun(manager.session,run.id,form({reviewed:"on"})),/changed/);
    assert.equal((await db.payrollRun.findUniqueOrThrow({where:{id:run.id}})).status,"DRAFT");
    await assert.rejects(payroll.finalisePayrollRun(outsider.session,run.id,form({reviewed:"on"})));
    await visit(`/payroll/prepare?run=${run.id}`,"Prepare payroll");
    const refresh=page.locator('form').filter({has:page.locator('input[name="inputDigest"]')});await refresh.locator('[name="reviewed"]').check();await refresh.getByRole("button",{name:"Refresh draft payslips",exact:true}).click();await expect(page).toHaveURL(`${base}/payroll/${run.id}`);
    const finalForm=page.locator('form').filter({has:page.getByRole("button",{name:"Finalise run",exact:true})});await finalForm.locator('[name="reviewed"]').check();await finalForm.getByRole("button",{name:"Finalise run",exact:true}).click();
    await expect.poll(async()=>(await db.payrollRun.findUniqueOrThrow({where:{id:run.id}})).status).toBe("FINALISED");
    const ytd=await db.employeeTaxYearToDate.findFirstOrThrow({where:{employeeId:employee.id}});assert.equal(ytd.grossToDateMinorUnits,73500);
    await assert.rejects(payroll.finalisePayrollRun(manager.session,run.id,form({reviewed:"on"})));
    await page.reload({waitUntil:"networkidle"});await page.getByRole("button",{name:"Mark as paid",exact:true}).click();await expect.poll(async()=>(await db.payrollRun.findUniqueOrThrow({where:{id:run.id}})).status).toBe("PAID");
    await assert.rejects(payroll.markPayrollRunPaid(manager.session,run.id));
    const current=await preparePayroll(manager.session,"2026-10-12","2026-10-18","WEEKLY");await assert.rejects(payroll.createPayrollRun(manager.session,form({periodLabel:"Duplicate",periodStart:"2026-10-12",periodEnd:"2026-10-18",payFrequency:"WEEKLY",reviewed:"on",inputDigest:current.inputDigest})),/already covers/);
    assert.equal((await db.employeeTaxYearToDate.findFirstOrThrow({where:{employeeId:employee.id}})).grossToDateMinorUnits,ytd.grossToDateMinorUnits);
    await assert.rejects(preparePayroll(member.session,"2026-10-12","2026-10-18","WEEKLY"),/FORBIDDEN/);
    console.log("PASS real pay setup/draft/refresh/finalise/paid UI; approved hourly time and overtime; no draft YTD; stale-input, duplicate/state/access/tenant guards and exactly-once YTD");

    const day="2026-10-12",path=`/scheduling/workforce?day=${day}&department=Contact%20centre`;
    await visit(path,"Coverage & open shifts");await page.getByText("Create an open shift",{exact:true}).click();
    const openingForm=page.locator('form').filter({has:page.locator('input[name="role"][required]')});
    await openingForm.locator('[name="day"]').fill(day);await openingForm.locator('[name="startTime"]').fill("09:00");await openingForm.locator('[name="endTime"]').fill("17:00");await openingForm.locator('[name="role"]').fill("Inbound calls");await openingForm.locator('[name="skills"]').fill("French");await openingForm.locator('[name="breakMinutes"]').fill("30");await openingForm.locator('[name="breakTime"]').fill("12:00");await openingForm.getByRole("button",{name:"Create open shift",exact:true}).click();
    await expect.poll(()=>db.openRotaShift.count({where:{organisationId:company.id}})).toBe(1);
    const opening=await db.openRotaShift.findFirstOrThrow({where:{organisationId:company.id}});
    await assert.rejects(workforce.decideOpening(manager.session,form({openingId:opening.id,employeeId:wrongSkills.id})),/required skill/);
    await assert.rejects(workforce.decideOpening(outsider.session,form({openingId:opening.id,employeeId:staff.id})));
    await visit(path,undefined,member.page);await member.page.getByRole("button",{name:"Request shift",exact:true}).click();await expect.poll(()=>db.openShiftRequest.count({where:{openingId:opening.id,status:"PENDING"}})).toBe(1);
    await page.reload({waitUntil:"networkidle"});const assign=page.locator('form').filter({has:page.getByRole("button",{name:"Assign & publish",exact:true})});await assign.locator('[name="employeeId"]').selectOption(staff.id);await assign.getByRole("button",{name:"Assign & publish",exact:true}).click();await expect.poll(async()=>(await db.openRotaShift.findUniqueOrThrow({where:{id:opening.id}})).status).toBe("ASSIGNED");
    assert.equal(await db.rotaShift.count({where:{organisationId:company.id,employeeId:staff.id,status:"CONFIRMED"}}),1);assert.equal((await db.openShiftRequest.findFirstOrThrow({where:{openingId:opening.id}})).status,"APPROVED");
    await assert.rejects(workforce.decideOpening(manager.session,form({openingId:opening.id,employeeId:staff.id})));
    for(const [startTime,endTime,label] of [["09:00","09:30","Morning queue"],["12:00","12:30","Lunch queue"]])await workforce.saveInterval(manager.session,form({department:"Contact centre",day,startTime,endTime,label,role:"Inbound calls",skills:"French",volume:3,handlingMinutes:4,shrinkagePercent:20,occupancyPercent:85,minimumPeople:1}));
    let coverage=await workforce.loadWorkforce(manager.session,day,"Contact centre");assert.equal(coverage.cover[0].published,1);assert.equal(coverage.cover[1].published,0);
    const shift=coverage.shifts[0];await workforce.saveActivity(manager.session,form({shiftId:shift.id,day,startTime:"09:00",endTime:"09:30",kind:"TRAINING",label:"Coaching"}));coverage=await workforce.loadWorkforce(manager.session,day,"Contact centre");assert.equal(coverage.cover[0].published,0);
    await workforce.saveAvailability(member.session,form({day,startTime:"15:00",endTime:"16:00",note:"Synthetic unavailable interval"}));await workforce.createOpening(manager.session,form({department:"Contact centre",day,startTime:"15:00",endTime:"16:00",role:"Inbound calls",skills:"French",breakMinutes:0}));const blocked=await db.openRotaShift.findFirstOrThrow({where:{organisationId:company.id,status:"OPEN"}});await assert.rejects(workforce.requestOpening(member.session,form({openingId:blocked.id})),/unavailable/);
    await workforce.createOpening(manager.session,form({department:"Contact centre",day:"2026-10-13",startTime:"09:00",endTime:"17:00",role:"Inbound calls",skills:"French",breakMinutes:0}));const race=await db.openRotaShift.findFirstOrThrow({where:{organisationId:company.id,status:"OPEN",startsAt:{gt:new Date("2026-10-13")}}});const claims=await Promise.allSettled([workforce.decideOpening(manager.session,form({openingId:race.id,employeeId:employee.id})),workforce.decideOpening(manager.session,form({openingId:race.id,employeeId:employee.id}))]);assert.equal(claims.filter(result=>result.status==="fulfilled").length,1);assert.equal(await db.rotaShift.count({where:{organisationId:company.id,employeeId:employee.id,startsAt:race.startsAt}}),1);
    console.log("PASS real open-shift request/assignment UI, canonical published shift, breaks and activities affect coverage; skills/tenant/availability/repeated and concurrent assignment guards");

    await visit(`/teams/${team.id}/capacity?day=${day}`,team.name);await expect(page.getByText("Plan new work",{exact:true})).toBeVisible();
    const work=page.locator('form').filter({has:page.locator('input[name="title"]')});await work.locator('[name="title"]').fill("Prepare customer handover");await work.locator('[name="assigneeEmployeeId"]').selectOption(staff.id);await work.locator('[name="startsOn"]').fill(day);await work.locator('[name="dueOn"]').fill("2026-10-16");await work.locator('[name="estimatedHours"]').fill("10");await work.locator('[name="goalId"]').selectOption(goal.id);await work.getByRole("button",{name:"Add work",exact:true}).click();await expect.poll(()=>db.plannerTask.count({where:{organisationId:company.id,title:"Prepare customer handover"}})).toBe(1);
    const task=await db.plannerTask.findFirstOrThrow({where:{organisationId:company.id,title:"Prepare customer handover"}});await page.reload({waitUntil:"networkidle"});let capacity=await loadCapacity(manager.session,team.id,day);assert.equal(capacity.people.find(person=>person.id===staff.id)?.planned,10);assert.equal(capacity.people.find(person=>person.id===staff.id)?.cells[0].capacity,0);
    const article=page.locator('article').filter({has:page.getByRole("heading",{name:task.title,exact:true})});const status=article.locator('form').filter({has:page.locator('select[name="status"]')});await status.locator('[name="status"]').selectOption("DOING");await status.getByRole("button",{name:"Update",exact:true}).click();await expect.poll(async()=>(await db.plannerTask.findUniqueOrThrow({where:{id:task.id}})).status).toBe("DOING");
    await page.reload({waitUntil:"networkidle"});await article.getByText("Edit plan / reassign",{exact:true}).click();const edit=article.locator('form').filter({has:page.locator('input[name="title"]')});await edit.locator('[name="assigneeEmployeeId"]').selectOption(employee.id);await edit.getByRole("button",{name:"Save work",exact:true}).click();await expect.poll(async()=>(await db.plannerTask.findUniqueOrThrow({where:{id:task.id}})).assigneeEmployeeId).toBe(employee.id);
    await page.reload({waitUntil:"networkidle"});const stale=article.locator('form').filter({has:page.locator('select[name="status"]')});await stale.locator('[name="version"]').evaluate((node:HTMLInputElement)=>{node.value="0";});await stale.locator('[name="status"]').selectOption("DONE");await stale.getByRole("button",{name:"Update",exact:true}).click();await expect(stale.getByRole("alert")).toContainText("changed");assert.equal((await db.plannerTask.findUniqueOrThrow({where:{id:task.id}})).status,"DOING");
    capacity=await loadCapacity(manager.session,team.id,day);assert.equal(capacity.people.find(person=>person.id===staff.id)?.planned,0);assert.equal(capacity.people.find(person=>person.id===employee.id)?.planned,10);await assert.rejects(loadCapacity(outsider.session,team.id,day));
    await visit(`/teams/${team.id}/capacity?day=${day}`,undefined,member.page);const memberCard=member.page.locator('article').filter({has:member.page.getByRole("heading",{name:task.title,exact:true})});await expect(memberCard.getByText("Edit plan / reassign",{exact:true})).toHaveCount(0);await expect(memberCard.locator('select[name="status"]')).toHaveCount(0);
    console.log("PASS real effort/goal-linked allocation, status and reassignment UI; weekly rota/availability capacity, persisted reloads and member/tenant boundaries");
    for(const width of [1440,390]) {
      await page.setViewportSize({width,height:900});
      for(const [path,title,label] of [["/kpis/scorecards","Strategy scorecards","goals"],["/people/workspace",undefined,"hr"],["/people/organisation",undefined,"organisation"],["/people/pay",undefined,"pay-time"],["/payroll/prepare?start=2026-10-12&end=2026-10-18&frequency=WEEKLY","Prepare payroll","payroll"],[`/scheduling/workforce?day=${day}&department=Contact%20centre`,"Coverage & open shifts","rota"],[`/teams/${team.id}/capacity?day=${day}`,team.name,"teams"]] as const) {
        await visit(path,title);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Viewport overflow ${path} ${width}`);if(evidence)await page.screenshot({path:`${evidence}/${label}-${width}.png`,fullPage:true});
      }
    }
    assert.equal(errors.length,0,errors.join("\n"));console.log("PASS desktop/phone layouts for all People workspaces; zero browser/asset errors");
  } finally {
    await browser.close();
    await db.membership.updateMany({where:{organisationId:{in:[company.id,foreign.id]}},data:{active:false,sessionVersion:{increment:1}}});
    await db.user.updateMany({where:{id:{in:userIds}},data:{authVersion:{increment:1}}});
    await db.organisation.updateMany({where:{id:{in:[company.id,foreign.id]}},data:{status:"SUSPENDED"}});
    await db.$disconnect();console.log("Synthetic central Test companies suspended, sessions revoked; workflow history retained.");
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});

import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { getModule } from "@/core/modules/registry";
import { enabledModulesForSession } from "@/core/modules/runtime";
import { dateOnly, addDays, mondayOf } from "@/modules/people/domain/working-time";
import { londonDate, londonInstant, paidMinutes } from "../domain/time";
import { STANDARD_WORK_TYPES, WORK_CATEGORIES, datesForWeekdays, eachDate, holidayBlockReason, monthDates, monthKey, patternPaidMinutes, requiredManMinutes, weekdayOf, type WorkCategory } from "../domain/planner";

type Tx = typeof db;

async function roster(session: Session) {
  const provider = getModule("people")?.staffRosterProvider;
  if (!provider) throw new Error("HR roster connection is unavailable.");
  return provider(session, true);
}

function assertManage(session: Session) {
  if (!can(session, "scheduling.manage") && !can(session, "people.rota.manage")) throw new Error("FORBIDDEN: people planning is not granted.");
}

async function teamIdsFor(tx: Tx, organisationId: string, userIds: string[]) {
  const ids = userIds.filter(Boolean);
  if (!ids.length) return new Map<string, string[]>();
  const rows = await tx.workTeamMember.findMany({ where: { membership: { organisationId, userId: { in: ids } } }, select: { teamId: true, membership: { select: { userId: true } } } });
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.membership.userId) ?? [];
    list.push(row.teamId);
    map.set(row.membership.userId, list);
  }
  return map;
}

export async function assertHolidayAllowed(organisationId: string, employeeId: string, start: Date, end: Date, tx: Tx = db) {
  const employee = await tx.employee.findFirstOrThrow({ where: { id: employeeId, organisationId }, select: { id: true, department: true, userId: true, workingDays: true } });
  const days = eachDate(start, end).filter((day) => employee.workingDays.includes(weekdayOf(day)));
  if (!days.length) return;
  const rules = await tx.schedulingCalendarRule.findMany({ where: { organisationId, startsOn: { lte: end }, endsOn: { gte: start } }, take: 100 });
  if (!rules.length) return;
  const membershipTeams = await teamIdsFor(tx, organisationId, employee.userId ? [employee.userId] : []);
  let teamIds = employee.userId ? membershipTeams.get(employee.userId) ?? [] : [];
  if (!teamIds.length && employee.department) {
    const groups = await tx.workTeam.findMany({ where: { organisationId, departments: { has: employee.department } }, select: { id: true }, take: 50 });
    teamIds = groups.map((group) => group.id);
  }
  const others = await tx.absenceRecord.findMany({
    where: { organisationId, type: "HOLIDAY", status: { in: ["PENDING", "APPROVED"] }, employeeId: { not: employeeId }, startDate: { lte: end }, endDate: { gte: start } },
    select: { employeeId: true, startDate: true, endDate: true, employee: { select: { department: true, userId: true, workingDays: true } } },
    take: 2000,
  });
  const otherTeams = await teamIdsFor(tx, organisationId, others.flatMap((row) => row.employee.userId ? [row.employee.userId] : []));
  const reason = holidayBlockReason(
    { id: employee.id, department: employee.department, teamIds, days },
    others.map((row) => ({
      id: row.employeeId,
      department: row.employee.department,
      teamIds: row.employee.userId ? otherTeams.get(row.employee.userId) ?? [] : [],
      days: eachDate(row.startDate, row.endDate).filter((day) => row.employee.workingDays.includes(weekdayOf(day))),
    })),
    rules.map((rule) => ({ name: rule.name, startsOn: rule.startsOn.toISOString().slice(0, 10), endsOn: rule.endsOn.toISOString().slice(0, 10), teamId: rule.teamId, department: rule.department, maxOffPerDay: rule.maxOffPerDay, blockHolidays: rule.blockHolidays })),
  );
  if (reason) throw new Error(reason);
}

async function ensurePatterns(organisationId: string) {
  const count = await db.schedulingWorkType.count({ where: { organisationId } });
  if (count) return;
  await db.schedulingWorkType.createMany({ data: STANDARD_WORK_TYPES.map((pattern) => ({ ...pattern, organisationId })), skipDuplicates: true });
}

export async function loadTeamPlan(session: Session, monthInput: string, teamId = "", search = "", department = "", own = false) {
  const manage = !own && (can(session, "scheduling.manage") || can(session, "people.rota.manage"));
  const provider = getModule("people")?.staffRosterProvider;
  if (!provider) throw new Error("HR roster connection is unavailable.");
  if (manage) await ensurePatterns(session.organisationId);
  const month = monthKey(monthInput);
  const days = monthDates(month);
  const rangeStart = dateOnly(days[0]);
  const rangeEnd = addDays(dateOnly(days[days.length - 1]), 1);
  const allEmployees = await provider(session, manage);
  const teams = await db.workTeam.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, departments: true, members: { select: { membership: { select: { userId: true } } } } }, orderBy: { name: "asc" }, take: 100 });
  const membership = new Map<string, string[]>();
  for (const team of teams) for (const member of team.members) {
    const list = membership.get(member.membership.userId) ?? [];
    list.push(team.id);
    membership.set(member.membership.userId, list);
  }
  const withTeams = allEmployees.map((employee) => {
    const memberOf = employee.userId ? membership.get(employee.userId) ?? [] : [];
    const teamIds = memberOf.length ? memberOf : teams.filter((team) => employee.department && team.departments.includes(employee.department)).map((team) => team.id);
    return { ...employee, teamIds };
  });
  const q = search.trim().toLowerCase().slice(0, 100);
  const filtered = withTeams.filter((employee) => (!teamId || employee.teamIds.includes(teamId)) && (!department || employee.department === department) && (!q || `${employee.firstName} ${employee.lastName} ${employee.jobTitle}`.toLowerCase().includes(q)));
  const employees = filtered.slice(0, 120);
  const scopeIds = (teamId || department || q ? filtered : withTeams).map((employee) => employee.id);
  const displayIds = employees.map((employee) => employee.id);
  const [workTypes, shifts, absences, demands, rules, organisation] = await Promise.all([
    db.schedulingWorkType.findMany({ where: { organisationId: session.organisationId, active: true }, orderBy: { name: "asc" }, take: 80 }),
    db.rotaShift.findMany({ where: { organisationId: session.organisationId, employeeId: { in: displayIds }, startsAt: { gte: londonInstant(days[0], "00:00"), lt: londonInstant(rangeEnd.toISOString().slice(0, 10), "00:00") }, status: manage ? { not: "CANCELLED" } : "CONFIRMED" }, include: { workType: { select: { name: true, category: true } }, team: { select: { name: true } }, tasks: true }, orderBy: { startsAt: "asc" }, take: 4000 }),
    db.absenceRecord.findMany({ where: { organisationId: session.organisationId, employeeId: { in: displayIds }, status: { in: ["APPROVED", "PENDING"] }, startDate: { lt: rangeEnd }, endDate: { gte: rangeStart } }, select: { employeeId: true, type: true, status: true, startDate: true, endDate: true }, take: 2000 }),
    manage ? db.schedulingDemand.findMany({ where: { organisationId: session.organisationId, demandDate: { gte: rangeStart, lt: rangeEnd }, ...(teamId || department ? { AND: [...(teamId ? [{ OR: [{ teamId }, { teamId: "" }] }] : []), ...(department ? [{ OR: [{ department }, { department: "" }] }] : [])] } : {}) }, take: 2000 }) : Promise.resolve([]),
    db.schedulingCalendarRule.findMany({ where: { organisationId: session.organisationId, startsOn: { lte: dateOnly(days[days.length - 1]) }, endsOn: { gte: rangeStart } }, orderBy: { startsOn: "asc" }, take: 50 }),
    db.organisation.findUniqueOrThrow({ where: { id: session.organisationId }, select: { hrStandardWeeklyHours: true } }),
  ]);
  const enabled = await enabledModulesForSession(session);
  const traffic = new Map<string, { salesOrders: number; productionUnits: number }>();
  if (manage && enabled.has("sales") && can(session, "sales.order.read")) {
    const orders = await db.salesOrder.findMany({ where: { organisationId: session.organisationId, commercialStatus: { not: "CANCELLED" }, requestedDeliveryDate: { gte: rangeStart, lt: rangeEnd } }, select: { requestedDeliveryDate: true }, take: 5000 });
    for (const order of orders) {
      if (!order.requestedDeliveryDate) continue;
      const day = order.requestedDeliveryDate.toISOString().slice(0, 10);
      const row = traffic.get(day) ?? { salesOrders: 0, productionUnits: 0 };
      row.salesOrders += 1;
      traffic.set(day, row);
    }
  }
  if (manage && enabled.has("manufacturing") && can(session, "manufacturing.order.read")) {
    const forecasts = await db.manufacturingDemandForecast.findMany({ where: { organisationId: session.organisationId, periodStart: { gte: rangeStart, lt: rangeEnd } }, select: { periodStart: true, quantity: true }, take: 2000 });
    for (const forecast of forecasts) {
      const day = forecast.periodStart.toISOString().slice(0, 10);
      const row = traffic.get(day) ?? { salesOrders: 0, productionUnits: 0 };
      row.productionUnits += Number(forecast.quantity);
      traffic.set(day, row);
    }
  }
  const mondays = days.filter((day) => weekdayOf(day) === 1);
  const budgets = manage ? await db.schedulingHoursBudget.findMany({ where: { organisationId: session.organisationId, managerUserId: session.userId, weekStart: { in: mondays.map((day) => dateOnly(day)) }, department: department || "" } }) : [];
  return {
    manage, month, days, employees, total: filtered.length, scopeCount: scopeIds.length, standardHours: organisation.hrStandardWeeklyHours,
    departments: [...new Set(allEmployees.map((employee) => employee.department).filter((value): value is string => Boolean(value)))].sort(),
    teams: teams.map((team) => ({ id: team.id, name: team.name, departments: team.departments })),
    workTypes, shifts, absences, demands, rules, budgets,
    traffic: [...traffic.entries()].map(([day, value]) => ({ day, ...value })),
  };
}

function text(form: FormData, key: string, max: number) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

export async function saveWorkPattern(session: Session, form: FormData) {
  assertManage(session);
  const name = text(form, "name", 80);
  const category = text(form, "category", 20) as WorkCategory;
  const startTime = text(form, "startTime", 5);
  const endTime = text(form, "endTime", 5);
  const breakMinutes = Number(form.get("breakMinutes") ?? 0);
  const weekdays = [...new Set(form.getAll("weekdays").map(Number))];
  const teamId = text(form, "teamId", 40) || null;
  if (!name) throw new Error("Name the work pattern.");
  if (!WORK_CATEGORIES.includes(category)) throw new Error("Choose a type of work.");
  if (!weekdays.length || weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error("Choose the days this pattern runs.");
  patternPaidMinutes(startTime, endTime, breakMinutes);
  if (teamId) await db.workTeam.findFirstOrThrow({ where: { id: teamId, organisationId: session.organisationId } });
  const id = text(form, "id", 40);
  if (id) {
    await db.schedulingWorkType.update({ where: { id, organisationId: session.organisationId }, data: { name, category, startTime, endTime, breakMinutes, weekdays, teamId } });
    return id;
  }
  const created = await db.schedulingWorkType.create({ data: { organisationId: session.organisationId, name, category, startTime, endTime, breakMinutes, weekdays, teamId } });
  return created.id;
}

export async function retireWorkPattern(session: Session, id: string) {
  assertManage(session);
  await db.schedulingWorkType.update({ where: { id, organisationId: session.organisationId }, data: { active: false } });
}

export async function savePeopleDemand(session: Session, form: FormData) {
  assertManage(session);
  const month = monthKey(text(form, "month", 7));
  const weekdays = form.getAll("weekdays").map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  const days = text(form, "span", 10) === "month" ? datesForWeekdays(monthDates(month), weekdays.length ? weekdays : [1, 2, 3, 4, 5]) : [text(form, "day", 10)];
  if (!days.length || days.some((day) => !monthDates(month).includes(day))) throw new Error("Choose days inside this month.");
  if (days.length > 31) throw new Error("Save one month at a time.");
  const teamId = text(form, "teamId", 40);
  const department = text(form, "department", 80);
  const workTypeId = text(form, "workTypeId", 40);
  const label = text(form, "label", 80);
  const volumeUnit = text(form, "volumeUnit", 40) || "contacts";
  const mode = text(form, "mode", 20) === "hours" ? "hours" : "traffic";
  if (teamId) await db.workTeam.findFirstOrThrow({ where: { id: teamId, organisationId: session.organisationId } });
  if (workTypeId) await db.schedulingWorkType.findFirstOrThrow({ where: { id: workTypeId, organisationId: session.organisationId, active: true } });
  const rosterRows = await roster(session);
  if (department && !rosterRows.some((employee) => employee.department === department)) throw new Error("FORBIDDEN: that department is outside your team.");
  const shrinkagePercent = Number(form.get("shrinkagePercent") ?? 0);
  const forecastVolume = mode === "traffic" ? Number(form.get("forecastVolume")) : null;
  const minutesPerUnit = mode === "traffic" ? Number(form.get("minutesPerUnit")) : null;
  if (mode === "traffic" && !Number.isInteger(forecastVolume)) throw new Error("Enter traffic as a whole number.");
  const requiredMinutes = mode === "hours" ? Math.round(Number(form.get("hours")) * 60) : null;
  requiredManMinutes({ requiredMinutes, forecastVolume, minutesPerUnit, shrinkagePercent });
  if (mode === "hours" && (requiredMinutes == null || !Number.isInteger(requiredMinutes) || requiredMinutes % 15 !== 0)) throw new Error("Enter man-hours in quarter-hour steps.");
  await db.$transaction(async (tx) => {
    for (const day of days) {
      await tx.schedulingDemand.upsert({
        where: { organisationId_demandDate_teamId_department_workTypeId: { organisationId: session.organisationId, demandDate: dateOnly(day), teamId, department, workTypeId } },
        create: { organisationId: session.organisationId, demandDate: dateOnly(day), teamId, department, workTypeId, label, volumeUnit, forecastVolume: mode === "traffic" ? forecastVolume : null, minutesPerUnit: mode === "traffic" ? minutesPerUnit : null, shrinkagePercent: mode === "traffic" ? shrinkagePercent : 0, requiredMinutes: mode === "hours" ? requiredMinutes : null },
        update: { label, volumeUnit, forecastVolume: mode === "traffic" ? forecastVolume : null, minutesPerUnit: mode === "traffic" ? minutesPerUnit : null, shrinkagePercent: mode === "traffic" ? shrinkagePercent : 0, requiredMinutes: mode === "hours" ? requiredMinutes : null },
      });
    }
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "scheduling.demand.saved", entityType: "Organisation", entityId: session.organisationId, after: { days: days.length, mode, teamId, department } } });
  });
  return days.length;
}

export async function saveBusyPeriod(session: Session, form: FormData) {
  assertManage(session);
  const name = text(form, "name", 80);
  const startsOn = dateOnly(text(form, "startsOn", 10));
  const endsOn = dateOnly(text(form, "endsOn", 10));
  if (!name) throw new Error("Name the busy period.");
  if (endsOn < startsOn) throw new Error("The busy period ends before it starts.");
  const teamId = text(form, "teamId", 40);
  const department = text(form, "department", 80);
  const maxText = text(form, "maxOffPerDay", 6);
  const maxOffPerDay = maxText ? Number(maxText) : null;
  const blockHolidays = form.get("blockHolidays") === "on";
  if (!blockHolidays && (maxOffPerDay == null || !Number.isInteger(maxOffPerDay) || maxOffPerDay < 0 || maxOffPerDay > 10000)) throw new Error("Set a holiday limit or close holiday requests for this period.");
  if (teamId) await db.workTeam.findFirstOrThrow({ where: { id: teamId, organisationId: session.organisationId } });
  const note = text(form, "note", 500) || null;
  const created = await db.schedulingCalendarRule.create({ data: { organisationId: session.organisationId, name, startsOn, endsOn, teamId, department, maxOffPerDay: blockHolidays ? null : maxOffPerDay, blockHolidays, note } });
  await db.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "scheduling.busy_period.saved", entityType: "SchedulingCalendarRule", entityId: created.id, after: { name, blockHolidays, maxOffPerDay } } });
  return created.id;
}

export async function removeBusyPeriod(session: Session, id: string) {
  assertManage(session);
  await db.schedulingCalendarRule.delete({ where: { id, organisationId: session.organisationId } });
}

async function placeShift(tx: Tx, organisationId: string, input: { employeeId: string; day: string; startTime: string; endTime: string; breakMinutes: number; status: "SCHEDULED" | "CONFIRMED"; workTypeId: string | null; teamId: string | null; role: string | null }) {
  const live = await tx.employee.findFirst({ where: { id: input.employeeId, organisationId, status: { notIn: ["LEFT", "OFFBOARDING"] } }, select: { firstName: true, lastName: true } });
  if (!live) return "left" as const;
  const endDay = input.endTime <= input.startTime ? addDays(dateOnly(input.day), 1).toISOString().slice(0, 10) : input.day;
  const startsAt = londonInstant(input.day, input.startTime);
  const endsAt = londonInstant(endDay, input.endTime);
  paidMinutes(startsAt, endsAt, input.breakMinutes);
  const lastDay = londonDate(new Date(endsAt.getTime() - 1));
  if (await tx.absenceRecord.count({ where: { organisationId, employeeId: input.employeeId, status: "APPROVED", startDate: { lte: dateOnly(lastDay) }, endDate: { gte: dateOnly(input.day) } } })) return "leave" as const;
  if (await tx.employeeAvailability.count({where:{organisationId,employeeId:input.employeeId,startsAt:{lt:endsAt},endsAt:{gt:startsAt}}}))return "unavailable" as const;
  if (await tx.rotaShift.count({ where: { organisationId, employeeId: input.employeeId, status: { not: "CANCELLED" }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } })) return "overlap" as const;
  await tx.rotaShift.create({ data: { organisationId, employeeId: input.employeeId, startsAt, endsAt, breakMinutes: input.breakMinutes, status: input.status, workTypeId: input.workTypeId, teamId: input.teamId, role: input.role } });
  return "saved" as const;
}

export async function fillMonth(session: Session, form: FormData) {
  assertManage(session);
  const month = monthKey(text(form, "month", 7));
  const workType = await db.schedulingWorkType.findFirstOrThrow({ where: { id: text(form, "workTypeId", 40), organisationId: session.organisationId, active: true } });
  const teamId = text(form, "teamId", 40) || workType.teamId;
  if (teamId) await db.workTeam.findFirstOrThrow({ where: { id: teamId, organisationId: session.organisationId } });
  const people = [...new Set(form.getAll("employeeId").map(String))];
  const allowed = new Set((await roster(session)).map((employee) => employee.id));
  if (!people.length || people.some((id) => !allowed.has(id))) throw new Error("Choose people in your team.");
  const days = datesForWeekdays(monthDates(month), workType.weekdays);
  if (people.length * days.length > 600) throw new Error("Fill one team, or a shorter pattern. A month can place up to 600 shifts at once.");
  const status = form.get("publish") === "on" ? "CONFIRMED" : "SCHEDULED";
  const counts = { saved: 0, leave: 0, overlap: 0, left: 0,unavailable:0 };
  await db.$transaction(async (tx) => {
    for (const employeeId of people) for (const day of days) {
      const result = await placeShift(tx as Tx, session.organisationId, { employeeId, day, startTime: workType.startTime, endTime: workType.endTime, breakMinutes: workType.breakMinutes, status, workTypeId: workType.id, teamId, role: workType.name });
      counts[result] += 1;
    }
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "scheduling.month.filled", entityType: "Organisation", entityId: session.organisationId, after: { ...counts, month, workTypeId: workType.id, status } } });
  }, { isolationLevel: "Serializable", timeout: 60000 });
  if (!counts.saved) throw new Error(counts.leave ? "Everyone selected is already off on those days." : "Those shifts are already on the plan.");
  return counts;
}

export async function applyReplan(session: Session, moves: Array<{ shiftId: string; employeeId: string }>) {
  assertManage(session);
  if (!Array.isArray(moves) || !moves.length || moves.length > 100) throw new Error("Choose up to 100 cover moves.");
  const allowed = new Set((await roster(session)).map((employee) => employee.id));
  let moved = 0;
  await db.$transaction(async (tx) => {
    const used = new Set<string>();
    for (const move of moves) {
      if (!move?.shiftId || !allowed.has(move.employeeId)) throw new Error("FORBIDDEN: cover is outside your team.");
      const shift = await tx.rotaShift.findFirstOrThrow({ where: { id: move.shiftId, organisationId: session.organisationId, status: { not: "CANCELLED" } } });
      if (!allowed.has(shift.employeeId)) throw new Error("FORBIDDEN: that shift is outside your team.");
      const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(shift.startsAt);
      const absent = await tx.absenceRecord.count({ where: { organisationId: session.organisationId, employeeId: shift.employeeId, status: "APPROVED", startDate: { lte: dateOnly(day) }, endDate: { gte: dateOnly(day) } } });
      if (!absent) throw new Error("Replan only moves a shift when that person has approved leave or sickness.");
      if (used.has(`${move.employeeId}:${day}`)) throw new Error("One person cannot cover two shifts on the same day.");
      used.add(`${move.employeeId}:${day}`);
      await tx.rotaShift.update({ where: { id: shift.id, organisationId: session.organisationId }, data: { status: "CANCELLED" } });
      const startTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(shift.startsAt);
      const endTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(shift.endsAt);
      const placed = await placeShift(tx as Tx, session.organisationId, { employeeId: move.employeeId, day, startTime, endTime, breakMinutes: shift.breakMinutes, status: shift.status === "CONFIRMED" ? "CONFIRMED" : "SCHEDULED", workTypeId: shift.workTypeId, teamId: shift.teamId, role: shift.role });
      if (placed !== "saved") throw new Error(placed === "leave" ? "The suggested cover is also off that day." : "The suggested cover already has a shift then.");
      moved += 1;
    }
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "scheduling.replan.applied", entityType: "Organisation", entityId: session.organisationId, after: { moved } } });
  }, { isolationLevel: "Serializable", timeout: 30000 });
  return moved;
}

export async function publishMonthPlan(session: Session, form: FormData) {
  assertManage(session);
  const month = monthKey(text(form, "month", 7));
  const days = monthDates(month);
  const selected = [...new Set(form.getAll("employeeId").map(String))];
  const allowed = new Set((await roster(session)).map((employee) => employee.id));
  if (!selected.length || selected.length > 120 || selected.some((id) => !allowed.has(id))) throw new Error("Choose up to 120 people in your team.");
  const startsAt = londonInstant(days[0], "00:00");
  const endsAt = londonInstant(addDays(dateOnly(days[days.length - 1]), 1).toISOString().slice(0, 10), "00:00");
  await db.$transaction(async (tx) => {
    const shifts = await tx.rotaShift.findMany({ where: { organisationId: session.organisationId, employeeId: { in: selected }, status: "SCHEDULED", startsAt: { gte: startsAt, lt: endsAt } }, take: 2001 });
    if (shifts.length > 2000) throw new Error("Publish one team at a time.");
    if (!shifts.length) throw new Error("There are no draft shifts to publish this month.");
    for (const shift of shifts) {
      const day = londonDate(shift.startsAt);
      if(await tx.employeeAvailability.count({where:{organisationId:session.organisationId,employeeId:shift.employeeId,startsAt:{lt:shift.endsAt},endsAt:{gt:shift.startsAt}}}))throw new Error("An employee marked a draft shift unavailable. Resolve it before publishing.");
      if (await tx.absenceRecord.count({ where: { organisationId: session.organisationId, employeeId: shift.employeeId, status: "APPROVED", startDate: { lte: dateOnly(day) }, endDate: { gte: dateOnly(day) } } })) throw new Error("Time off conflicts with a draft. Replan it before publishing.");
    }
    await tx.rotaShift.updateMany({ where: { organisationId: session.organisationId, id: { in: shifts.map((shift) => shift.id) }, status: "SCHEDULED" }, data: { status: "CONFIRMED" } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "scheduling.month.published", entityType: "Organisation", entityId: session.organisationId, after: { count: shifts.length, month } } });
  }, { isolationLevel: "Serializable", timeout: 30000 });
}

export async function loadPersonSchedule(session: Session, employeeId?: string) {
  const employee = employeeId
    ? await db.employee.findFirst({ where: { id: employeeId, organisationId: session.organisationId }, select: { id: true, userId: true, firstName: true, lastName: true } })
    : await db.employee.findFirst({ where: { organisationId: session.organisationId, userId: session.userId }, select: { id: true, userId: true, firstName: true, lastName: true } });
  if (!employee) return [];
  const own = employee.userId === session.userId;
  const manage = can(session, "scheduling.manage") || can(session, "people.rota.manage") || can(session, "people.employee.read") || can(session, "people.rota.read");
  if (!own && !manage) return [];
  if (!own && !can(session, "people.employee.read") && !can(session, "people.rota.manage") && !can(session, "people.rota.read")) {
    const allowed = new Set((await roster(session)).map((row) => row.id));
    if (!allowed.has(employee.id)) return [];
  }
  const start = mondayOf(dateOnly(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())));
  const shifts = await db.rotaShift.findMany({
    where: { organisationId: session.organisationId, employeeId: employee.id, startsAt: { gte: londonInstant(start.toISOString().slice(0, 10), "00:00"), lt: londonInstant(addDays(start, 56).toISOString().slice(0, 10), "00:00") }, status: own || !manage ? "CONFIRMED" : { not: "CANCELLED" } },
    include: { workType: { select: { name: true, category: true } }, team: { select: { name: true } } },
    orderBy: { startsAt: "asc" },
    take: 80,
  });
  return shifts;
}

export async function saveOneShift(session: Session, form: FormData) {
  assertManage(session);
  const day = text(form, "day", 10);
  const startTime = text(form, "startTime", 5);
  const endTime = text(form, "endTime", 5);
  const breakMinutes = Number(form.get("breakMinutes") ?? 0);
  paidMinutes(londonInstant(day, startTime), londonInstant(endTime <= startTime ? addDays(dateOnly(day), 1).toISOString().slice(0, 10) : day, endTime), breakMinutes);
  const workTypeId = text(form, "workTypeId", 40) || null;
  const teamId = text(form, "teamId", 40) || null;
  if (workTypeId) await db.schedulingWorkType.findFirstOrThrow({ where: { id: workTypeId, organisationId: session.organisationId, active: true } });
  if (teamId) await db.workTeam.findFirstOrThrow({ where: { id: teamId, organisationId: session.organisationId } });
  const allowed = new Set((await roster(session)).map((employee) => employee.id));
  const id = text(form, "id", 40);
  const status = form.get("publish") === "on" ? "CONFIRMED" : "SCHEDULED";
  await db.$transaction(async (tx) => {
    if (id) {
      const shift = await tx.rotaShift.findFirstOrThrow({ where: { id, organisationId: session.organisationId, status: { not: "CANCELLED" } } });
      if (!allowed.has(shift.employeeId)) throw new Error("FORBIDDEN: that person is outside your team.");
      const startsAt = londonInstant(day, startTime);
      const endsAt = londonInstant(endTime <= startTime ? addDays(dateOnly(day), 1).toISOString().slice(0, 10) : day, endTime);
      if (await tx.absenceRecord.count({ where: { organisationId: session.organisationId, employeeId: shift.employeeId, status: "APPROVED", startDate: { lte: dateOnly(londonDate(new Date(endsAt.getTime() - 1))) }, endDate: { gte: dateOnly(day) } } })) throw new Error("Approved time off covers this day.");
      if (await tx.rotaShift.count({ where: { id: { not: id }, organisationId: session.organisationId, employeeId: shift.employeeId, status: { not: "CANCELLED" }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } } })) throw new Error("This overlaps another shift.");
      if(await tx.employeeAvailability.count({where:{organisationId:session.organisationId,employeeId:shift.employeeId,startsAt:{lt:endsAt},endsAt:{gt:startsAt}}}))throw new Error("This employee marked the time unavailable.");
      if(await tx.rotaActivity.count({where:{organisationId:session.organisationId,shiftId:id,OR:[{startsAt:{lt:startsAt}},{endsAt:{gt:endsAt}}]}}))throw new Error("Replan the shift activities before changing its boundaries.");
      await tx.rotaShift.update({ where: { id, organisationId: session.organisationId }, data: { startsAt, endsAt, breakMinutes,breakStartsAt:startsAt.getTime()===shift.startsAt.getTime()&&endsAt.getTime()===shift.endsAt.getTime()&&breakMinutes===shift.breakMinutes?shift.breakStartsAt:null, workTypeId, teamId, role: text(form, "role", 100) || null, status } });
      await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "scheduling.shift.updated", entityType: "RotaShift", entityId: id } });
      return;
    }
    const employeeId = text(form, "employeeId", 40);
    if (!allowed.has(employeeId)) throw new Error("FORBIDDEN: that person is outside your team.");
    const placed = await placeShift(tx as Tx, session.organisationId, { employeeId, day, startTime, endTime, breakMinutes, status, workTypeId, teamId, role: text(form, "role", 100) || null });
    if (placed !== "saved") throw new Error(placed === "leave" ? "Approved time off covers this day." : placed === "left" ? "This person has left." : "This overlaps another shift.");
  }, { isolationLevel: "Serializable" });
}

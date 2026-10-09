import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { TEAMS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import type { AttentionItem, SearchResult } from "@/core/modules/types";
import {
  addDays, anniversary, awayLabel, countsAsAway, dateKey, dayTitle, displayName, isWorking, londonKey,
  monthCells, monthTitle, parseMonth, personAway, personColour, shortDay, taskClashes, thinDay,
} from "../domain/board";
import { currentEmployee, managesTeams, requireTeam } from "./access";

const personSelect = { id: true, firstName: true, lastName: true, preferredName: true, jobTitle: true, department: true, skills: true, workingDays: true, startDate: true, status: true } as const;

function visibleWhere(session: Session, employeeId: string | undefined) {
  if (managesTeams(session)) return { organisationId: session.organisationId };
  return { organisationId: session.organisationId, members: { some: { employeeId: employeeId ?? "__none__" } } };
}

export async function listPlanner(session: Session) {
  assertCapability(session, C.read);
  const employee = await currentEmployee(session);
  const teams = await db.plannerTeam.findMany({
    where: visibleWhere(session, employee?.id),
    orderBy: { name: "asc" },
    include: {
      _count: { select: { tasks: {where:{status:{not:"DONE"}}} } },
      members: { include: { employee: { select: personSelect } }, orderBy: { createdAt: "asc" } },
    },
  });
  return {
    manage: managesTeams(session),
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      openTasks: team._count.tasks,
      people: team.members.filter((member) => member.employee.status !== "LEFT").map((member, index) => ({
        id: member.employee.id,
        name: displayName(member.employee),
        title: member.employee.jobTitle,
        lead: member.lead,
        colour: personColour(index),
      })),
    })),
  };
}

export async function loadBoard(session: Session, teamId: string, monthValue: string | undefined, dayValue: string | undefined) {
  assertCapability(session, C.read);
  const access = await requireTeam(session, teamId);
  const month = parseMonth(monthValue);
  const cells = monthCells(month.year, month.month);
  const today = londonKey(new Date());
  const inMonth = cells.filter((cell) => cell.inMonth).map((cell) => cell.key);
  const day = dayValue && inMonth.includes(dayValue) ? dayValue : (inMonth.includes(today) ? today : inMonth[0]!);
  const from = new Date(`${cells[0]!.key}T00:00:00.000Z`);
  const to = new Date(`${cells[cells.length - 1]!.key}T00:00:00.000Z`);
  const memberIds = access.team.members.map((member) => member.employeeId);
  const [members, tasks, covers, handovers, places, moments, absences, candidates] = await Promise.all([
    db.plannerTeamMember.findMany({
      where: { organisationId: session.organisationId, teamId },
      orderBy: { createdAt: "asc" },
      include: { employee: { select: personSelect } },
    }),
    db.plannerTask.findMany({ where: { organisationId: session.organisationId, teamId }, orderBy: [{ status: "asc" }, { dueOn: "asc" }, { createdAt: "asc" }] }),
    db.plannerCover.findMany({ where: { organisationId: session.organisationId, teamId }, include: { employee: { select: personSelect }, cover: { select: personSelect } } }),
    db.plannerHandover.findMany({ where: { organisationId: session.organisationId, teamId }, include: { employee: { select: personSelect } }, orderBy: { startsOn: "asc" } }),
    db.plannerPlace.findMany({ where: { organisationId: session.organisationId, teamId, onDate: { gte: from, lte: to } } }),
    db.plannerMoment.findMany({ where: { organisationId: session.organisationId, teamId, onDate: { gte: from, lte: to } }, orderBy: { onDate: "asc" } }),
    memberIds.length ? db.absenceRecord.findMany({
      where: {
        organisationId: session.organisationId,
        employeeId: { in: memberIds },
        status: { in: ["PENDING", "APPROVED"] },
        startDate: { lte: to },
        endDate: { gte: from },
      },
      select: { employeeId: true, type: true, status: true, startDate: true, endDate: true },
    }) : Promise.resolve([]),
    access.manage ? db.employee.findMany({
      where: { organisationId: session.organisationId, status: { not: "LEFT" }, id: { notIn: memberIds } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 200,
      select: { id: true, firstName: true, lastName: true, preferredName: true, jobTitle: true, department: true },
    }) : Promise.resolve([]),
  ]);

  const people = members.filter((member) => member.employee.status !== "LEFT").map((member, index) => ({
    memberId: member.id,
    employeeId: member.employeeId,
    name: displayName(member.employee),
    title: member.employee.jobTitle,
    department: member.employee.department,
    skills: member.employee.skills,
    lead: member.lead,
    colour: personColour(index),
    workingDays: member.employee.workingDays,
    startDate: member.employee.startDate,
  }));
  const byEmployee = new Map(people.map((person) => [person.employeeId, person]));
  const absenceByEmployee = new Map<string, Array<{ type: string; status: string; start: Date; end: Date }>>();
  for (const absence of absences) {
    const list = absenceByEmployee.get(absence.employeeId) ?? [];
    list.push({ type: absence.type, status: absence.status, start: absence.startDate, end: absence.endDate });
    absenceByEmployee.set(absence.employeeId, list);
  }

  function dayPeople(key: string) {
    return people.map((person) => {
      const away = personAway(absenceByEmployee.get(person.employeeId) ?? [], key);
      const working = isWorking(person.workingDays, key);
      const place = places.find((item) => item.employeeId === person.employeeId && dateKey(item.onDate) === key);
      const cover = covers.find((item) => item.employeeId === person.employeeId && dateKey(item.startsOn) <= key && key <= dateKey(item.endsOn));
      const handover = handovers.find((item) => item.employeeId === person.employeeId && dateKey(item.startsOn) <= key && key <= dateKey(item.endsOn));
      return {
        employeeId: person.employeeId,
        name: person.name,
        title: person.title,
        skills: person.skills,
        colour: person.colour,
        lead: person.lead,
        working,
        away,
        awayLabel: away ? awayLabel(away) : null,
        place: place && !countsAsAway(away) ? place.kind : null,
        placeNote: place?.note ?? null,
        coverName: cover ? displayName(cover.cover) : null,
        coverNote: cover?.note ?? null,
        coverId: cover?.id ?? null,
        handover: handover?.note ?? null,
        handoverId: handover?.id ?? null,
      };
    });
  }

  const calendar = cells.map((cell) => {
    const roster = dayPeople(cell.key);
    const working = roster.filter((person) => person.working);
    const away = working.filter((person) => countsAsAway(person.away));
    const available = working.length - away.length;
    return {
      ...cell,
      available,
      working: working.length,
      thin: thinDay(available, working.length),
      names: away.slice(0, 2).map((person) => ({ name: person.name.split(" ")[0] ?? person.name, colour: person.colour, requested: person.away === "requested" })),
      more: Math.max(0, away.length - 2),
      moments: moments.filter((moment) => dateKey(moment.onDate) === cell.key).length,
      tasks: tasks.filter((task) => task.dueOn && dateKey(task.dueOn) === cell.key && task.status !== "DONE").length,
    };
  });

  const selected = dayPeople(day);
  const selectedMoments = moments.filter((moment) => dateKey(moment.onDate) === day).map((moment) => ({
    id: moment.id, title: moment.title, kind: moment.kind, note: moment.note,
  }));
  const taskRows = tasks.map((task) => {
    const assignee = task.assigneeEmployeeId ? byEmployee.get(task.assigneeEmployeeId) : undefined;
    const due = task.dueOn ? dateKey(task.dueOn) : null;
    const away = due && assignee ? personAway(absenceByEmployee.get(assignee.employeeId) ?? [], due) : null;
    return {
      id: task.id,
      version: task.version,
      title: task.title,
      detail: task.detail,
      status: task.status,
      due,
      assigneeId: assignee?.employeeId ?? "",
      assigneeName: assignee?.name ?? "Anyone",
      colour: assignee?.colour ?? "#6e6e73",
      clash: task.status !== "DONE" && taskClashes(due, away),
      mine: Boolean(access.employee && task.assigneeEmployeeId === access.employee.id),
    };
  });
  const anniversaries = people.flatMap((person) => {
    const mark = anniversary(person.startDate, month.year, month.month);
    return mark ? [{ name: person.name, ...mark }] : [];
  });
  const week = Array.from({ length: 7 }, (_, index) => addDays(today, index)).map((key) => {
    const roster = dayPeople(key);
    const off = roster.filter((person) => person.working && countsAsAway(person.away));
    const due = taskRows.filter((task) => task.due === key && task.status !== "DONE");
    return { key, label: shortDay(key), off: off.map((person) => person.name.split(" ")[0] ?? person.name), due: due.length };
  });

  return {
    team: { id: access.team.id, name: access.team.name },
    manage: access.manage,
    selfId: access.employee?.id ?? null,
    monthKey: month.key,
    monthLabel: monthTitle(month.year, month.month),
    today,
    day,
    dayLabel: dayTitle(day),
    calendar,
    people: people.map((person) => ({ employeeId: person.employeeId, memberId: person.memberId, name: person.name, title: person.title, department: person.department, lead: person.lead, colour: person.colour, skills: person.skills })),
    selected,
    moments: selectedMoments,
    tasks: taskRows,
    anniversaries,
    week,
    candidates: candidates.map((person) => ({ id: person.id, name: displayName(person), title: person.jobTitle, department: person.department })),
  };
}

export async function teamAttention(session: Session): Promise<AttentionItem[]> {
  if (!can(session, C.read)) return [];
  const employee = await currentEmployee(session);
  if (!employee) return [];
  const today = londonKey(new Date());
  const until = addDays(today, 7);
  const tasks = await db.plannerTask.findMany({
    where: {
      organisationId: session.organisationId,
      assigneeEmployeeId: employee.id,
      status: { not: "DONE" },
      dueOn: { gte: new Date(`${today}T00:00:00.000Z`), lte: new Date(`${until}T00:00:00.000Z`) },
      team: { members: { some: { employeeId: employee.id } } },
    },
    orderBy: { dueOn: "asc" },
    take: 5,
    include: { team: { select: { id: true, name: true } } },
  });
  return tasks.map((task) => ({
    id: task.id,
    label: `${task.title} · ${task.team.name}`,
    href: `/teams/${task.team.id}?day=${task.dueOn ? dateKey(task.dueOn) : today}`,
    severity: "warning" as const,
  }));
}

export async function searchTeams(session: Session, query: string): Promise<SearchResult[]> {
  if (!can(session, C.read) || query.trim().length < 2) return [];
  const employee = await currentEmployee(session);
  const teams = await db.plannerTeam.findMany({
    where: { ...visibleWhere(session, employee?.id), name: { contains: query.trim(), mode: "insensitive" } },
    take: 6,
    orderBy: { name: "asc" },
  });
  return teams.map((team) => ({ id: team.id, title: team.name, subtitle: "Team planner", href: `/teams/${team.id}`, group: "Teams" }));
}

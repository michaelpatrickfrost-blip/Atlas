import {teamScope} from "./team-access";
import type { StaffRosterProvider } from "@/core/modules/types";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
export const staffRosterProvider: StaffRosterProvider = async (session, manage) => {
  await assertModuleEnabled(session, "people");
  const all = can(session, HR.employeeManage) || can(session, HR.rotaManage);
  const team = can(session, HR.teamManage) && can(session, "scheduling.manage");
  return db.employee.findMany({ where: { ...(manage ? all ? {organisationId:session.organisationId} : team ? await teamScope(session) : {organisationId:session.organisationId,id:"__denied__"} : {organisationId:session.organisationId,userId:session.userId}), status: { notIn: ["LEFT", "OFFBOARDING"] } }, select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true, userId: true, contractedWeeklyHours: true, workingDays: true, skills: true }, orderBy: [{ department: "asc" }, { lastName: "asc" }] });
};

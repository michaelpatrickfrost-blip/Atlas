import { it, expect, vi } from "vitest";
import type { Session } from "@/core/auth/session";
const queries=vi.hoisted(()=>({project:vi.fn(async()=>[]),task:vi.fn(async()=>[])}));
vi.mock("@/core/db/client",()=>({db:{project:{groupBy:queries.project},projectTask:{groupBy:queries.task}}}));
import { projectsAnalytics } from "@/modules/projects/services/analytics";
import { projectScope, taskScope } from "@/core/permissions/work-access";
it("project and task aggregates retain the source record visibility predicates",async()=>{
 const session={organisationId:"tenant-a",userId:"viewer",capabilities:new Set(["projects.read"])} as Session;
 await projectsAnalytics[0].query(session,undefined);
 await projectsAnalytics[1].query(session,undefined);
 expect(queries.project).toHaveBeenCalledWith(expect.objectContaining({where:projectScope(session)}));
 expect(queries.task).toHaveBeenCalledWith(expect.objectContaining({where:taskScope(session)}));
});

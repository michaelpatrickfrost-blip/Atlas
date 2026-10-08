import type { Session } from "@/core/auth/session";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { getEnabledModuleIds } from "./runtime";
export async function assertModuleEnabled(session:Session,moduleId:string) {
 if(session.capabilities.has(ATLAS_CAPABILITIES.staff)) return;
 if(!(await getEnabledModuleIds(session.organisationId)).has(moduleId)) throw new Error("This app is disabled in your workspace.");
}

import type { Session } from "@/core/auth/session";
import { getEnabledModuleIds } from "./runtime";
export async function assertModuleEnabled(session:Session,moduleId:string) {
 if(!(await getEnabledModuleIds(session.organisationId)).has(moduleId)) throw new Error("This app is disabled in your workspace.");
}

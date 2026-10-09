import type { Session } from "@/core/auth/session";
import { isModuleEnabled } from "./runtime";
export async function assertModuleEnabled(session:Session,moduleId:string) {
 if(!(await isModuleEnabled(session,moduleId))) throw new Error("This app is disabled in your workspace.");
}

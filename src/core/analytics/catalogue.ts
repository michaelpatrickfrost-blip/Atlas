import { customerAnalytics } from "./customer-metrics";
import type { Session } from "@/core/auth/session";
import { getImplementedModules } from "@/core/modules/registry";
import { enabledModulesForSession } from "@/core/modules/runtime";
import { can } from "@/core/permissions/check";
export async function getAnalyticsMetrics(session: Session) {
 const enabled = await enabledModulesForSession(session);
 return [...customerAnalytics,...getImplementedModules().filter(m => enabled.has(m.id)).flatMap(m => m.analyticsProvider ?? [])].filter(metric => can(session, metric.capability) && (metric.requiredCapabilities ?? []).every(cap => can(session, cap)) && (metric.requiredModules ?? []).every(id => enabled.has(id)));
}

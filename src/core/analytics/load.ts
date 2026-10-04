import type { Session } from "@/core/auth/session";
import type { AnalyticsResult } from "./types";
import { getAnalyticsMetrics } from "./catalogue";

export async function loadAnalyticsResults(session: Session, period: string): Promise<AnalyticsResult[]> {
  const since = period === "all" ? undefined : new Date(Date.now() - Number(period) * 86400000);
  const metrics = await getAnalyticsMetrics(session);
  const settled = await Promise.allSettled(metrics.map(async (metric) => {
    const { query, capability, ...metadata } = metric;
    void capability;
    return { ...metadata, points: await query(session, since) };
  }));
  return settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    const { query, capability, ...metadata } = metrics[index];
    void query;
    void capability;
    return { ...metadata, points: [], error: "This measure could not load. It will try again on the next refresh." };
  });
}

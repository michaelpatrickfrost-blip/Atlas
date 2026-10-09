import type { Session } from "@/core/auth/session";
export type AnalyticsPoint = { label: string; value: number };
export type MetricUnit = "count" | "hours" | "percent" | "money";
export type MetricBreakdown = { id: string; label: string; shape?: "breakdown" | "trend" };
export type GoalPeriod = { start: Date; until: Date };
export type GoalMeasurement = { points: AnalyticsPoint[]; sampleSize?: number; note?: string };
export type AnalyticsMetric = {
  /** Exact, bounded goal-period reading. Rates include their denominator. */
  goalQuery?: (session: Session, period: GoalPeriod) => Promise<GoalMeasurement>;
  goalSuggestion?: { name: string; direction: "AT_LEAST" | "AT_MOST"; target?: number };
  requiredCapabilities?: string[];
  requiredModules?: string[];
  id: string; name: string; subject: string; definition: string; grain: string; capability: string; href: string; snapshot: boolean;
  /** breakdown = categories. trend = time buckets that must keep their order. */
  shape?: "breakdown" | "trend";
  /** count is the default. money values are minor units and the point label is the currency. */
  unit?: MetricUnit;
  /** Views the reader can switch from the chart menu. The first one is the default query. */
  breakdowns?: MetricBreakdown[];
  query: (session: Session, since: Date | undefined, breakdown?: string) => Promise<AnalyticsPoint[]>;
};
export type AnalyticsResult = Omit<AnalyticsMetric, "query" | "goalQuery" | "capability"> & {
  currency?: string;
  overallValue?: number;
  points: AnalyticsPoint[];
  error?: string;
  /** Sample boards only. Live boards load a breakdown from the server. */
  previewSlices?: Record<string, { points: AnalyticsPoint[]; shape?: "breakdown" | "trend" }>;
};
export type AnalyticsProvider = AnalyticsMetric[];

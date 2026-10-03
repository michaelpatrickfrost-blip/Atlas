/** Bradford Factor: B = S^2 x D, where S is the number of separate sickness
 *  episodes and D is the total sickness days, both counted over a rolling
 *  12-month window ending "now". Short, frequent absences score far higher
 *  than one long one — that's the point of the metric (attendance pattern,
 *  not total time off). Thresholds below follow common UK HR practice:
 *  50 = informal chat, 200 = formal warning stage, 500 = possible dismissal
 *  stage — bands only, not a policy Atlas enforces itself. */

export type BradfordBand = "none" | "watch" | "concern" | "serious";

export function bradfordBand(score: number): BradfordBand {
  if (score >= 500) return "serious";
  if (score >= 200) return "concern";
  if (score >= 50) return "watch";
  return "none";
}

export function daysBetweenInclusive(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function calculateBradfordFactor(
  sicknessEpisodes: Array<{ startDate: Date; endDate: Date }>,
  asOf: Date = new Date(),
): { episodes: number; days: number; score: number; band: BradfordBand } {
  const windowStart = new Date(asOf);
  windowStart.setFullYear(windowStart.getFullYear() - 1);

  const inWindow = sicknessEpisodes.filter((e) => e.endDate >= windowStart && e.startDate <= asOf);
  const episodes = inWindow.length;
  const days = inWindow.reduce((sum, e) => sum + daysBetweenInclusive(e.startDate, e.endDate), 0);
  const score = episodes * episodes * days;
  return { episodes, days, score, band: bradfordBand(score) };
}

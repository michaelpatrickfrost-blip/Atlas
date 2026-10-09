export function attainment(actual: number | null, target: number, direction: string): number | null {
  if (actual === null || !Number.isFinite(actual) || !Number.isFinite(target)) return null;
  if (direction === "AT_MOST") return actual <= target ? 100 : Math.max(0, target / actual * 100);
  if (target === 0) return actual >= 0 ? 100 : 0;
  return Math.max(0, Math.min(100, actual / target * 100));
}

export function weightedAttainment(items: { actual: number | null; target: number; direction: string; weight: number }[]) {
  const scores = items.map(item => ({ score: attainment(item.actual, item.target, item.direction), weight: item.weight }));
  const totalWeight = scores.reduce((n, item) => n + item.weight, 0);
  const missing = scores.filter(item => item.score === null).length;
  return { value: !items.length || missing || !totalWeight ? null : scores.reduce((n, item) => n + item.score! * item.weight, 0) / totalWeight, missing };
}

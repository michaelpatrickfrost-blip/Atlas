/** Nearest penny, with an exact half penny rounded down. HMRC uses this for NI. */
export function applyRateHalfDown(pence: number, basisPoints: number): number {
  if (pence <= 0 || basisPoints <= 0) return 0;
  const numerator = Math.round(pence) * basisPoints;
  const quotient = Math.floor(numerator / 10_000);
  const remainder = numerator % 10_000;
  return remainder * 2 > 10_000 ? quotient + 1 : quotient;
}

export function prorateHalfDown(annualPence: number, period: number, periods: number): number {
  if (period <= 0 || periods <= 0) return 0;
  const numerator = annualPence * period;
  const quotient = Math.floor(numerator / periods);
  const remainder = numerator % periods;
  return remainder * 2 > periods ? quotient + 1 : quotient;
}

export function slicePence(pay: number, from: number, to: number | null): number {
  const upper = to == null ? pay : Math.min(pay, to);
  return Math.max(0, upper - from);
}

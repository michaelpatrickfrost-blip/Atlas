import { taxYearTable } from "./tax-tables";

/** Tax codes like "1257L" encode the annual personal allowance as that number
 *  × 10. "BR" taxes everything at the basic rate, "0T" gives no allowance,
 *  "NT" takes no tax, "D0"/"D1" tax everything at the higher/additional rate. */
export function allowanceFromTaxCode(taxCode: string | null, defaultAllowance: number): number {
  const code = (taxCode ?? "").trim().toUpperCase();
  if (!code) return defaultAllowance;
  if (code === "NT") return Infinity;
  if (code === "BR" || code === "D0" || code === "D1" || code === "0T") return 0;
  const numeric = code.match(/^(\d+)L$/);
  if (numeric) return Number(numeric[1]) * 10;
  return defaultAllowance;
}

function annualTax(taxableAnnual: number, taxYear: string): number {
  if (taxableAnnual <= 0) return 0;
  const { payeBands } = taxYearTable(taxYear);
  let tax = 0;
  for (let i = 0; i < payeBands.length; i++) {
    const band = payeBands[i];
    const next = payeBands[i + 1];
    if (taxableAnnual <= band.from) break;
    const upper = next ? Math.min(taxableAnnual, next.from) : taxableAnnual;
    tax += (upper - band.from) * band.rate;
  }
  return tax;
}

/** Flat-rate (non-cumulative) PAYE for one pay period: proportion the annual
 *  allowance and bands by the number of pay periods in the year, then tax
 *  this period's pay on its own. This is the standard "week 1 / month 1"
 *  basis — correct for most employees and far simpler than true cumulative
 *  PAYE, which needs the full year-to-date history replayed every period. */
export function calculatePaye(params: {
  grossMinorUnits: number;
  taxCode: string | null;
  payPeriodsPerYear: 12 | 52;
  taxYear: string;
}): { taxMinorUnits: number } {
  const table = taxYearTable(params.taxYear);
  const allowance = allowanceFromTaxCode(params.taxCode, table.personalAllowance);
  const code = (params.taxCode ?? "").trim().toUpperCase();
  if (code === "BR") return { taxMinorUnits: Math.round((params.grossMinorUnits / 100) * table.payeBands[0].rate * 100) };
  if (code === "D0") return { taxMinorUnits: Math.round((params.grossMinorUnits / 100) * table.payeBands[1].rate * 100) };
  if (code === "D1") return { taxMinorUnits: Math.round((params.grossMinorUnits / 100) * table.payeBands[2].rate * 100) };

  const grossPerPeriod = params.grossMinorUnits / 100;
  const allowancePerPeriod = allowance === Infinity ? Infinity : allowance / params.payPeriodsPerYear;
  const taxablePerPeriod = allowance === Infinity ? 0 : Math.max(0, grossPerPeriod - allowancePerPeriod);
  const annualisedTaxable = taxablePerPeriod * params.payPeriodsPerYear;
  const annualisedTax = annualTax(annualisedTaxable, params.taxYear);
  const taxPerPeriod = annualisedTax / params.payPeriodsPerYear;
  return { taxMinorUnits: Math.round(taxPerPeriod * 100) };
}

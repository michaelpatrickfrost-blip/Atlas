import { taxYearTable } from "./tax-tables";

/** National Insurance for one pay period, category A only (the category the
 *  overwhelming majority of employees are on). Any other category is still
 *  calculated at the category-A rate so a payslip is never silently wrong —
 *  `isStandardCategory` tells the caller to show a note rather than trust
 *  the figure blindly. Pro-rated the same flat-rate way as PAYE. */
export function calculateNi(params: {
  grossMinorUnits: number;
  niCategory: string;
  payPeriodsPerYear: 12 | 52;
  taxYear: string;
}): { employeeNiMinorUnits: number; employerNiMinorUnits: number; isStandardCategory: boolean } {
  const table = taxYearTable(params.taxYear);
  const grossPerPeriod = params.grossMinorUnits / 100;
  const primaryThresholdPerPeriod = table.niPrimaryThreshold / params.payPeriodsPerYear;
  const upperLimitPerPeriod = table.niUpperEarningsLimit / params.payPeriodsPerYear;
  const secondaryThresholdPerPeriod = table.niSecondaryThreshold / params.payPeriodsPerYear;

  const mainBand = Math.max(0, Math.min(grossPerPeriod, upperLimitPerPeriod) - primaryThresholdPerPeriod);
  const upperBand = Math.max(0, grossPerPeriod - upperLimitPerPeriod);
  const employeeNi = mainBand * table.niMainRate + upperBand * table.niUpperRate;

  const employerBand = Math.max(0, grossPerPeriod - secondaryThresholdPerPeriod);
  const employerNi = employerBand * table.niEmployerRate;

  return {
    employeeNiMinorUnits: Math.round(employeeNi * 100),
    employerNiMinorUnits: Math.round(employerNi * 100),
    isStandardCategory: params.niCategory === "A",
  };
}

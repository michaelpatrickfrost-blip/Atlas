import { taxYearTable } from "./tax-tables";

/** Auto-enrolment pension on qualifying earnings only — the slice of pay
 *  between the lower and upper qualifying-earnings bands, not gross pay. */
export function calculatePension(params: {
  grossMinorUnits: number;
  payPeriodsPerYear: 12 | 52;
  employeePercent: number;
  employerPercent: number;
  optedOut: boolean;
  taxYear: string;
}): { employeePensionMinorUnits: number; employerPensionMinorUnits: number } {
  if (params.optedOut) return { employeePensionMinorUnits: 0, employerPensionMinorUnits: 0 };
  const table = taxYearTable(params.taxYear);
  const lowerPerPeriod = table.pensionQualifyingLower / params.payPeriodsPerYear;
  const upperPerPeriod = table.pensionQualifyingUpper / params.payPeriodsPerYear;
  const grossPerPeriod = params.grossMinorUnits / 100;
  const qualifyingEarnings = Math.max(0, Math.min(grossPerPeriod, upperPerPeriod) - lowerPerPeriod);
  return {
    employeePensionMinorUnits: Math.round(qualifyingEarnings * (params.employeePercent / 100) * 100),
    employerPensionMinorUnits: Math.round(qualifyingEarnings * (params.employerPercent / 100) * 100),
  };
}

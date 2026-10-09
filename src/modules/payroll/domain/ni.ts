import { taxYearTable } from "./tax-tables";

/** HMRC 2026–27 category rates. The employer must confirm category eligibility;
 * director annual/alternative methods require an external payroll calculation. */
export function calculateNi(params: {
  grossMinorUnits: number;
  niCategory: string;
  payPeriodsPerYear: 12 | 52;
  taxYear: string;
}): { employeeNiMinorUnits: number; employerNiMinorUnits: number; isStandardCategory: boolean } {
  const table = taxYearTable(params.taxYear);
  const categories: Record<string,{main:number;upper:number;secondary:number}> = {
    A:{main:.08,upper:.02,secondary:5000},B:{main:.0185,upper:.02,secondary:5000},C:{main:0,upper:0,secondary:5000},J:{main:.02,upper:.02,secondary:5000},
    H:{main:.08,upper:.02,secondary:50270},M:{main:.08,upper:.02,secondary:50270},V:{main:.08,upper:.02,secondary:50270},Z:{main:.02,upper:.02,secondary:50270},
    F:{main:.08,upper:.02,secondary:25000},I:{main:.0185,upper:.02,secondary:25000},L:{main:.02,upper:.02,secondary:25000},S:{main:0,upper:0,secondary:25000},
    N:{main:.08,upper:.02,secondary:25000},E:{main:.0185,upper:.02,secondary:25000},D:{main:.02,upper:.02,secondary:25000},K:{main:0,upper:0,secondary:25000},
  };
  const category=categories[params.niCategory];if(!category)throw new Error("Choose a supported National Insurance category; Atlas will not substitute category A.");
  const grossPerPeriod = params.grossMinorUnits / 100;
  const primaryThresholdPerPeriod = params.payPeriodsPerYear===52?242:1048;
  const upperLimitPerPeriod = params.payPeriodsPerYear===52?967:4189;
  const secondaryThresholdPerPeriod = category.secondary===5000?(params.payPeriodsPerYear===52?96:417):category.secondary===25000?(params.payPeriodsPerYear===52?481:2083):(params.payPeriodsPerYear===52?967:4189);

  const mainBand = Math.max(0, Math.min(grossPerPeriod, upperLimitPerPeriod) - primaryThresholdPerPeriod);
  const upperBand = Math.max(0, grossPerPeriod - upperLimitPerPeriod);
  const employeeNi = mainBand * category.main + upperBand * category.upper;

  const employerBand = Math.max(0, grossPerPeriod - secondaryThresholdPerPeriod);
  const employerNi = employerBand * table.niEmployerRate;

  return {
    employeeNiMinorUnits: Math.round(employeeNi * 100),
    employerNiMinorUnits: Math.round(employerNi * 100),
    isStandardCategory: params.niCategory === "A",
  };
}

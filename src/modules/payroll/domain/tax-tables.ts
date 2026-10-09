/** UK statutory rates for the current tax year, as data — not hardcoded inline
 *  in the calculators. When a new tax year's rates are published, add a new
 *  entry here rather than editing paye.ts/ni.ts/pension.ts/statutory-pay.ts.
 *  This is calculation only: there is no RTI/HMRC submission in Atlas. See
 *  docs/modules/PAYROLL.md. */

export type TaxYearTable = {
  taxYear: string; // e.g. "2026-27"
  /** Annual personal allowance before tax-code adjustment. */
  personalAllowance: number;
  /** Ascending bands: taxable income above `from` up to the next band's `from`
   *  is taxed at `rate`. The final band has no upper bound. */
  payeBands: { from: number; rate: number }[];
  /** Reference NI thresholds/rates. ni.ts applies the recorded category and
   * HMRC published weekly/monthly thresholds; unsupported categories fail. */
  niPrimaryThreshold: number;
  niUpperEarningsLimit: number;
  niMainRate: number;
  niUpperRate: number;
  niSecondaryThreshold: number;
  niEmployerRate: number;
  /** Pension auto-enrolment qualifying-earnings band (annual). */
  pensionQualifyingLower: number;
  pensionQualifyingUpper: number;
  /** Statutory pay weekly flat rates. */
  sspWeeklyRate: number;
  smpWeeklyRateAfterSixWeeks: number;
  smpEarningsReplacementRate: number; // first 6 weeks: this % of average weekly earnings
  /** Student loan plan thresholds (annual) and the single repayment rate. */
  studentLoanThresholds: Record<"PLAN_1" | "PLAN_2" | "PLAN_4" | "PLAN_5" | "POSTGRADUATE", number>;
  studentLoanRate: number;
  postgraduateLoanRate: number;
};

export const CURRENT_TAX_YEAR = "2026-27";

export const TAX_YEAR_TABLES: Record<string, TaxYearTable> = {
  "2026-27": {
    taxYear: "2026-27",
    personalAllowance: 12570,
    payeBands: [
      { from: 0, rate: 0.2 },
      { from: 37700, rate: 0.4 },
      { from: 125140, rate: 0.45 },
    ],
    niPrimaryThreshold: 12570,
    niUpperEarningsLimit: 50270,
    niMainRate: 0.08,
    niUpperRate: 0.02,
    niSecondaryThreshold: 5000,
    niEmployerRate: 0.15,
    pensionQualifyingLower: 6240,
    pensionQualifyingUpper: 50270,
    sspWeeklyRate: 123.25,
    smpWeeklyRateAfterSixWeeks: 194.32,
    smpEarningsReplacementRate: 0.9,
    studentLoanThresholds: { PLAN_1: 26900, PLAN_2: 29385, PLAN_4: 33795, PLAN_5: 25000, POSTGRADUATE: 21000 },
    studentLoanRate: 0.09,
    postgraduateLoanRate: 0.06,
  },
};

export function taxYearTable(taxYear: string): TaxYearTable {
  const table = TAX_YEAR_TABLES[taxYear];
  if (!table) throw new Error(`No statutory rate table for tax year ${taxYear}. Add one to tax-tables.ts before running payroll.`);
  return table;
}

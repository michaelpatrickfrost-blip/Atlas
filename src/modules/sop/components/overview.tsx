import Link from 'next/link';
import type { SopPayload } from '../services/workspace';

const number = (value: number | null) => value == null ? 'Unavailable' : value.toLocaleString('en-GB', { maximumFractionDigits: 1 });
const money = (value: number | null, currency: string) => value == null ? 'Unavailable' : new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value / 100);

export function SopOverview({ payload, base, status }: { payload: SopPayload; base: string; status: string }) {
  const rows = payload.rows, revenue = rows.reduce((sum, row) => sum + row.revenueMinor, 0);
  const margin = rows.length && rows.every(row => row.marginMinor != null) ? rows.reduce((sum, row) => sum + row.marginMinor!, 0) : null;
  const riskValue = rows.length && rows.every(row => row.atRisk != null) ? rows.reduce((sum, row) => sum + row.atRisk! * row.priceMinor, 0) : null;
  const units = [...new Set(rows.map(row => row.unit))];
  return <div className="space-y-8">
    <div className="grid gap-5 border-b border-black/10 pb-6 md:grid-cols-4">
      {[['Revenue forecast', money(revenue, payload.currency)], ['Assumed gross margin', money(margin, payload.currency)], ['Stock cover at risk', money(riskValue, payload.currency)], ['Version', status]].map(([label, value]) => <div key={label}><p className="text-sm text-[var(--color-ink-muted)]">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}
    </div>
    <div className="grid gap-8 lg:grid-cols-2"><section><h2 className="text-xl font-semibold">Remaining demand and stock cover</h2><p className="mt-2 text-xs text-[var(--color-ink-muted)]">Products are grouped by unit. Supply excludes the safety-stock reserve. The financial exposure above uses forecast selling prices.</p>
      {units.map(unit => <div className="mt-5" key={unit}><h3 className="text-sm font-semibold">{unit}</h3><div className="mt-3 space-y-3">{[...new Set(rows.filter(row => row.unit === unit).map(row => row.period))].map(period => {
        const monthly = rows.filter(row => row.unit === unit && row.period === period), demand = monthly.reduce((sum, row) => sum + row.remainingDemand, 0);
        const supply = monthly.every(row => row.constrained != null) ? monthly.reduce((sum, row) => sum + row.constrained!, 0) : null;
        return <div key={period} className="grid grid-cols-[65px_1fr_130px] items-center gap-3 text-sm"><span>{period}</span><div className="h-3 rounded bg-black/5" aria-label={`${period}: ${number(supply)} covered of ${number(demand)} ${unit}`}><div className="h-3 rounded bg-[var(--color-atlas-blue)]" style={{ width: demand ? `${Math.min(100, (supply ?? 0) / demand * 100)}%` : '0%' }}/></div><span className="text-right text-xs tabular-nums">{number(supply)} / {number(demand)}</span></div>;
      })}</div></div>)}
    </section><section><h2 className="text-xl font-semibold">Supply exceptions</h2><p className="mt-2 text-xs text-[var(--color-ink-muted)]">Dated stock cover is separate from material, machine and labour feasibility.</p><ul className="mt-4 divide-y divide-black/5">{rows.filter(row => (row.atRisk ?? 0) > 0).slice(0, 20).map(row => <li className="py-3 text-sm" key={row.productId + row.period}><Link className="font-medium text-[var(--color-atlas-blue)]" href={`${base}&view=supply&q=${encodeURIComponent(row.code)}`}>{row.code} · {row.period} ↗</Link><p className="mt-1">{number(row.atRisk)} {row.unit} uncovered · {money((row.atRisk ?? 0) * row.priceMinor, payload.currency)} at assumed selling price</p></li>)}</ul>{!rows.some(row => (row.atRisk ?? 0) > 0) ? <p className="mt-4 text-sm text-[var(--color-ink-muted)]">{riskValue == null ? 'Supply evidence is unavailable for this version.' : 'No stock-cover shortfall in this version.'}</p> : null}<Link className="mt-5 inline-block text-sm text-[var(--color-atlas-blue)]" href={`${base}&view=cycle`}>Review risks, actions and decisions →</Link></section></div>
    <SopFinancialReview payload={payload} base={base}/>
  </div>;
}

export function SopFinancialReview({ payload, base }: { payload: SopPayload; base: string }) {
  const targets = (payload.targets ?? []).filter(target => target.planId === payload.settings.targetPlanId && target.metricKey === 'revenue' && target.currency === payload.currency);
  return <section className="space-y-4"><div><h2 className="text-xl font-semibold">Financial review</h2><p className="mt-2 text-sm text-[var(--color-ink-muted)]">Whole-period forecast keeps confirmed order values and prices uncommitted quantities using selling-price assumptions. {targets.length ? `Targets: ${targets[0].planName}.` : 'Choose one connected revenue target plan in Planning cycle.'} Costs and margin are assumptions; invoiced actuals are not substituted with order values.</p></div>
    <div className="overflow-x-auto rounded-2xl border border-black/10"><table className="w-full text-sm"><thead className="text-left"><tr>{['Month', 'Revenue target', 'Revenue forecast', 'Gap to target', 'Assumed cost', 'Assumed margin'].map(label => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>{[...new Set(payload.rows.map(row => row.period))].map(period => {
      const rows = payload.rows.filter(row => row.period === period), targetRow = targets.find(target => target.periodKey === period), target = targetRow?.value ?? null;
      const forecast = rows.reduce((sum, row) => sum + row.revenueMinor, 0), cost = rows.every(row => row.costMinor != null) ? rows.reduce((sum, row) => sum + row.costMinor!, 0) : null;
      return <tr className="border-t border-black/5" key={period}><th className="whitespace-nowrap p-3 text-left font-medium">{period}</th>{[target, forecast, target == null ? null : forecast - target, cost, cost == null ? null : forecast - cost].map((value, index) => <td className="p-3 tabular-nums" key={index}>{money(value, payload.currency)}</td>)}</tr>;
    })}</tbody></table></div><Link className="text-sm text-[var(--color-atlas-blue)]" href={`${base}&view=finance`}>Inspect product financials and Finance budget references →</Link>
  </section>;
}

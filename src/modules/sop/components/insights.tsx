import Link from 'next/link';
import type { SopPayload } from '../services/workspace';
import { serviceSummary } from '../domain/engine';

const number = (value: number | null) => value == null ? 'Unavailable' : value.toLocaleString('en-GB', { maximumFractionDigits: 1 });
const money = (value: number, currency: string) => new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value / 100);
const link = 'text-[var(--color-atlas-blue)]';

export function SopInsights({ payload, view, base, query }: { payload: SopPayload; view: string; base: string; query?: string }) {
  const matches = (value: string) => !query || value.toLowerCase().includes(query.toLowerCase());
  if (view === 'products') {
    const products = new Map<string, typeof payload.rows>();
    for (const row of payload.rows) { const group = products.get(row.productId); if (group) group.push(row); else products.set(row.productId, [row]); }
    const selected = [...products.values()].filter(rows => matches(rows[0].code + ' ' + rows[0].name));
    return <section className="space-y-4"><h2 className="text-2xl font-semibold">Product intelligence</h2><p className="text-sm text-[var(--color-ink-muted)]">Forecast, commercial sources and stock cover in this retained version. Each product retains its own unit of measure.</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left"><tr>{['Product', 'Consensus', 'Remaining', 'Revenue', 'At-risk periods', 'Review'].map(label => <th className="p-3 font-medium" key={label}>{label}</th>)}</tr></thead><tbody>{selected.slice(0, 300).map(rows => {
      const first = rows[0], sum = (key: 'consensus' | 'remainingDemand' | 'revenueMinor') => rows.reduce((total, row) => total + row[key], 0);
      return <tr key={first.productId} className="border-t border-black/5"><td className="p-3"><Link className={link} href={`/products/${first.productId}`}>{first.code} ↗</Link><p className="mt-1 text-xs">{first.name}</p></td><td className="p-3">{number(sum('consensus'))} {first.unit}</td><td className="p-3">{number(sum('remainingDemand'))} {first.unit}</td><td className="p-3">{money(sum('revenueMinor'), payload.currency)}</td><td className="p-3">{rows.filter(row => (row.atRisk ?? 0) > 0).map(row => row.period).join(', ') || (rows.every(row => row.atRisk != null) ? 'None' : 'Supply unavailable')}</td><td className="p-3"><Link className={link} href={`${base}&view=demand&q=${encodeURIComponent(first.code)}`}>Demand layers</Link><br/><Link className={link} href={`${base}&view=supply&q=${encodeURIComponent(first.code)}`}>Supply cover</Link></td></tr>;
    })}</tbody></table></div><p className="text-xs text-[var(--color-ink-muted)]">{selected.length} products; showing up to 300.</p></section>;
  }
  if (view === 'customers') {
    const customers = new Map<string, typeof payload.service>();
    for (const row of payload.service.filter(row => row.currency === payload.currency)) { const group = customers.get(row.partyId); if (group) group.push(row); else customers.set(row.partyId, [row]); }
    const selected = [...customers.values()].filter(rows => matches(rows[0].customer));
    return <section className="space-y-4"><h2 className="text-2xl font-semibold">Customer intelligence</h2><p className="text-sm text-[var(--color-ink-muted)]">Source order history and balances at snapshot {payload.asOf}. Use Orders & Service for the current position.</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left"><tr>{['Customer', 'Orders', 'Open order value', 'Customer OTIF', 'Unavailable lines', 'Source orders'].map(label => <th className="p-3 font-medium" key={label}>{label}</th>)}</tr></thead><tbody>{selected.slice(0, 300).map(rows => {
      const first = rows[0], summary = serviceSummary(rows, 'requested', payload.currency), orders = [...new Map(rows.map(row => [row.id, row])).values()];
      const openValue = rows.reduce((total, row) => total + (row.quantity ? row.valueMinor * row.open / row.quantity : 0), 0);
      return <tr key={first.partyId} className="border-t border-black/5 align-top"><td className="p-3"><Link className={link} href={`/customers/${first.partyId}`}>{first.customer} ↗</Link></td><td className="p-3">{orders.length}</td><td className="p-3">{money(openValue, payload.currency)}</td><td className="p-3">{number(summary.lineRate)}{summary.lineRate == null ? '' : '%'}</td><td className="p-3">{summary.unavailableLines}</td><td className="p-3"><details><summary className="cursor-pointer">Inspect {orders.length} orders</summary>{orders.map(order => <Link className={`${link} mt-2 block`} href={`/sales/orders/${order.id}`} key={order.id}>{order.reference} ↗</Link>)}</details></td></tr>;
    })}</tbody></table></div></section>;
  }
  const projects = payload.inputs.filter(input => ['sales-project', 'opportunity'].includes(input.sourceType) && input.metricKey === 'sales_volume').filter(input => matches(input.label));
  return <section className="space-y-4"><h2 className="text-2xl font-semibold">Projects & opportunities</h2><p className="text-sm text-[var(--color-ink-muted)]">Commercial inputs retain their source plan, product, phase, probability and reason. Converted orders consume the grouped weighted contribution once in the demand calculation.</p><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left"><tr>{['Commercial input', 'Product / month', 'Raw demand', 'Probability', 'Weighted demand', 'Planning reason'].map(label => <th className="p-3 font-medium" key={label}>{label}</th>)}</tr></thead><tbody>{projects.slice(0, 500).map(input => {
    const product = payload.rows.find(row => row.productId === input.productId), href = input.sourceType === 'sales-project' ? `/sales/projects/${input.sourceId}` : `/crm/opportunities/${input.sourceId}`;
    return <tr className="border-t border-black/5 align-top" key={input.id}><td className="p-3"><Link className={link} href={href}>{input.label} ↗</Link><Link className="mt-2 block text-xs" href={`/plan/plans/${input.planId}?tab=inputs`}>Open source plan ↗</Link></td><td className="p-3">{product?.code ?? 'Product unavailable'}<p className="mt-1 text-xs">{input.periodKey}</p></td><td className="p-3">{number(input.value)} {product?.unit}</td><td className="p-3">{number(input.probability)}%</td><td className="p-3">{number(input.sourceInactive?0:input.value * input.probability / 100)} {product?.unit}</td><td className="max-w-sm p-3 text-xs">{input.note}{input.sourceInactive?<p className="mt-1 text-amber-700">Lost / inactive source excluded</p>:null}</td></tr>;
  })}</tbody></table></div><p className="text-xs text-[var(--color-ink-muted)]">{projects.length} input phases; showing up to 500.</p></section>;
}

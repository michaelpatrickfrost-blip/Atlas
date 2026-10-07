import Link from 'next/link';
import { getLiveSopService } from '../services/workspace';
import { serviceSummary } from '../domain/engine';

const field = 'mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm';
const quiet = 'rounded-full border border-black/10 px-4 py-2 text-sm font-medium';
const number = (value: number | null) => value == null ? 'Unavailable' : value.toLocaleString('en-GB', { maximumFractionDigits: 1 });
const filters = [
  ['open', 'Open balances'], ['dispatch-today', 'Going out today'], ['today', 'Due to customer today'],
  ['tomorrow', 'Due tomorrow'], ['week', 'Due in the next 7 days'], ['risk', 'At risk'],
  ['late', 'Late'], ['partial', 'Part delivered'], ['dispatched', 'Dispatched'],
  ['delivered', 'Delivered / closed'], ['unconfirmed', 'Unconfirmed dates'], ['all', 'All lines'],
];

export async function SopService({ cycleId, query }: { cycleId: string; query: Record<string, string | undefined> }) {
  const data = await getLiveSopService(cycleId), filter = query.filter ?? 'open';
  const day = (offset: number) => { const date = new Date(data.asOf + 'T00:00:00Z'); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10); };
  const products = new Map(data.products.map(product => [product.id, product]));
  const rows = data.rows.filter(row => row.currency === data.currency).filter(row => {
    switch (filter) {
      case 'dispatch-today': return row.events.some(event => event.plannedDispatchOn === data.asOf);
      case 'today': return row.requestedOn === data.asOf;
      case 'tomorrow': return row.requestedOn === day(1);
      case 'week': return !!row.requestedOn && row.requestedOn >= data.asOf && row.requestedOn <= day(7);
      case 'risk': return row.risk !== 'low';
      case 'late': return row.open > 0 && !!row.requestedOn && row.requestedOn < data.asOf;
      case 'partial': return row.delivered > 0 && row.open > 0 || row.events.some(event => event.deliveryQuantityVerified === false);
      case 'dispatched': return row.open > 0 && row.events.some(event => event.dispatchedOn && event.dispatchedOn <= data.asOf);
      case 'delivered': return row.open === 0;
      case 'unconfirmed': return !row.requestedOn || !row.promisedOn;
      case 'all': return true;
      default: return row.open > 0;
    }
  }).filter(row => !query.q || `${row.reference} ${row.customer} ${products.get(row.productId)?.code ?? ''}`.toLowerCase().includes(query.q.toLowerCase()));
  return <section className="space-y-6">
    <div><h2 className="text-2xl font-semibold">Orders & Service</h2>
      <p className="mt-2 max-w-4xl text-sm text-[var(--color-ink-muted)]">Live source read, {data.asOf}. Customer and Promise OTIF use verified quantities received by their respective delivery dates. Dispatch performance uses dispatch evidence. Closed status alone supplies no proof of customer delivery.</p></div>
    <div className="grid gap-4 lg:grid-cols-3">
      {([['requested', 'Customer OTIF'], ['promise', 'Promise OTIF'], ['dispatch', 'Dispatch OTIF']] as const).map(([basis, label]) => {
        const result = serviceSummary(data.rows, basis, data.currency);
        return <div className="rounded-2xl border border-black/10 p-5" key={basis}>
          <h3 className="font-medium">{label}</h3><p className="mt-3 text-3xl font-semibold">{number(result.lineRate)}{result.lineRate == null ? '' : '%'}</p>
          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">{result.passLines} passed / {result.measuredLines} measured lines · {result.unavailableLines} unavailable · {result.pendingLines} pending</p>
          <dl className="mt-4 flex flex-wrap gap-5 text-xs"><div><dt>Whole orders</dt><dd className="mt-1 font-medium">{number(result.orderRate)}{result.orderRate == null ? '' : '%'} · {result.measuredOrders} measured</dd></div><div><dt>Value weighted · {data.currency}</dt><dd className="mt-1 font-medium">{number(result.valueRate)}{result.valueRate == null ? '' : '%'}</dd></div></dl>
        </div>;
      })}
    </div>
    <form className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="cycle" value={cycleId}/><input type="hidden" name="view" value="service"/>
      <label className="text-sm">View<select name="filter" className={field} defaultValue={filter}>{filters.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="grow text-sm">Search<input className={field} name="q" defaultValue={query.q} placeholder="Order, customer or product"/></label><button className={quiet}>Filter</button>
    </form>
    <div className="overflow-x-auto rounded-2xl border border-black/10"><table className="w-full text-sm"><thead className="bg-black/[.025] text-left"><tr>{['Order / customer / product', 'Requested', 'Promised', 'Delivered / required', 'Customer OTIF', 'Promise OTIF', 'Risk & timeline'].map(label => <th className="p-3 font-medium" key={label}>{label}</th>)}</tr></thead><tbody>
      {rows.slice(0, 300).map(row => <tr className="border-t border-black/5 align-top" key={row.lineId}>
        <td className="min-w-48 p-3"><Link href={`/sales/orders/${row.id}`} className="font-medium text-[var(--color-atlas-blue)]">{row.reference} ↗</Link><Link href={`/customers/${row.partyId}`} className="mt-1 block text-xs">{row.customer}</Link><Link href={`/products/${row.productId}`} className="mt-1 block text-xs text-[var(--color-ink-muted)]">{products.get(row.productId)?.code ?? row.productId}</Link></td>
        <td className="whitespace-nowrap p-3">{row.requestedOn ?? 'Unconfirmed'}</td><td className="whitespace-nowrap p-3">{row.promisedOn ?? 'Unconfirmed'}</td>
        <td className="p-3 tabular-nums">{number(row.delivered)} / {number(row.quantity)}<p className="mt-1 text-xs text-[var(--color-ink-muted)]">{number(row.open)} open</p></td>
        <td className="p-3" title={row.requested.basis}>{row.requested.state}</td><td className="p-3" title={row.promise.basis}>{row.promise.state}</td>
        <td className="min-w-60 p-3"><details><summary className="cursor-pointer capitalize">{row.risk} · Explain</summary><ul className="mt-3 space-y-2 text-xs">
          {row.reasons.map(reason => <li key={reason}>{reason}</li>)}<li>{row.requested.basis}</li><li>{row.bookedOn} · Order entered</li>
          {row.events.map(event => <li key={event.id}><Link href={event.href} className="text-[var(--color-atlas-blue)]">{number(event.quantity)} allocated · {event.status} ↗</Link><p>Planned dispatch: {event.plannedDispatchOn ?? 'unrecorded'}<br/>Actual dispatch: {event.dispatchedOn ?? 'unrecorded'}<br/>Expected delivery: {event.eta ?? 'unrecorded'}<br/>Actual delivery: {event.deliveredOn ?? 'unrecorded'}{event.deliveryQuantityVerified === false ? ' · received quantity unverified' : ''}</p></li>)}
        </ul></details></td>
      </tr>)}
      {!rows.length ? <tr><td colSpan={7} className="p-8 text-center text-[var(--color-ink-muted)]">No order lines match this view.</td></tr> : null}
    </tbody></table></div>
    <p className="text-xs text-[var(--color-ink-muted)]">{rows.length} matching lines in {data.currency}; showing up to 300. Includes orders opened in the last 12 months and older open balances. Rates above cover the full loaded scope; missing evidence and future due dates are excluded and disclosed.</p>
  </section>;
}

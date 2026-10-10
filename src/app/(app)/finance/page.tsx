import Link from 'next/link';
import {getFinanceHome} from '@/modules/finance/services/queries';
import {setupFinance} from '@/modules/finance/services/commands';
import {ActionForm} from '@/modules/finance/components/action-form';
import {money} from '@/modules/finance/domain/money';
import {requireSession} from '@/core/auth/session';
import {assertCapability} from '@/core/permissions/check';
const field='w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';
export default async function Home({searchParams}:{searchParams:Promise<{entity?:string}>}){const session=await requireSession();assertCapability(session,'finance.overview.read');const {entity}=await searchParams,data=await getFinanceHome(entity);return <div className="space-y-7"><section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-5 text-slate-900 sm:p-7"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[.2em] text-blue-600">Financial command centre</p><h1 className="mt-3 text-3xl font-semibold">See the position. Know the next move.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Money in, money out, money held and money planned — connected to the records behind every figure.</p></div><Link className="h-fit rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white" href="/finance/documents/new">New document</Link></div><div className="mt-6 flex flex-wrap gap-2">{data.entities.map(e=><Link className={`rounded-full border px-4 py-2 text-xs ${e.id===data.entity?.id?'border-blue-200 bg-blue-50 text-blue-700':'border-slate-200 bg-white text-slate-600'}`} key={e.id} href={`/finance?entity=${e.id}`}>{e.name} · {e.currency}</Link>)}</div></section>
 {!data.entity?<section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Set up the first set of books</h2><p className="mt-2 mb-5 text-sm text-slate-500">Create a legal entity, starter chart and open accounting period. No opening balances are assumed.</p>{session.capabilities.has('finance.configure')?<ActionForm action={setupFinance} label="Create books"><div className="grid gap-3 sm:grid-cols-3"><input className={field} name="name" placeholder="Legal entity name" required/><input className={field} name="code" placeholder="Entity code e.g. NB" required/><select className={field} name="currency">{['GBP','EUR','USD'].map(c=><option key={c}>{c}</option>)}</select><label className="text-xs text-slate-500">Period starts<input className={field} type="date" name="startAt" required/></label><label className="text-xs text-slate-500">Period ends<input className={field} type="date" name="endAt" required/></label></div></ActionForm>:<p className="text-sm">A Finance administrator needs to configure the books.</p>}</section>:<><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.metrics.map((m,i)=><Link className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300" href={m.href} key={`${m.label}${i}`}><p className="text-xs text-slate-500">{m.label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{money(m.amount,m.currency)}</p><p className="mt-3 text-xs text-blue-700">Open contributing records →</p></Link>)}</div><section><div className="mb-4 flex justify-between"><h2 className="text-lg font-semibold">Your attention</h2><Link className="text-sm text-blue-700" href="/finance/control">Open control centre →</Link></div><div className="grid gap-3 sm:grid-cols-3">{data.exceptions.map(e=><Link key={e.label} href={e.href} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"><span className="text-sm">{e.label}</span><strong className={`rounded-lg px-3 py-1 ${e.count?'bg-amber-50 text-amber-800':'bg-emerald-50 text-emerald-800'}`}>{e.count}</strong></Link>)}</div></section><ServiceCreditList credits={data.serviceCredits}/></>}
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{title:'Money in',description:'Invoices, receipts and customer collections.',href:'/finance/receivables'},{title:'Money out',description:'Requests, purchasing and supplier obligations.',href:'/finance/payables'},{title:'Money held',description:'Bank balances, reconciliation and assets.',href:'/finance/banking'},{title:'Money planned',description:'Budgets, commitments and scenarios.',href:'/finance/planning'}].map(w=><Link className="rounded-2xl bg-slate-50 p-5" key={w.title} href={w.href}><h3 className="font-semibold">{w.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{w.description}</p></Link>)}</div><p className="text-xs text-slate-500">Figures come from configured central records. Forecasts, physical stock integrations and external feeds require their own verified sources.</p></div>;}

function ServiceCreditList({ credits }: { credits: Array<{ id: string; reference: string; title: string; status: string; gross: bigint; currency: string; party: { name: string } | null }> }) {
  if (!credits.length) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Credits from Customer Service</h2>
      <p className="mt-2 text-sm text-slate-500">A complaint, damage or other query asked for a credit against the customer. Open it and raise it on their account. Nothing is taken off the customer until it is posted.</p>
      <div className="mt-4 divide-y divide-slate-100">
        {credits.map((credit) => {
          const customer = credit.party?.name ?? "Customer";
          return (
            <Link key={credit.id} href={`/finance/documents/${credit.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span>
                <span className="font-medium text-blue-700">{credit.reference}</span>
                <span className="mt-1 block text-slate-500">{customer} · {credit.title}</span>
              </span>
              <span className="text-right">
                <strong>{money(credit.gross, credit.currency)}</strong>
                <span className="mt-1 block text-xs text-slate-400">{credit.status.replaceAll("_", " ")}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

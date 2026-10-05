'use client';
import { ActionForm } from '@/components/ui/action-form';
import { Button } from '@/components/ui/button';
import { savePlanningAction } from '@/app/(app)/stock/actions';
const input='mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm';
export type PlanningValues={productId:string;unit:string;safetyStock:number;leadTimeDays:number;monthlyUsage:number|null;historyMonthly:number};
/** The three figures the forecast and the production planner read. */
export function PlanningForm({productId,unit,safetyStock,leadTimeDays,monthlyUsage,historyMonthly}:PlanningValues) {
 return <ActionForm action={savePlanningAction}><div className="space-y-4">
  <input type="hidden" name="productId" value={productId}/>
  <div className="grid gap-4 sm:grid-cols-3">
   <label className="block text-xs font-medium">Safety stock ({unit})<input name="safetyStockLevel" type="number" min={0} step={1} defaultValue={safetyStock} className={input}/><span className="mt-1 block font-normal text-slate-500">Keep at least this much.</span></label>
   <label className="block text-xs font-medium">Lead time (days)<input name="leadTimeDays" type="number" min={0} max={730} step={1} defaultValue={leadTimeDays} className={input}/><span className="mt-1 block font-normal text-slate-500">Order to arrival, or time to make.</span></label>
   <label className="block text-xs font-medium">Expected usage a month ({unit})<input name="monthlyUsage" type="number" min={0} step={1} defaultValue={monthlyUsage??''} placeholder={historyMonthly?`${historyMonthly.toLocaleString('en-GB')} from history`:'From history'} className={input}/><span className="mt-1 block font-normal text-slate-500">Leave blank to use what actually left stock.</span></label>
  </div>
  <Button type="submit" variant="primary">Save planning</Button>
 </div></ActionForm>;
}

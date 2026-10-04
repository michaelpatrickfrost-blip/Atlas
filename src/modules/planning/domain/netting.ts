import type { InventorySnapshot, PlanningDemand } from '@/core/planning/types';
/** Coverage of what is still to deliver. Incoming production is planned supply, not stock on hand. */
export function buildCoverage(snapshot:InventorySnapshot,demand:PlanningDemand[],supply:{incoming?:Record<string,number>;delivered?:Record<string,number>}={}) {
 return snapshot.products.map(product=>{
  const onHand=snapshot.balances.filter(b=>b.productId===product.id).reduce((sum,b)=>sum+b.quantity,0);
  const incoming=supply.incoming?.[product.id]??0;
  const lines=demand.filter(d=>d.productId===product.id).sort((a,b)=>(a.requiredDate??'9999').localeCompare(b.requiredDate??'9999')||a.id.localeCompare(b.id));
  let remaining=onHand;
  const orders=lines.map(line=>{
   const open=Math.max(0,line.quantity-(supply.delivered?.[line.id]??0));
   const compatible=line.unitOfMeasure.trim().toLowerCase()===product.unitOfMeasure.trim().toLowerCase();
   const covered=compatible?Math.min(Math.max(remaining,0),open):0;
   if(compatible)remaining-=covered;
   return {...line,quantity:open,compatible,covered,shortage:compatible?open-covered:null};
  });
  const comparableDemand=orders.filter(d=>d.compatible).reduce((sum,d)=>sum+d.quantity,0);
  const forecasted=onHand+incoming-comparableDemand;
  return {...product,onHand,incoming,demand:comparableDemand,shortage:Math.max(0,-forecasted),forecasted,available:forecasted,projected:onHand-comparableDemand,orders,unitConflicts:orders.filter(d=>!d.compatible).length};
 });
}

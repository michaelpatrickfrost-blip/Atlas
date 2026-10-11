"use server";
import type { Prisma } from "@/generated/prisma/client";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { getModule } from "@/core/modules/registry";
import { writeAudit } from "@/core/audit/log";
import { demandForecast, monthlyDemand } from "../domain/demand-forecast";
import type { Session } from "@/core/auth/session";

async function projection(session:Session,productId:string,client:Prisma.TransactionClient=db){
 for(const capability of ["sales.order.read","customers.read","core.products.read"])assertCapability(session,capability);
 for(const moduleId of ["manufacturing","sales"])await assertModuleEnabled(session,moduleId);
 const now=new Date(); const month=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
 const start=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()-24,1)); const end=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+6,1));
 const product=await client.product.findFirst({where:{id:productId,organisationId:session.organisationId,active:true,kind:"PRODUCT"},select:{id:true,name:true,unitOfMeasure:true}});
 if(!product)throw new Error("Choose an active product in this company.");
 const provider=getModule("sales")?.businessPlanningProvider;if(!provider)throw new Error("Sales demand history is unavailable.");
 const source=await provider(session,{purpose:"forecast",startsOn:month.toISOString().slice(0,10),endsOn:end.toISOString().slice(0,10),historyStartsOn:start.toISOString().slice(0,10),productIds:[productId]},client);
 const forecasts=await client.manufacturingDemandForecast.findMany({where:{organisationId:session.organisationId,productId,periodStart:{gte:month,lt:end}},orderBy:{periodStart:"asc"}});
 const orders=source.orders??[];const historical=orders.filter(o=>o.requestedOn&&o.requestedOn>=start.toISOString().slice(0,10)&&o.requestedOn<month.toISOString().slice(0,10));
 const first=historical.map(o=>o.requestedOn!.slice(0,7)).sort()[0];
 const history:Array<{period:string;quantity:number}>=[];
 for(let i=0;i<24;i++){const period=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+i,1)).toISOString().slice(0,7);if(first&&period>=first)history.push({period,quantity:historical.filter(o=>o.requestedOn!.startsWith(period)).reduce((n,o)=>n+o.quantity,0)});}
 const model=demandForecast(history.map(r=>r.quantity));
 const months=Array.from({length:6},(_,i)=>{const period=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+i,1)).toISOString().slice(0,7);const booked=orders.filter(o=>o.requestedOn?.startsWith(period)||(i===0&&o.requestedOn&&o.requestedOn<month.toISOString().slice(0,10)&&!o.closed));const grossBookings=booked.reduce((n,o)=>n+o.quantity,0);const outstanding=booked.reduce((n,o)=>n+(o.closed?0:Math.max(0,o.quantity-(o.dispatchedQuantity??0))),0);const forecast=forecasts.find(f=>f.periodStart.toISOString().startsWith(period));const suggested=i===0?null:model.quantities[i]??null;const lastYearPeriod=new Date(Date.UTC(month.getUTCFullYear()-1,month.getUTCMonth()+i,1)).toISOString().slice(0,7);const lastYear=history.find(h=>h.period===lastYearPeriod)?.quantity??null;return {period,isCurrent:i===0,lastYear,grossBookings,outstanding,totalForecast:forecast?Number(forecast.quantity):null,published:Boolean(forecast?.sourceSopVersionId),suggested,...monthlyDemand(forecast?Number(forecast.quantity):0,grossBookings,outstanding)};});
 const fingerprint=createHash("sha256").update(JSON.stringify({product,orders,forecasts,history,months})).digest("hex");
 return {product,history,model,months,fingerprint,warnings:source.warnings??[]};
}
export async function previewDemandForecast(productId:string){
 const session=await requireSession();
 assertCapability(session,"manufacturing.plan.read");
 return db.$transaction(tx=>projection(session,productId,tx),{isolationLevel:"RepeatableRead",timeout:20000});
}
export async function saveForecastProposal(productId:string,fingerprint:string,rows:Array<{period:string;quantity:number}>,assumptions?:{basis:string;percent:number;add:number;fixed:number}){
 const session=await requireSession();
 assertCapability(session,"manufacturing.plan.manage");
 await db.$transaction(async tx=>{
 const preview=await projection(session,productId,tx);
 if(preview.fingerprint!==fingerprint)throw new Error("Sales demand or the forecast changed. Refresh the proposal before saving.");
 if(assumptions&&(!["best","last-year","recent-3","recent-6","saved","fixed"].includes(assumptions.basis)||[assumptions.percent,assumptions.add,assumptions.fixed].some(v=>!Number.isFinite(v))||assumptions.percent < -100||Math.abs(assumptions.percent)>10000||Math.abs(assumptions.add)>1e9||assumptions.fixed<0||assumptions.fixed>1e9))throw new Error("Enter valid forecast assumptions.");
 if(!rows.length||rows.length>6||new Set(rows.map(r=>r.period)).size!==rows.length)throw new Error("Select one to six unique forecast months.");
 for(const row of rows){const period=preview.months.find(m=>m.period===row.period);if(!period||period.published||period.isCurrent)throw new Error("Choose a future manual month. Approved S&OP demand must be revised through S&OP.");if(!Number.isFinite(row.quantity)||row.quantity<0||row.quantity>1000000000)throw new Error("Enter finite non-negative forecast quantities.");}
  // Recheck immutable review values, including absent rows, inside serializable isolation.
  const current=await tx.manufacturingDemandForecast.findMany({where:{organisationId:session.organisationId,productId,periodStart:{in:rows.map(r=>new Date(`${r.period}-01T00:00:00Z`))}}});
  for(const row of rows){const old=current.find(f=>f.periodStart.toISOString().startsWith(row.period));const reviewed=preview.months.find(m=>m.period===row.period)!;if(old?.sourceSopVersionId||(old?Number(old.quantity):null)!==reviewed.totalForecast)throw new Error("Forecast changed during review. Refresh before saving.");
   const periodStart=new Date(`${row.period}-01T00:00:00Z`);const notes=`Reviewed forecast: ${assumptions?.basis??preview.model.method??"manual"}${assumptions?`; ${assumptions.percent}% adjustment; ${assumptions.add} units added; fixed target ${assumptions.fixed}`:""}; ${preview.model.observations} complete months; ${preview.model.wape===null?"no measurable holdout demand":`holdout WAPE ${preview.model.wape.toFixed(1)}%`}`;
   const saved=await tx.manufacturingDemandForecast.upsert({where:{organisationId_productId_periodStart:{organisationId:session.organisationId,productId,periodStart}},create:{organisationId:session.organisationId,productId,periodStart,quantity:row.quantity,notes,createdByUserId:session.userId},update:{quantity:row.quantity,notes}});
   await writeAudit({organisationId:session.organisationId,actorUserId:session.userId,action:"manufacturing.forecast.proposal_saved",entityType:"ManufacturingDemandForecast",entityId:saved.id,after:{productId,periodStart,quantity:row.quantity,method:preview.model.method,assumptions,reviewFingerprint:fingerprint}},tx);
  }
 },{isolationLevel:"Serializable",timeout:20000});
 revalidatePath("/manufacturing/planning/forecast");revalidatePath("/manufacturing/planning");
}

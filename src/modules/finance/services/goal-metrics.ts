import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { requireFinance, documentScope } from "./access";
import { projectScope } from "@/core/permissions/work-access";
import { periodFilter, recentPeriod, safeMetricNumber } from "@/core/analytics/goal-period";
import type { AnalyticsProvider, GoalPeriod } from "@/core/analytics/types";
import type { Session } from "@/core/auth/session";
async function financial(session:Session,period:GoalPeriod,profit:boolean){
 assertCapability(session,"finance.ledger.read");await requireFinance(session,"finance.ledger.read");
 const projects=session.capabilities.has("projects.read")?await db.project.findMany({where:projectScope(session),select:{id:true}}):[];
 // Same document/project boundary as Finance's ledger; never infer profit from order value.
 const rows=await db.financeJournalLine.groupBy({by:["accountId"],where:{organisationId:session.organisationId,account:{organisationId:session.organisationId,type:{in:profit?["REVENUE","EXPENSE"]:["REVENUE"]}},journal:{organisationId:session.organisationId,status:"POSTED",accountingDate:periodFilter(period),documents:{every:documentScope(session)},lines:{every:{OR:[{projectId:null},{projectId:{in:projects.map(p=>p.id)}}]}}}},_sum:{debit:true,credit:true},_count:{_all:true}});
 const accounts=await db.financeAccount.findMany({where:{organisationId:session.organisationId,id:{in:rows.map(r=>r.accountId)}},select:{id:true,entity:{select:{currency:true}}}});
 const currencies=new Map<string,bigint>();for(const row of rows){const currency=accounts.find(a=>a.id===row.accountId)?.entity.currency;if(!currency)throw new Error("Account currency unavailable.");currencies.set(currency,(currencies.get(currency)??0n)+(row._sum.credit??0n)-(row._sum.debit??0n));}
 return {points:[...currencies].map(([label,value])=>({label,value:safeMetricNumber(value)})),sampleSize:rows.reduce((n,r)=>n+r._count._all,0),note:"Authorised posted journals only; entity base currencies, including reversals. Restricted documents/projects are excluded."};
}
export const financeGoalMetrics:AnalyticsProvider=[false,true].map(profit=>({id:profit?"finance.posted.profit":"finance.posted.revenue",name:profit?"Posted profit":"Posted revenue",subject:"Finance",definition:profit?"Posted revenue less all posted expenses for the goal's accounting dates. Includes reversals; uses entity base currency and authorised journals. This is the ledger result, not forecast profit or sales margin.":"Net credits to revenue accounts in posted journals, by accounting date. Includes reversals; authorised ledger scope and entity base currency.",grain:"One posted ledger line",capability:"finance.ledger.read",href:"/finance/ledger",snapshot:false,unit:"money",goalSuggestion:{name:profit?"Improve posted profit":"Grow posted revenue",direction:"AT_LEAST"},goalQuery:(s,p)=>financial(s,p,profit),query:async(s,since)=>(await financial(s,recentPeriod(since),profit)).points}));

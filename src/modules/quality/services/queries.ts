import { db } from "@/core/db/client";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { NCR_STATUSES, NCR_SEVERITIES } from "../domain/workflow";
import { QUALITY_CAPABILITIES } from "@/core/permissions/capabilities";

async function requireQuality(session: Session) {
  await assertModuleEnabled(session, "quality");
}

export async function qualityToday() {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.today);
  await requireQuality(session);
  const organisationId = session.organisationId;
  const allow=(cap:string)=>session.capabilities.has(cap);
  const [activeHolds, openNcr, criticalNcr, overdueActions, recentInspections] = await Promise.all([
    allow(QUALITY_CAPABILITIES.holdRead)?db.qualityHold.findMany({ where: { organisationId, status: "ACTIVE" }, include: { product: { select: { name: true, code: true } } }, orderBy: { placedAt: "desc" }, take: 20 }) : [],
    allow(QUALITY_CAPABILITIES.ncrRead)?db.nonConformance.findMany({ where: { organisationId, status: { not: "CLOSED" } }, include: { product: { select: { name: true } } }, orderBy: { reportedAt: "desc" }, take: 20 }) : [],
    allow(QUALITY_CAPABILITIES.ncrRead)?db.nonConformance.count({ where: { organisationId, status: { not: "CLOSED" }, severity: "CRITICAL" } }) : 0,
    allow(QUALITY_CAPABILITIES.ncrRead)?db.nonConformanceAction.findMany({ where: { organisationId, status: { in: ["OPEN", "DONE", "INEFFECTIVE"] }, OR: [{dueDate:{lte:new Date()}},{effectivenessReviewDate:{lte:new Date()}}] }, include: { ncr: { select: { number: true, title: true } } }, take: 20 }) : [],
    allow(QUALITY_CAPABILITIES.checkExecute)?db.qualityInspection.findMany({ where: { organisationId }, orderBy: { inspectedAt: "desc" }, take: 10, include: { product: { select: { name: true } } } }) : [],
  ]);
  return { activeHolds, openNcr, criticalNcr, overdueActions, recentInspections };
}

export async function specificationList() {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.specRead);
  await requireQuality(session);
  return db.qualitySpecification.findMany({
    where: { organisationId: session.organisationId },
    include: { product: { select: { name: true, code: true } }, characteristics: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function requireSpecification(session: Session, id: string) {
  const row = await db.qualitySpecification.findFirst({ where: { id, organisationId: session.organisationId }, include: { product: true, characteristics: { orderBy: { position: "asc" } } } });
  if (!row) throw new Error("Specification not found.");
  return row;
}

export async function specificationDetail(id: string) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.specRead);
  await requireQuality(session);
  return requireSpecification(session, id);
}

export async function controlPointList() {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.controlPointRead);
  await requireQuality(session);
  return db.qualityControlPoint.findMany({
    where: { organisationId: session.organisationId },
    include: { product: { select: { name: true, code: true } }, specification: { select: { code: true, revision: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function productOptions() {
  const session = await requireSession();
  await requireQuality(session);
  return db.product.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" }, take: 500 });
}

export async function warehouseOptions() {
  const session = await requireSession();
  await requireQuality(session);
  return db.warehouse.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" } });
}

export async function requireControlPoint(session: Session, id: string) {
  const row = await db.qualityControlPoint.findFirst({ where: { id, organisationId: session.organisationId }, include: { specification: { include: { characteristics: { orderBy: { position: "asc" } } } }, product: true } });
  if (!row) throw new Error("Control point not found.");
  return row;
}

export async function controlPointDetail(id: string) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.checkExecute);
  await requireQuality(session);
  return requireControlPoint(session, id);
}

export async function holdList(status?: string) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.holdRead);
  await requireQuality(session);
  return db.qualityHold.findMany({
    where: { organisationId: session.organisationId, ...(status ? { status: status as "ACTIVE" | "RELEASED" } : {}) },
    include: { product: { select: { name: true, code: true } } },
    orderBy: { placedAt: "desc" },
    take: 200,
  });
}

export async function ncrList(filters: { status?: string; severity?: string; q?:string; mine?:string; due?:string } = {}) {
 const session=await requireSession();assertCapability(session,QUALITY_CAPABILITIES.ncrRead);await requireQuality(session);
 const q=String(filters.q??"").trim().slice(0,200);const status=NCR_STATUSES.find(s=>s===filters.status),severity=NCR_SEVERITIES.find(s=>s===filters.severity);
 return db.nonConformance.findMany({where:{organisationId:session.organisationId,...(status?{status}:{}),...(severity?{severity}:{}),...(filters.mine==="1"?{ownerUserId:session.userId}:{}),...(filters.due==="overdue"?{dueAt:{lt:new Date(new Date().toISOString().slice(0,10))},status:{not:"CLOSED"}}:{}),...(q?{OR:[{number:{contains:q,mode:"insensitive"}},{title:{contains:q,mode:"insensitive"}},{defect:{contains:q,mode:"insensitive"}}]}:{})},include:{product:{select:{name:true,code:true}},hold:{select:{number:true,status:true}},_count:{select:{actions:true}}},orderBy:[{reportedAt:"desc"}],take:201});
}
export async function qualityWorkspaceOptions(){
 const session=await requireSession();if(!session.capabilities.has(QUALITY_CAPABILITIES.ncrRead)&&!session.capabilities.has(QUALITY_CAPABILITIES.ncrReport))assertCapability(session,QUALITY_CAPABILITIES.ncrRead);await requireQuality(session);
 const [products,members]=await Promise.all([db.product.findMany({where:{organisationId:session.organisationId},select:{id:true,name:true,code:true},orderBy:{name:"asc"},take:500}),db.membership.findMany({where:{organisationId:session.organisationId,active:true},select:{user:{select:{id:true,name:true}}},orderBy:{user:{name:"asc"}}})]);return {products,members:members.map(item=>item.user)};
}
export async function qualityActionBoard(filters:{mine?:string;due?:string;q?:string}={}){
 const session=await requireSession();assertCapability(session,QUALITY_CAPABILITIES.ncrRead);await requireQuality(session);
 return db.nonConformanceAction.findMany({where:{organisationId:session.organisationId,...(filters.mine==="1"?{ownerUserId:session.userId}:{}),...(filters.due==="overdue"?{status:{in:["OPEN","DONE","INEFFECTIVE"]},dueDate:{lt:new Date(new Date().toISOString().slice(0,10))}}:{}),...(filters.q?{description:{contains:String(filters.q).slice(0,200),mode:"insensitive"}}:{})},include:{ncr:{select:{number:true,title:true,status:true}}},orderBy:[{dueDate:{sort:"asc",nulls:"last"}},{createdAt:"desc"}],take:201});
}

export async function requireNcr(session: Session, id: string) {
  const row = await db.nonConformance.findFirst({
    where: { id, organisationId: session.organisationId },
    include: { product: true, hold: true, inspection: { include: { measurements: true, controlPoint: true } }, specification: true, actions: { orderBy: { createdAt: "asc" } } },
  });
  if (!row) throw new Error("NCR not found.");
  return row;
}

export async function ncrDetail(id: string) {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.ncrRead);
  await requireQuality(session);
  return requireNcr(session, id);
}

/** Similar-issue search: same product + overlapping defect wording, most recent first. Structured match, not semantic. */
export async function similarNcr(session: Session, productId: string | null, defect: string) {
  if (!productId) return [];
  const words = defect.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
  const rows = await db.nonConformance.findMany({ where: { organisationId: session.organisationId, productId }, orderBy: { reportedAt: "desc" }, take: 50, select: { id: true, number: true, title: true, defect: true, status: true, reportedAt: true } });
  if (!words.length) return rows.slice(0, 5);
  return rows.filter((row) => words.some((w) => row.defect.toLowerCase().includes(w) || row.title.toLowerCase().includes(w))).slice(0, 5);
}

export async function qualityReports() {
  const session = await requireSession();
  assertCapability(session, QUALITY_CAPABILITIES.reportRead);
  await requireQuality(session);
  const organisationId = session.organisationId;
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const [ncrs, inspections, actions, allOpen] = await Promise.all([
    db.nonConformance.findMany({ where: { organisationId, reportedAt: { gte: since } }, select: { defect: true, severity: true, status: true, source: true, reportedAt: true } }),
    db.qualityInspection.findMany({ where: { organisationId, inspectedAt: { gte: since } }, select: { result: true } }),
    db.nonConformanceAction.findMany({ where: { organisationId }, select: { status: true, dueDate: true, effectivenessReviewDate:true } }),
    db.nonConformance.findMany({where:{organisationId,status:{not:"CLOSED"}},select:{reportedAt:true}}),
  ]);
  const defectCounts = new Map<string, number>();
  for (const ncr of ncrs) defectCounts.set(ncr.defect, (defectCounts.get(ncr.defect) ?? 0) + 1);
  const pareto = [...defectCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([defect, count]) => ({ defect, count }));
  const now = new Date();
  const ageing = { "0-7": 0, "8-30": 0, "31-60": 0, "60+": 0 } as Record<string, number>;
  for (const ncr of allOpen) {
    const days = Math.floor((now.getTime() - ncr.reportedAt.getTime()) / 86400000);
    ageing[days <= 7 ? "0-7" : days <= 30 ? "8-30" : days <= 60 ? "31-60" : "60+"]++;
  }
  const totalInspections = inspections.length;
  const passed = inspections.filter((i) => i.result === "PASS").length;
  const firstPassYield = totalInspections ? Math.round((passed / totalInspections) * 1000) / 10 : null;
  const overdueActions = actions.filter((a) => a.status !== "VERIFIED" && a.dueDate && a.dueDate < now).length;
  const sources=Object.entries(ncrs.reduce<Record<string,number>>((counts,ncr)=>{counts[ncr.source]=(counts[ncr.source]??0)+1;return counts;},{}));
  const reviewsDue=actions.filter(action=>action.status!=="VERIFIED"&&action.effectivenessReviewDate&&action.effectivenessReviewDate<now).length;
  return { pareto, ageing, firstPassYield, totalInspections, overdueActions, reviewsDue, sources, ncrCount: ncrs.length };
}

export async function inspectionHistory(){const session=await requireSession();assertCapability(session,QUALITY_CAPABILITIES.checkExecute);await requireQuality(session);return db.qualityInspection.findMany({where:{organisationId:session.organisationId},include:{product:{select:{name:true}},controlPoint:{select:{name:true}}},orderBy:{inspectedAt:"desc"},take:50});}
export async function inspectionRecord(id:string){const session=await requireSession();assertCapability(session,QUALITY_CAPABILITIES.checkExecute);await requireQuality(session);return db.qualityInspection.findFirst({where:{id,organisationId:session.organisationId},include:{product:{select:{name:true,code:true}},controlPoint:{select:{name:true}},measurements:{where:{organisationId:session.organisationId},include:{characteristic:{select:{name:true,unit:true,lowerLimit:true,upperLimit:true}}}},holds:session.capabilities.has(QUALITY_CAPABILITIES.holdRead),nonConformances:session.capabilities.has(QUALITY_CAPABILITIES.ncrRead)}});}

export async function inspectionControlPoints(){const session=await requireSession();assertCapability(session,QUALITY_CAPABILITIES.checkExecute);await requireQuality(session);return db.qualityControlPoint.findMany({where:{organisationId:session.organisationId,active:true},include:{product:{select:{name:true}}},orderBy:{name:"asc"}});}

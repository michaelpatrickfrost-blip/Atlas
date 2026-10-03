"use server";
import { assertModuleEnabled } from "@/core/modules/access";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
export async function saveDashboard(form:FormData) {
 const session=await requireSession();
 assertCapability(session,SALES_CAPABILITIES.reportRead);
  await assertModuleEnabled(session, "crm");
 const name=String(form.get("name")??"").trim();
 const widgets=[...new Set(form.getAll("widget").map(String))];
 const allowed=['pipeline','winrate','prospects','stage','trend','owners','next-actions'];
 if(!name || name.length>80 || !widgets.length || widgets.some(w=>!allowed.includes(w))) throw new Error("Name your dashboard and select at least one widget.");
 await db.dashboard.upsert({where:{organisationId_userId_name:{organisationId:session.organisationId,userId:session.userId,name}},create:{organisationId:session.organisationId,userId:session.userId,name,widgets},update:{widgets}});
 revalidatePath("/crm/dashboards");
}

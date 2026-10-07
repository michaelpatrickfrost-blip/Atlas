import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { serviceCaseScope } from "@/core/permissions/service-access";
import { workScope } from "@/core/service-work/access";
import { readServiceFile } from "@/core/service-work/files";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const file = await db.serviceFile.findFirst({ where: { id, organisationId: session.organisationId } });
  if (!file) return new Response("Not found", { status: 404 });
  const permitted = file.caseId ? await db.serviceCase.findFirst({ where: { AND: [serviceCaseScope(session), { id: file.caseId }] }, select: { id: true } }) : file.workId ? await db.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: file.workId }] }, select: { id: true } }) : null;
  if(file.workId&&file.visibility==='INTERNAL'){
    const work=await db.serviceWorkItem.findFirst({where:{id:file.workId,organisationId:session.organisationId},select:{queueId:true}});
    if(!work||!await db.serviceQueueMember.findFirst({where:{queueId:work.queueId,organisationId:session.organisationId,userId:session.userId}}))return new Response("Not found",{status:404});
  }
  if (!permitted) return new Response("Not found", { status: 404 });
  const data = await readServiceFile(file.storageKey);
  return new Response(new Uint8Array(data), { headers: { "Content-Type": file.mime, "Content-Length": String(data.length), "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

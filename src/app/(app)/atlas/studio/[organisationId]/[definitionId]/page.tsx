import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { adminStudioContext } from "@/core/studio/definitions/admin";
import { StudioDefinitionView } from "@/modules/studio/definition-view";
export default async function Page({params,searchParams}:{params:Promise<{organisationId:string;definitionId:string}>;searchParams:Promise<{compare?:string}>}) {
  const actor=await requireSession();
  assertCapability(actor,ATLAS_CAPABILITIES.staff);
  const p=await params,session=await adminStudioContext(actor,p.organisationId);
  return <div className="space-y-5"><p className="text-sm font-medium">Company setup · {session.organisationName}</p><StudioDefinitionView session={session} definitionId={p.definitionId} root={`/atlas/studio/${session.organisationId}`} target={session.organisationId} compare={(await searchParams).compare}/></div>;
}

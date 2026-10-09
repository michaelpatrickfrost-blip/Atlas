import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES } from "@/core/studio/permissions";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { StudioDefinitionView } from "@/modules/studio/definition-view";
export default async function Page({params,searchParams}:{params:Promise<{definitionId:string}>;searchParams:Promise<{compare?:string}>}) {
  const session=await requireSession();
  assertCapability(session,STUDIO_CAPABILITIES.read);
  if(session.capabilities.has(ATLAS_CAPABILITIES.staff)) redirect("/atlas/studio");
  return <StudioDefinitionView session={session} definitionId={(await params).definitionId} compare={(await searchParams).compare}/>;
}

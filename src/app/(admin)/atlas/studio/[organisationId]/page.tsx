import { ConsoleNav } from "@/app/(admin)/atlas/console-nav";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { adminStudioContext } from "@/core/studio/definitions/admin";
import { StudioLibrary } from "@/modules/studio/library";
export default async function Page({params}:{params:Promise<{organisationId:string}>}) {
  const actor=await requireSession();
  assertCapability(actor,ATLAS_CAPABILITIES.staff);
  const session=await adminStudioContext(actor,(await params).organisationId);
  return <div className="space-y-5"><ConsoleNav organisationId={session.organisationId} current="studio"/><p className="text-sm font-medium">Company setup · {session.organisationName}</p><StudioLibrary session={session} root={`/atlas/studio/${session.organisationId}`} target={session.organisationId}/></div>;
}

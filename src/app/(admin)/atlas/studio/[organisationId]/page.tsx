import { ConsoleNav } from "@/app/(admin)/atlas/console-nav";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { adminStudioContext } from "@/core/studio/definitions/admin";
import { ActionForm } from "@/components/ui/action-form";
import { openVisualStudio } from "@/app/(studio)/design-studio/actions";
import { StudioLibrary } from "@/modules/studio/library";
export default async function Page({params}:{params:Promise<{organisationId:string}>}) {
  const actor=await requireSession();
  assertCapability(actor,ATLAS_CAPABILITIES.staff);
  const session=await adminStudioContext(actor,(await params).organisationId);
  return <div className="space-y-5"><ConsoleNav organisationId={session.organisationId} current="studio"/><p className="text-sm font-medium">Company setup · {session.organisationName}</p><ActionForm action={openVisualStudio} label="Open visual Studio" className="rounded-2xl border border-blue-100 bg-blue-50 p-6"><input type="hidden" name="organisationId" value={session.organisationId}/><h2 className="text-lg font-semibold">Design this business</h2><p className="mt-2 text-sm text-slate-600">Open the full-screen design workspace for {session.organisationName}. Business data access is checked using your current account.</p></ActionForm><StudioLibrary session={session} root={`/atlas/studio/${session.organisationId}`} target={session.organisationId}/></div>;
}

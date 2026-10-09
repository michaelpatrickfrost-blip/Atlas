import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES } from "@/core/studio/permissions";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { StudioLibrary } from "@/modules/studio/library";
export default async function Page() {
  const session=await requireSession();
  assertCapability(session,STUDIO_CAPABILITIES.read);
  if(session.capabilities.has(ATLAS_CAPABILITIES.staff)) redirect("/atlas/studio");
  return <StudioLibrary session={session}/>;
}

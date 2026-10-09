import Link from "next/link";
import type { Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { listDefinitions } from "@/core/studio/definitions/service";
import { Card } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { create } from "@/app/(app)/studio/actions";
export async function StudioLibrary({session,root="/studio",target}: {session:Session;root?:string;target?:string}) {
  assertCapability(session, CAP.read);
  const definitions = await listDefinitions(session);
  return <div className="space-y-6">
    <div><h2 className="text-2xl font-semibold">Configuration library</h2><p className="mt-2 text-sm text-slate-600">Keep drafts separate from published configuration. Activate a reviewed version when it is ready.</p></div>
    <Card className="p-6"><h3 className="font-semibold">Your definitions</h3><ul className="mt-4 divide-y divide-slate-100">{definitions.map(d => <li key={d.id} className="flex flex-wrap justify-between gap-2 py-3"><Link className="font-medium text-blue-700" href={`${root}/${d.id}`}>{d.name}</Link><span className="text-sm text-slate-500">{d.retiredAt ? "Retired" : d.activeVersionId ? "Active" : "Not active"} · {d.latestVersion} published versions</span></li>)}</ul>{!definitions.length && <p className="mt-4 text-sm text-slate-500">Create a capability set to review the approved capabilities available to this company.</p>}</Card>
    {can(session, CAP.edit) && <Card className="p-6"><h3 className="font-semibold">New capability set</h3><ActionForm action={create} className="mt-4 grid gap-4" label="Create draft">
      {target && <input type="hidden" name="organisationId" value={target}/>}
      <label className="grid gap-1 text-sm">Name<input name="name" required maxLength={150} className="rounded-lg border p-2" /></label>
      <label className="grid gap-1 text-sm">Description<textarea name="description" aria-label="Description" maxLength={2000} className="rounded-lg border p-2" /></label>
    </ActionForm></Card>}
  </div>;
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { getDefinition, compareVersions } from "@/core/studio/definitions/service";
import { kernelPayloadSchema } from "@/core/studio/compiler/kernel";
import { studioRegistry } from "@/core/studio/registry/runtime";
import { Card } from "@/components/ui/card";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { DraftEditor } from "@/modules/studio/draft-editor";
import { ReferenceComparison } from "@/modules/studio/reference-comparison";
import { save, validate, publish, activate } from "@/app/(app)/studio/actions";
const savedCheckSchema = z.object({ checksum:z.string().regex(/^[a-f0-9]{64}$/), warnings:z.array(z.string()), validatedRevision:z.number().int().nonnegative() });
export async function StudioDefinitionView({session,definitionId,root="/studio",target,compare}: {session:Session;definitionId:string;root?:string;target?:string;compare?:string}) {
  assertCapability(session, CAP.read);
  const definition = await getDefinition(session, definitionId);
  if (!definition || !definition.draft) notFound();
  if (definition.kind !== "capabilitySet") return <div className="space-y-6">
    <Link className="text-sm text-blue-700" href={root}>← Business setup</Link>
    <Card className="p-6"><h2 className="text-2xl font-semibold">{definition.name}</h2><p className="mt-3 text-sm text-slate-600">The visual editor for this configuration is not available yet. Your saved definition is preserved.</p></Card>
  </div>;
  const draft = definition.draft, payload = kernelPayloadSchema.parse(draft.payload);
  const catalogue = (await studioRegistry().discover(session)).filter(d => !["command", "integration"].includes(d.kind));
  const references = catalogue.map(d => ({ id: d.id, version: d.version, schemaHash: d.schemaHash, contractHash: d.contractHash }));
  for (const ref of payload.references) if (!references.some(r => r.id === ref.id && r.version === ref.version)) references.push(ref);
  const comparison = compare && definition.versions[0] ? await compareVersions(session, definition.id, compare, definition.versions[0].id) : null;
  const check = savedCheckSchema.safeParse(draft.validation);
  return <div className="space-y-6">
    <Link className="text-sm text-blue-700" href={root}>← Business setup</Link>
    <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-600">Advanced setup · Reference set</p><h2 className="text-2xl font-semibold">{definition.name}</h2><p className="mt-2 text-sm text-slate-500">Draft revision {draft.revision} · {definition.activeVersionId ? "A published reference set is active" : "No active reference set"}</p></div>
    <Card className="p-6"><h3 className="font-semibold">Reference selection</h3><p className="mt-2 text-sm leading-6 text-slate-600">This technical record lists approved data references. It does not design a template, screen or dashboard. The visual designer is still being built.</p>
      {can(session, CAP.edit) ? <DraftEditor action={save}>
        {target && <input type="hidden" name="organisationId" value={target}/>}<input type="hidden" name="id" value={definition.id}/><input type="hidden" name="revision" value={draft.revision}/>
        <label className="grid gap-1 text-sm">Description<textarea name="description" aria-label="Description" maxLength={2000} defaultValue={payload.description} className="rounded-lg border p-2" /></label>
        <fieldset className="space-y-2"><legend className="mb-2 font-medium">Approved data references</legend>{references.map(ref => { const descriptor = catalogue.find(d => d.id === ref.id && d.version === ref.version); return <label key={`${ref.id}@${ref.version}`} className="flex items-start gap-3 text-sm"><input type="checkbox" name="reference" value={JSON.stringify(ref)} defaultChecked={payload.references.some(r => r.id === ref.id && r.version === ref.version)} /><span>{descriptor?.label ?? "Unavailable reference"} <span className="text-xs text-slate-500">Version {ref.version}{descriptor?.lifecycle === "deprecated" ? " · Deprecated" : ""}</span></span></label>; })}{!references.length && <p className="text-sm text-slate-500">Enable a source app and grant its read permission to use its data references.</p>}</fieldset>
        <details className="rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-xs font-medium text-slate-500">Technical reference IDs</summary><ul className="mt-3 space-y-2 text-xs text-slate-500">{references.map(ref=><li key={`${ref.id}@${ref.version}`} className="break-all">{ref.id} · v{ref.version}</li>)}</ul></details>
        <p className="text-xs text-slate-500">If another editor saves first, your changes stay in this form. Open the <Link href={`${root}/${definition.id}`} target="_blank" className="text-blue-700">current saved draft</Link> to compare before reloading.</p>
      </DraftEditor> : <p className="mt-4 text-sm">{payload.description || "No description"} · {payload.references.length} references</p>}
      {can(session, CAP.edit) && <ActionForm action={validate} className="mt-4">{target && <input type="hidden" name="organisationId" value={target}/>}<input type="hidden" name="id" value={definition.id}/><input type="hidden" name="revision" value={draft.revision}/><Button>Validate saved draft</Button></ActionForm>}
      {draft.validation !== null && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm" aria-label="Validation results">
        <p className="font-medium">{!check.success || check.data.validatedRevision !== draft.revision ? "Check this saved draft again before publishing." : check.data.warnings.length ? "Review the items below before publishing." : "Ready to publish"}</p>
        {check.success && <><p className="mt-2 text-slate-500">Checked draft revision {check.data.validatedRevision}. Publishing and activation are separate steps.</p>
          {!!check.data.warnings.length && <ul className="mt-3 space-y-2 text-slate-600">{check.data.warnings.map((warning,i)=><li key={i}>{catalogue.reduce((message,d)=>message.replaceAll(`${d.id}@${d.version}`,`${d.label} (version ${d.version})`),warning)}</li>)}</ul>}
        </>}
      </div>}
      {can(session, CAP.publish) && <ActionForm action={publish} className="mt-4 space-y-3">{target && <input type="hidden" name="organisationId" value={target}/>}<input type="hidden" name="id" value={definition.id}/><input type="hidden" name="revision" value={draft.revision}/><label className="flex gap-2 text-sm"><input type="checkbox" name="acknowledgeWarnings" />I acknowledge any validation warnings.</label><Button variant="primary">Publish saved draft</Button><p className="text-xs text-slate-500">Publishing creates an immutable version. Activation is a separate action.</p></ActionForm>}
    </Card>
    <Card className="p-6"><h3 className="font-semibold">Published history</h3><ul className="mt-4 space-y-4">{definition.versions.map(v => <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"><div><p className="font-medium">v{v.semanticVersion} {v.id === definition.activeVersionId && "· Active"}</p><p className="text-xs text-slate-500">{v.publishedAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}</p><Link className="text-xs text-blue-700" href={`${root}/${definition.id}?compare=${v.id}`}>Compare with latest</Link></div>{can(session, CAP.publish) && v.id !== definition.activeVersionId && <ActionForm action={activate}>{target && <input type="hidden" name="organisationId" value={target}/>}<input type="hidden" name="id" value={definition.id}/><input type="hidden" name="versionId" value={v.id}/><input type="hidden" name="revision" value={definition.revision}/><Button>{v.version < definition.latestVersion ? "Roll back to this version" : "Activate this version"}</Button></ActionForm>}</li>)}</ul>{!definition.versions.length && <p className="mt-4 text-sm text-slate-500">No published versions yet.</p>}</Card>
    {comparison && <ReferenceComparison left={comparison.left} right={comparison.right} labels={new Map(catalogue.map(d=>[`${d.id}@${d.version}`,d.label]))}/>}
  </div>;
}

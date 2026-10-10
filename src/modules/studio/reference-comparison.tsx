import { kernelPayloadSchema } from "@/core/studio/compiler/kernel";
import { Card } from "@/components/ui/card";

type Version = { version: number; payload: unknown };
export function ReferenceComparison({ left, right, labels }: { left: Version; right: Version; labels: ReadonlyMap<string, string> }) {
  const before = kernelPayloadSchema.parse(left.payload), after = kernelPayloadSchema.parse(right.payload);
  const key = (ref: typeof before.references[number]) => `${ref.id}@${ref.version}`;
  const previous = new Map(before.references.map(ref => [key(ref), ref]));
  const next = new Map(after.references.map(ref => [key(ref), ref]));
  const changes = [...new Set([...previous.keys(), ...next.keys()])].flatMap(id => {
    const a = previous.get(id), b = next.get(id);
    if (a && b && a.schemaHash === b.schemaHash && a.contractHash === b.contractHash) return [];
    return [{ id, reference: b ?? a!, status: !a ? "Added" : !b ? "Removed" : "Reference details changed" }];
  });
  return <Card className="p-6" aria-label="Version comparison">
    <h3 className="text-lg font-semibold">Version comparison</h3>
    <p className="mt-2 text-sm leading-6 text-slate-500">Compare this reference set with its latest published version. These are setup references; they do not contain a screen or template design.</p>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {[{ version: left.version, payload: before, title: "Selected version" }, { version: right.version, payload: after, title: "Latest published version" }].map(({ version, payload, title }, i) => <section key={i} className="min-w-0 rounded-xl border border-slate-200 p-4">
        <p className="text-xs font-medium text-slate-500">{title}</p><h4 className="mt-1 font-semibold">Version {version}</h4>
        <p className="mt-4 text-sm font-medium">Description</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{payload.description || "No description"}</p>
        <p className="mt-4 text-sm font-medium">Selected data references</p>
        <ul className="mt-2 space-y-2 text-sm text-slate-600">{payload.references.map(ref => <li key={key(ref)} className="break-words">{labels.get(key(ref)) ?? "Unavailable data reference"} <span className="text-xs text-slate-500">· Version {ref.version}</span></li>)}</ul>
        {!payload.references.length && <p className="mt-2 text-sm text-slate-500">None selected</p>}
      </section>)}
    </div>
    <div className="mt-5 rounded-xl bg-slate-50 p-4"><h4 className="text-sm font-semibold">What changed</h4>
      <p className="mt-2 text-sm text-slate-600">{before.description === after.description ? "The description is unchanged." : "The description changed."}</p>
      {changes.length ? <ul className="mt-3 space-y-2 text-sm text-slate-600">{changes.map(change => <li key={change.id}><span className="mr-2 inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium">{change.status}</span>{labels.get(change.id) ?? "Unavailable data reference"} · Version {change.reference.version}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Data references are unchanged.</p>}
    </div>
  </Card>;
}

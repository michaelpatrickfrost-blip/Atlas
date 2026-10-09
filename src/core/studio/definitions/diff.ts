import { kernelPayloadSchema } from "../compiler/kernel";
export type DraftDifference = { path: string; saved: string; submitted: string };
export function compareDraftPayloads(savedValue: unknown, submittedValue: unknown): DraftDifference[] {
  const saved = kernelPayloadSchema.parse(savedValue), submitted = kernelPayloadSchema.parse(submittedValue);
  const differences: DraftDifference[] = [];
  if (saved.description !== submitted.description) differences.push({ path: "Description", saved: saved.description, submitted: submitted.description });
  const key = (ref: typeof saved.references[number]) => `${ref.id}@${ref.version}`;
  const previous = new Map(saved.references.map(ref => [key(ref),ref]));
  const next = new Map(submitted.references.map(ref => [key(ref),ref]));
  for (const id of [...new Set([...previous.keys(),...next.keys()])].sort()) {
    const a=previous.get(id),b=next.get(id);
    if (JSON.stringify(a) !== JSON.stringify(b)) differences.push({ path: id, saved: a ? `${a.schemaHash} / ${a.contractHash}` : "Not selected", submitted: b ? `${b.schemaHash} / ${b.contractHash}` : "Not selected" });
  }
  return differences;
}

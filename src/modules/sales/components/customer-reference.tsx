import Link from "next/link";

/** Historical sales retain their customer pointer, even after its identity is deleted. */
export function CustomerReference({ party, canRead, className, arrow = false }: {
  party: { id: string; name: string; identityScrubbed: boolean };
  canRead: boolean;
  className?: string;
  arrow?: boolean;
}) {
  if (party.identityScrubbed) return <span className={className} title="Customer deleted; historical document retained">Deleted customer</span>;
  if (!canRead) return <span className={className}>{party.name}</span>;
  return <Link href={`/customers/${party.id}`} className={className}>{party.name}{arrow ? " →" : ""}</Link>;
}

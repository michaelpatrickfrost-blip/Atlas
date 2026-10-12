import Link from 'next/link';

export type ReferenceNavigationLinks = { sourceHref?: string | null; whereUsedHref?: string | null };
const safe = (href: string | null | undefined) => href?.startsWith('/design-studio/') && !/[\\\r\n]/.test(href) ? href : null;
/** Trusted presentation links only. Opening a link never grants source access. */
export function ReferenceNavigationControls({ sourceHref, whereUsedHref, label = 'Selected design' }: ReferenceNavigationLinks & { label?: string }) {
  const source = safe(sourceHref), usage = safe(whereUsedHref);
  if (!source && !usage) return null;
  return <nav aria-label={`${label} references`} className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-blue-600">
    {source && <Link href={source} target="_blank" rel="noopener noreferrer">Go to source · current draft<span className="sr-only"> (opens in a new tab)</span></Link>}
    {usage && <Link href={usage} target="_blank" rel="noopener noreferrer">Where used · saved version<span className="sr-only"> (opens in a new tab)</span></Link>}
  </nav>;
}

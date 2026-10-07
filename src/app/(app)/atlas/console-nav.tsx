import Link from "next/link";

export function ConsoleNav({ organisationId, current }: { organisationId?: string; current: "companies" | "account" | "setup" | "users" | "offboarding" }) {
  if (!organisationId) return null;
  const links = [
    { id: "account", href: `/atlas/${organisationId}`, label: "Account & profile" },
    { id: "users", href: `/atlas/${organisationId}/users`, label: "Users & access" },
    { id: "setup", href: `/atlas/${organisationId}/setup`, label: "Data setup" },
    { id: "offboarding", href: `/atlas/${organisationId}/offboarding`, label: "Archive & export" },
  ];
  return <div className="space-y-4"><Link href="/atlas" className="text-xs text-slate-500 hover:text-blue-600">← All companies</Link><nav className="flex flex-wrap gap-1 border-b border-slate-200" aria-label="Company administration">{links.map(link => <Link key={link.id} href={link.href} aria-current={link.id === current ? "page" : undefined} className={`border-b-2 px-4 py-3 text-sm ${link.id === current ? "border-blue-600 font-medium text-blue-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>{link.label}</Link>)}</nav></div>;
}

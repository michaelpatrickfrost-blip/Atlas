import Link from "next/link";

export function ConsoleNav({ organisationId, current }: { organisationId?: string; current: "companies" | "account" | "setup" }) {
  const links = [
    { id: "companies", href: "/atlas", label: "Companies" },
    ...(organisationId ? [
      { id: "account", href: `/atlas/${organisationId}`, label: "Account & users" },
      { id: "setup", href: `/atlas/${organisationId}/setup`, label: "Data setup" },
    ] : []),
  ] as const;
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Atlas console">
      {links.map((link) => (
        <Link key={link.id} href={link.href} aria-current={link.id === current ? "page" : undefined} className={`rounded-full px-4 py-2 text-xs font-medium ${link.id === current ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{link.label}</Link>
      ))}
    </nav>
  );
}

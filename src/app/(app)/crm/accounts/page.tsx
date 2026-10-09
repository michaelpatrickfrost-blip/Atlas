import Link from "next/link";
import { Building2, Users, StickyNote, CalendarDays } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { DataTable } from "@/components/ui/table";
import { StatusPill } from "@/components/ui/status-pill";
import { WorkspaceHeading, WorkspaceStats } from "@/components/ui/workspace";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string }>;
}) {
  const session = await requireSession();
  assertCapability(session, "customers.read");
  await assertModuleEnabled(session, "crm");
  const query = await searchParams;
  const accounts = await db.party.findMany({
    where: {
      organisationId: session.organisationId,
      identityScrubbed: false,
      archived: false,
      ...(query.scope === "mine"
        ? { accountManagerUserId: session.userId }
        : {}),
      ...(query.q
        ? {
            OR: [
              {
                name: { contains: query.q.slice(0, 200), mode: "insensitive" },
              },
              {
                customerCode: {
                  contains: query.q.slice(0, 200),
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      customerCode: true,
      status: true,
      accountManagerUserId: true,
      contacts: {
        where: { identityScrubbed: false, status: "ACTIVE" },
        select: { firstName: true, surname: true, jobTitle: true },
        orderBy: { isPrimary: "desc" },
        take: 1,
      },
      notes: {
        where: can(session, "customers.restricted_notes.read")
          ? {}
          : { restricted: false },
        select: { id: true },
        take: 100,
      },
      _count: {
        select: {
          contacts: { where: { identityScrubbed: false, status: "ACTIVE" } },
        },
      },
    },
    orderBy: { name: "asc" },
    take: 501,
  });
  const rows = accounts.slice(0, 500);
  return (
    <div className="min-w-0 space-y-5">
      <WorkspaceHeading
        eyebrow="CRM accounts"
        title="Relationships, with the full picture"
        description="Prepare for the next conversation. Open an account for shared notes, key people, deals and appointments, all linked to the customer record."
        actions={
          can(session, "customers.create") && (
            <Link
              href="/customers/new"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
            >
              Add customer
            </Link>
          )
        }
      />
      <WorkspaceStats
        items={[
          {
            label: "Matching accounts",
            value: rows.length,
            hint: "In this view",
            icon: Building2,
          },
          {
            label: "Managed by you",
            value: rows.filter(
              (row) => row.accountManagerUserId === session.userId,
            ).length,
            icon: Users,
          },
          {
            label: "Accounts with notes",
            value: rows.filter((row) => row.notes.length).length,
            hint: "Shared customer context",
            icon: StickyNote,
          },
          {
            label: "Active contacts",
            value: rows.reduce((total, row) => total + row._count.contacts, 0),
            hint: "People at these accounts",
            icon: CalendarDays,
          },
        ]}
      />
      <form className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <input
          name="q"
          type="search"
          aria-label="Search CRM accounts"
          placeholder="Search account name or code"
          defaultValue={query.q}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
        />
        <select
          name="scope"
          aria-label="Account portfolio"
          defaultValue={query.scope ?? "all"}
          className="rounded-xl border border-slate-200 px-3 py-3 text-sm"
        >
          <option value="all">All accounts</option>
          <option value="mine">My accounts</option>
        </select>
        <button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white">
          Search
        </button>
      </form>
      <DataTable
        rows={rows}
        getHref={(row) => `/crm/accounts/${row.id}`}
        emptyLabel="No accounts match this view."
        columns={[
          {
            header: "Account",
            render: (row) => (
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 font-semibold text-blue-700">
                  {row.name.slice(0, 2).toUpperCase()}
                </span>
                <span>
                  <span className="block font-semibold">{row.name}</span>
                  <span className="text-xs text-slate-400">
                    {row.customerCode}
                  </span>
                </span>
              </span>
            ),
          },
          {
            header: "Key contact",
            render: (row) =>
              row.contacts[0] ? (
                <span>
                  <span className="block">
                    {row.contacts[0].firstName} {row.contacts[0].surname}
                  </span>
                  <span className="text-xs text-slate-400">
                    {row.contacts[0].jobTitle}
                  </span>
                </span>
              ) : (
                <span className="text-slate-400">Add a contact</span>
              ),
          },
          { header: "People", render: (row) => row._count.contacts },
          {
            header: "Notes",
            render: (row) =>
              row.notes.length ? (
                <span className="inline-flex items-center gap-2 text-blue-600">
                  <StickyNote size={14} />
                  {row.notes.length === 100 ? "100+" : row.notes.length}
                </span>
              ) : (
                "—"
              ),
          },
          {
            header: "Status",
            render: (row) => (
              <StatusPill
                label={row.status.toLowerCase().replaceAll("_", " ")}
                tone={
                  row.status === "ACTIVE"
                    ? "success"
                    : row.status === "ON_HOLD"
                      ? "warning"
                      : "neutral"
                }
              />
            ),
          },
        ]}
      />
      {accounts.length > 500 && (
        <p className="text-xs text-amber-700">
          Showing 500 accounts. Search or choose My accounts to narrow the list.
        </p>
      )}
    </div>
  );
}

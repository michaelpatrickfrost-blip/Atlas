"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, ChevronRight, ChevronUp, MapPin, Network, UserRound } from "lucide-react";
import { HierarchyBuilder } from "@/components/customers/hierarchy-builder";
import { moveCustomer, placeCustomer, setContactReportsTo } from "@/core/customers/hierarchy-actions";
import { setInvoiceAccount } from "@/core/customers/trading-actions";
import { descendantAccountIds, hierarchyAccountIds, nextHierarchyParent, orderedSiblings, reportingDescendantIds } from "@/core/customers/hierarchy";
import type { MapAccount, MapPerson } from "@/core/customers/map-data";

const ROLE_LABEL: Record<string, string> = { GROUP: "Group", CUSTOMER: "Business", BRANCH: "Branch" };
const TONE: Record<string, { chip: string; icon: string; line: string }> = {
  GROUP: { chip: "bg-violet-50 text-violet-700", icon: "bg-violet-100 text-violet-700", line: "border-violet-200" },
  CUSTOMER: { chip: "bg-blue-50 text-blue-700", icon: "bg-blue-100 text-blue-700", line: "border-blue-200" },
  BRANCH: { chip: "bg-teal-50 text-teal-800", icon: "bg-teal-100 text-teal-800", line: "border-teal-200" },
};
const AVATAR = ["bg-blue-100 text-blue-800", "bg-violet-100 text-violet-800", "bg-teal-100 text-teal-800", "bg-amber-100 text-amber-800"];
const selectClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500";

function roleLabel(role: string) {
  return ROLE_LABEL[role] ?? "Business";
}
function tone(role: string) {
  return TONE[role] ?? TONE.CUSTOMER;
}
function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""}`.toUpperCase();
}
function avatarClass(name: string) {
  return AVATAR[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR.length];
}

export function AccountMap({
  accounts,
  people,
  focusId,
  canEdit,
  canCreate,
  canInvoice,
  canPeople,
}: {
  accounts: MapAccount[];
  people: MapPerson[];
  focusId?: string;
  canEdit: boolean;
  canCreate: boolean;
  canInvoice: boolean;
  canPeople: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string>(focusId ? `account:${focusId}` : "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const pool = useMemo(() => {
    if (!focusId) return accounts;
    const family = new Set(hierarchyAccountIds(accounts, focusId));
    return accounts.filter((account) => family.has(account.id));
  }, [accounts, focusId]);

  const needle = query.trim().toLowerCase();
  function accountVisible(account: MapAccount, seen = new Set<string>()): boolean {
    if (seen.has(account.id)) return false;
    const next = new Set(seen);
    next.add(account.id);
    const peopleHere = people.filter((person) => person.partyId === account.id);
    const text = `${account.name} ${account.customerCode} ${account.customerGroup ?? ""} ${account.invoiceAccountName ?? ""} ${account.accountManager ?? ""}`.toLowerCase();
    const personHit = peopleHere.some((person) => `${person.name} ${person.jobTitle ?? ""}`.toLowerCase().includes(needle));
    const self = (!role || account.hierarchyRole === role) && (!needle || text.includes(needle) || personHit);
    const childHit = orderedSiblings(pool, account.id).some((child) => accountVisible(child, next));
    return self || childHit;
  }

  const roots = pool
    .filter((account) => !account.parentPartyId || !pool.some((parent) => parent.id === account.parentPartyId))
    .sort((a, b) => (a.hierarchyRole === "GROUP" ? 0 : a.hierarchyRole === "BRANCH" ? 2 : 1) - (b.hierarchyRole === "GROUP" ? 0 : b.hierarchyRole === "BRANCH" ? 2 : 1) || a.name.localeCompare(b.name))
    .filter((account) => accountVisible(account));

  const selectedAccount = selected.startsWith("account:") ? accounts.find((account) => account.id === selected.slice(8)) : undefined;
  const selectedPerson = selected.startsWith("person:") ? people.find((person) => person.id === selected.slice(7)) : undefined;
  const selectedPersonAccount = selectedPerson ? accounts.find((account) => account.id === selectedPerson.partyId) : undefined;

  function run(work: () => Promise<void>) {
    startTransition(async () => {
      setMessage("");
      setError(false);
      try {
        await work();
        setMessage("Saved.");
        router.refresh();
      } catch (caught) {
        setError(true);
        setMessage(caught instanceof Error ? caught.message : "Could not save that change.");
      }
    });
  }

  function peopleUnder(accountId: string, managerId: string | null) {
    const here = new Set(people.filter((person) => person.partyId === accountId).map((person) => person.id));
    return people
      .filter((person) => person.partyId === accountId && (managerId ? person.reportsToContactId === managerId : !person.reportsToContactId || !here.has(person.reportsToContactId)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function PersonRow({ person, accountId, depth }: { person: MapPerson; accountId: string; depth: number }) {
    const manager = people.find((item) => item.id === person.reportsToContactId);
    const managerAccount = accounts.find((account) => account.id === manager?.partyId);
    const leads = people.some((item) => item.reportsToContactId === person.id);
    const elsewhere = people.filter((item) => item.reportsToContactId === person.id && item.partyId !== accountId);
    const active = selected === `person:${person.id}`;
    return (
      <li className="min-w-0">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setSelected(`person:${person.id}`);
            setMessage("");
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left ${active ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-white"}`}
          style={{ marginLeft: depth * 16 }}
        >
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${avatarClass(person.name)}`}>{initials(person.name)}</span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-slate-800">{person.name}</span>
              {leads && <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">Manager</span>}
            </span>
            <span className="block truncate text-[11px] text-slate-500">
              {person.jobTitle || "No job title"}
              {manager && manager.partyId !== accountId ? ` · Reports to ${manager.name}${managerAccount ? ` at ${managerAccount.name}` : ""}` : ""}
              {elsewhere.length > 0 ? ` · Manages ${elsewhere.map((item) => { const company = accounts.find((account) => account.id === item.partyId); return company ? `${item.name} at ${company.name}` : item.name; }).join(", ")}` : ""}
            </span>
          </span>
        </button>
        {peopleUnder(accountId, person.id).length > 0 && (
          <ul className="mt-0.5">{peopleUnder(accountId, person.id).map((child) => <PersonRow key={child.id} person={child} accountId={accountId} depth={depth + 1} />)}</ul>
        )}
      </li>
    );
  }

  function AccountRow({ account }: { account: MapAccount }) {
    const children = orderedSiblings(pool, account.id).filter((child) => accountVisible(child));
    const folded = collapsed.has(account.id);
    const colors = tone(account.hierarchyRole);
    const Icon = account.hierarchyRole === "GROUP" ? Network : account.hierarchyRole === "BRANCH" ? MapPin : Building2;
    const active = selected === `account:${account.id}`;
    const team = peopleUnder(account.id, null);
    const canUp = nextHierarchyParent(accounts, account.id, "up") !== undefined;
    const canDown = nextHierarchyParent(accounts, account.id, "down") !== undefined;
    return (
      <li className="min-w-0">
        <div className={`rounded-2xl border bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] ${active ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"}`}>
          <div className="flex items-start gap-3 p-3">
            <button type="button" onClick={() => { setSelected(`account:${account.id}`); setMessage(""); }} className="flex min-w-0 flex-1 items-start gap-3 text-left">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}><Icon size={18} /></span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">{account.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors.chip}`}>{roleLabel(account.hierarchyRole)}</span>
                </span>
                <span className="mt-1 block text-[11px] text-slate-500">
                  {account.customerCode}
                  {account.customerGroup ? ` · ${account.customerGroup}` : ""}
                  {` · Invoices ${account.invoiceAccountName ?? "itself"}`}
                  {account.accountManager ? ` · Looked after by ${account.accountManager}` : ""}
                </span>
              </span>
            </button>
            <span className="flex shrink-0 items-center gap-1">
              {canEdit && (
                <>
                  <button type="button" title="Move up a level" aria-label={`Move ${account.name} up a level`} disabled={pending || !canUp} onClick={() => run(() => moveCustomer(account.id, "up"))} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-30"><ChevronUp size={16} /></button>
                  <button type="button" title="Move under the account above" aria-label={`Move ${account.name} under the account above`} disabled={pending || !canDown} onClick={() => run(() => moveCustomer(account.id, "down"))} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-30"><ChevronDown size={16} /></button>
                </>
              )}
              <Link href={`/customers/${account.id}`} className="rounded-lg px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50">Open</Link>
              {children.length > 0 && (
                <button type="button" aria-expanded={!folded} aria-label={folded ? "Show accounts inside" : "Hide accounts inside"} onClick={() => setCollapsed((current) => { const next = new Set(current); if (next.has(account.id)) next.delete(account.id); else next.add(account.id); return next; })} className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50">
                  {folded ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </span>
          </div>
          {team.length > 0 && (
            <div className="border-t border-slate-100 px-3 py-2">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><UserRound size={12} /> People</p>
              <ul className="space-y-0.5">{team.map((person) => <PersonRow key={person.id} person={person} accountId={account.id} depth={0} />)}</ul>
            </div>
          )}
        </div>
        {children.length > 0 && !folded && (
          <ul className={`ml-5 mt-3 space-y-3 border-l-2 pl-4 ${colors.line}`}>
            {children.map((child) => <AccountRow key={child.id} account={child} />)}
          </ul>
        )}
      </li>
    );
  }

  const parentChoices = selectedAccount
    ? accounts.filter((account) => !descendantAccountIds(accounts, [selectedAccount.id]).includes(account.id)).sort((a, b) => roleLabel(a.hierarchyRole).localeCompare(roleLabel(b.hierarchyRole)) || a.name.localeCompare(b.name))
    : [];
  const managerChoices = selectedPerson
    ? (() => {
        const family = new Set(hierarchyAccountIds(accounts, selectedPerson.partyId));
        const familyPeople = people.filter((person) => family.has(person.partyId));
        const blocked = new Set(reportingDescendantIds(familyPeople, selectedPerson.id));
        return familyPeople.filter((person) => !blocked.has(person.id)).sort((a, b) => a.name.localeCompare(b.name));
      })()
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label="Search the map" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a company, branch or person…" className="min-w-52 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
        <select aria-label="Account level" value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">Every level</option>
          <option value="GROUP">Groups</option>
          <option value="CUSTOMER">Businesses</option>
          <option value="BRANCH">Branches</option>
        </select>
        <button type="button" onClick={() => setCollapsed(new Set())} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">Expand</button>
        <button type="button" onClick={() => setCollapsed(new Set(pool.map((account) => account.id)))} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">Collapse</button>
        {focusId && <Link href="/customers/map" className="text-xs font-medium text-blue-700">Whole map</Link>}
        {canCreate && selectedAccount && <Link href={`/customers/new?parent=${selectedAccount.id}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">New account inside</Link>}
        {canEdit && selectedAccount && <HierarchyBuilder accounts={accounts} accountId={selectedAccount.id} />}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {!selectedAccount && !selectedPerson && <p className="text-sm text-slate-500">Select a company, branch or person. Move a company up a level, or under the one above it, then point it at a group and an invoice customer.</p>}
        {selectedAccount && (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Placing</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{selectedAccount.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {canEdit && (
                  <>
                    <button type="button" disabled={pending || nextHierarchyParent(accounts, selectedAccount.id, "up") === undefined} onClick={() => run(() => moveCustomer(selectedAccount.id, "up"))} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 disabled:opacity-40">Move up</button>
                    <button type="button" disabled={pending || nextHierarchyParent(accounts, selectedAccount.id, "down") === undefined} onClick={() => run(() => moveCustomer(selectedAccount.id, "down"))} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 disabled:opacity-40">Move down</button>
                  </>
                )}
                {canEdit && (["GROUP", "CUSTOMER", "BRANCH"] as const).map((level) => (
                  <button key={level} type="button" aria-pressed={selectedAccount.hierarchyRole === level} disabled={pending} onClick={() => run(() => placeCustomer(selectedAccount.id, selectedAccount.parentPartyId, level))} className={`rounded-full px-3 py-1.5 text-xs font-medium ${selectedAccount.hierarchyRole === level ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"}`}>{roleLabel(level)}</button>
                ))}
              </div>
            </div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Group
              {canEdit ? (
                <select aria-label="Group" disabled={pending} className={`${selectClass} mt-2 normal-case`} value={selectedAccount.parentPartyId ?? ""} onChange={(event) => run(() => placeCustomer(selectedAccount.id, event.target.value || null, selectedAccount.hierarchyRole))}>
                  <option value="">Independent — no group</option>
                  {parentChoices.map((account) => <option key={account.id} value={account.id}>{account.name} · {roleLabel(account.hierarchyRole)}</option>)}
                </select>
              ) : <span className="mt-2 block text-sm font-medium normal-case text-slate-800">{accounts.find((account) => account.id === selectedAccount.parentPartyId)?.name ?? "Independent"}</span>}
            </label>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Invoice customer
              {canInvoice ? (
                <select aria-label="Invoice customer" disabled={pending} className={`${selectClass} mt-2 normal-case`} value={selectedAccount.invoiceAccountId ?? ""} onChange={(event) => run(() => setInvoiceAccount(selectedAccount.id, event.target.value || null))}>
                  <option value="">This account</option>
                  {accounts.filter((account) => account.id !== selectedAccount.id).map((account) => <option key={account.id} value={account.id}>{account.name} · {account.customerCode}</option>)}
                </select>
              ) : <span className="mt-2 block text-sm font-medium normal-case text-slate-800">{selectedAccount.invoiceAccountName ?? "This account"}</span>}
            </label>
          </div>
        )}
        {selectedPerson && (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Person</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{selectedPerson.name}</p>
              <p className="mt-1 text-xs text-slate-500">{selectedPerson.jobTitle || "No job title"}{selectedPersonAccount ? ` · ${selectedPersonAccount.name}` : ""}</p>
            </div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Reports to
              {canPeople ? (
                <select aria-label="Reports to" disabled={pending} className={`${selectClass} mt-2 normal-case`} value={selectedPerson.reportsToContactId ?? ""} onChange={(event) => run(() => setContactReportsTo(selectedPerson.id, event.target.value || null))}>
                  <option value="">No manager in this group</option>
                  {managerChoices.map((person) => {
                    const company = accounts.find((account) => account.id === person.partyId);
                    return <option key={person.id} value={person.id}>{person.name}{company ? ` · ${company.name}` : ""}</option>;
                  })}
                </select>
              ) : <span className="mt-2 block text-sm font-medium normal-case text-slate-800">{people.find((person) => person.id === selectedPerson.reportsToContactId)?.name ?? "No manager"}</span>}
            </label>
          </div>
        )}
        <p role={error ? "alert" : "status"} className={`mt-3 text-sm ${message ? (error ? "text-rose-600" : "text-emerald-700") : "hidden"}`}>{message}</p>
      </div>

      <div className="overflow-auto rounded-3xl border border-[#dce5f6] bg-[#f6f8fd] p-4 sm:p-6" style={{ backgroundImage: "radial-gradient(#d5deef 1px, transparent 1px)", backgroundSize: "18px 18px" }}>
        <ul className="mx-auto max-w-3xl space-y-3">
          {roots.map((account) => <AccountRow key={account.id} account={account} />)}
        </ul>
        {!roots.length && <p className="py-16 text-center text-sm text-slate-500">Nothing on the map matches that search.</p>}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-violet-400" /> Group</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-500" /> Business</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-teal-500" /> Branch</span>
        <span>People sit under their manager. Move up lifts a company out of the one it is in. Move down places it under the company above it.</span>
      </div>
    </div>
  );
}

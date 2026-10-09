"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Search, ShieldCheck, RotateCcw } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import {
  presetCapabilities,
  accessSections,
  selectedAccessLevel,
  permissionLabel,
  remixRoleAccess,
  type AccessGroup,
  type AccessLevel,
} from "@/core/permissions/access-levels";
type Role = { id: string; name: string; capabilities: string[] };
type Props = {
  groups: AccessGroup[];
  capabilities: string[];
  action: (form: FormData) => Promise<void>;
  roleId?: string;
  membershipId?: string;
  organisationId?: string;
  roles?: Role[];
  roleIds?: string[];
  granted?: string[];
  denied?: string[];
  disabled?: boolean;
  profileName?: string;
  accessRevision?: string;
  onDirtyChange?: (dirty: boolean) => void;
};
const levels: AccessLevel[] = ["none", "read", "write", "admin"];
const signature = (
  caps: Iterable<string>,
  roles: Iterable<string>,
  name: string,
) => JSON.stringify([[...caps].sort(), [...roles].sort(), name]);
export function AccessEditor({
  groups,
  capabilities,
  action,
  roleId,
  membershipId,
  organisationId,
  roles = [],
  roleIds = [],
  granted = [],
  denied = [],
  disabled = false,
  profileName,
  accessRevision,
  onDirtyChange,
}: Props) {
  const [selected, setSelected] = useState(new Set(capabilities)),
    [assigned, setAssigned] = useState(new Set(roleIds)),
    [search, setSearch] = useState(""),
    [name, setName] = useState(profileName ?? "");
  const dirty =
    signature(selected, assigned, name) !==
    signature(capabilities, roleIds, profileName ?? "");
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const changeRole = (id: string, checked: boolean) => {
    const next = new Set(assigned);
    if (checked) next.add(id);
    else next.delete(id);
    setSelected(
      remixRoleAccess(roles, assigned, next, selected, granted, denied),
    );
    setAssigned(next);
  };
  const preset = (group: AccessGroup, level: AccessLevel) =>
    setSelected((previous) => {
      const next = new Set(previous);
      group.capabilities.forEach((c) => next.delete(c));
      presetCapabilities(group, level).forEach((c) => next.add(c));
      return next;
    });
  const toggle = (cap: string, checked: boolean) =>
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(cap);
      else next.delete(cap);
      return next;
    });
  const reset = () => {
    setSelected(new Set(capabilities));
    setAssigned(new Set(roleIds));
    setName(profileName ?? "");
  };
  const levelControls = (group: AccessGroup) => (
    <div
      className="flex shrink-0 rounded-xl bg-slate-100 p-1"
      role="group"
      aria-label={`${group.name} access level`}
    >
      {levels.map((value) => (
        <button
          type="button"
          key={value}
          aria-pressed={selectedAccessLevel(group, selected) === value}
          disabled={
            value !== "none" && !presetCapabilities(group, value).length
          }
          onClick={() => preset(group, value)}
          className={`min-h-10 rounded-lg px-2.5 text-xs capitalize transition disabled:opacity-30 sm:px-3 ${selectedAccessLevel(group, selected) === value ? "bg-white font-bold text-blue-600 shadow-sm" : "text-slate-500 hover:text-blue-600"}`}
        >
          {permissionLabel(value)}
        </button>
      ))}
    </div>
  );
  const query = search.trim().toLowerCase();
  const visible = groups.filter((group) =>
    (
      group.name +
      " " +
      group.capabilities.join(" ") +
      " " +
      accessSections(group)
        .map((s) => s.name)
        .join(" ")
    )
      .toLowerCase()
      .includes(query),
  );
  return (
    <ActionForm action={action} className="space-y-5">
      {organisationId && (
        <input type="hidden" name="organisationId" value={organisationId} />
      )}
      <input
        type="hidden"
        name={roleId ? "roleId" : "membershipId"}
        value={roleId ?? membershipId}
      />
      {accessRevision && (
        <input type="hidden" name="accessRevision" value={accessRevision} />
      )}{" "}
      {[...selected].map((cap) => (
        <input key={cap} type="hidden" name="capability" value={cap} />
      ))}
      {[...assigned].map((id) => (
        <input key={id} type="hidden" name="roleId" value={id} />
      ))}
      <fieldset disabled={disabled} className="space-y-5">
        {profileName !== undefined && (
          <label className="block text-sm font-semibold">
            Profile name
            <input
              name="profileName"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-normal"
            />
          </label>
        )}
        {!!roles.length && (
          <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <h3 className="text-sm font-semibold">Mix access profiles</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Combine profiles, then customise sections for this person.
              Individual exceptions stay in place when you change profiles.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs ${assigned.has(role.id) ? "border-blue-200 bg-white text-blue-700" : "border-slate-200 bg-white/70 text-slate-600"}`}
                >
                  <input
                    type="checkbox"
                    checked={assigned.has(role.id)}
                    onChange={(e) => changeRole(role.id, e.target.checked)}
                    className="accent-blue-600"
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </section>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck size={18} className="text-blue-500" />
              Build access by section
            </h3>
            <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
              Read views. Write adds and edits. Admin adds approvals and
              sensitive controls. App controls apply to all its sections; expand
              to mix levels or individual permissions.
            </p>
          </div>
          <label className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              aria-label="Find permissions"
              placeholder="Find an app, section or permission…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-blue-100 bg-white py-3 pl-9 pr-3 text-xs"
            />
          </label>
        </div>
        <div className="space-y-3">
          {visible.map((group) => {
            const count = group.capabilities.filter((c) =>
              selected.has(c),
            ).length;
            return (
              <details
                key={group.id}
                open={query ? true : undefined}
                className="group rounded-2xl border border-blue-100/80 bg-white"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
                  <ChevronDown
                    size={16}
                    className="shrink-0 text-slate-400 transition group-open:rotate-180"
                  />
                  <span className="min-w-28 flex-1">
                    <span className="block text-sm font-semibold">
                      {group.name}
                    </span>
                    <span className="mt-1 block text-[11px] text-slate-500">
                      {count} of {group.capabilities.length} ·{" "}
                      {selectedAccessLevel(group, selected) === "custom"
                        ? "Custom mix"
                        : permissionLabel(selectedAccessLevel(group, selected))}
                    </span>
                  </span>
                  <span onClick={(e) => e.preventDefault()}>
                    {levelControls(group)}
                  </span>
                </summary>
                <div className="space-y-3 border-t border-blue-50 px-4 pb-4 pt-3">
                  {accessSections(group)
                    .filter(
                      (section) =>
                        !query ||
                        (
                          group.name +
                          " " +
                          section.name +
                          " " +
                          section.capabilities.join(" ")
                        )
                          .toLowerCase()
                          .includes(query),
                    )
                    .map((section) => (
                      <section
                        key={section.id}
                        aria-label={`${group.name}: ${section.name}`}
                        className="rounded-xl bg-slate-50/70 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-bold">
                              {section.name}
                            </h4>
                            <p className="mt-1 text-[10px] text-slate-500">
                              {
                                section.capabilities.filter((cap) =>
                                  selected.has(cap),
                                ).length
                              }{" "}
                              selected ·{" "}
                              {permissionLabel(
                                selectedAccessLevel(section, selected),
                              )}
                            </p>
                          </div>
                          {levelControls(section)}
                        </div>
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs text-blue-600">
                            Individual permissions
                          </summary>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {section.capabilities.map((cap) => (
                              <label
                                key={cap}
                                className="flex min-h-9 items-start gap-2 text-xs leading-5 text-slate-600"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected.has(cap)}
                                  onChange={(e) =>
                                    toggle(cap, e.target.checked)
                                  }
                                  className="mt-1 accent-blue-600"
                                />
                                <span>
                                  {permissionLabel(
                                    cap.split(".").at(-1) ?? cap,
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        </details>
                      </section>
                    ))}
                </div>
              </details>
            );
          })}
          {!visible.length && (
            <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
              No matching apps or permissions.
            </p>
          )}
        </div>
        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-blue-700">
              {selected.size} permissions selected
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {dirty
                ? "Unsaved changes. Company restrictions still apply."
                : "Changes apply on the next request. Company restrictions still apply."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={!dirty}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs text-slate-600 disabled:opacity-40"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white"
            >
              {roleId ? "Save profile" : "Save user access"}
            </button>
          </div>
        </div>
      </fieldset>
      {disabled && (
        <p className="text-xs text-slate-500">
          Ask another administrator to change your own access.
        </p>
      )}
    </ActionForm>
  );
}

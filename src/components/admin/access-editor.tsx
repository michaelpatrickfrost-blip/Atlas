"use client";
import type { FormFeedback } from "@/core/shared/form-feedback";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Search,
  ShieldCheck,
  RotateCcw,
  Eye,
  LockKeyhole,
} from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import {
  presetCapabilities,
  accessSections,
  selectedAccessLevel,
  permissionLabel,
  remixRoleAccess,
  effectiveRoleCapabilities,
  capabilityOverrides,
  isSensitiveCapability,
  type AccessGroup,
  type AccessLevel,
} from "@/core/permissions/access-levels";
import { permissionDescription } from "@/core/permissions/access-copy";
type Role = { id: string; name: string; capabilities: string[] };
type Props = {
  groups: AccessGroup[];
  capabilities: string[];
  action: (form: FormData) => Promise<void | FormFeedback>;
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
  blockedCapabilities?: string[];
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
  blockedCapabilities = [],
}: Props) {
  const [selected, setSelected] = useState(new Set(capabilities)),
    [assigned, setAssigned] = useState(new Set(roleIds)),
    [search, setSearch] = useState(""),
    [name, setName] = useState(profileName ?? ""),
    [filter, setFilter] = useState("all"),
    [review, setReview] = useState(false);
  const inherited = effectiveRoleCapabilities(
    roles.filter((role) => assigned.has(role.id)),
  );
  const exceptions = capabilityOverrides(inherited, selected);
  const blocked = new Set(blockedCapabilities);
  const matchesFilter = (cap: string) =>
    filter === "all" ||
    (filter === "selected" && selected.has(cap)) ||
    (filter === "sensitive" && isSensitiveCapability(cap)) ||
    (filter === "exceptions" &&
      (exceptions.grantedCapabilities.includes(cap) ||
        exceptions.deniedCapabilities.includes(cap)));
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
          className={`min-h-10 rounded-lg px-2.5 text-xs capitalize transition disabled:opacity-30 sm:px-3 ${selectedAccessLevel(group, selected) === value ? "bg-white font-semibold text-blue-600 shadow-sm" : "text-slate-500 hover:text-blue-600"}`}
        >
          {permissionLabel(value)}
        </button>
      ))}
    </div>
  );
  const query = search.trim().toLowerCase();
  const visible = groups.filter(
    (group) =>
      (
        group.name +
        " " +
        group.capabilities.join(" ") +
        " " +
        accessSections(group)
          .map(
            (s) =>
              s.name +
              " " +
              s.capabilities
                .map((cap) => permissionDescription(cap, s.name))
                .join(" "),
          )
          .join(" ")
      )
        .toLowerCase()
        .includes(query) && group.capabilities.some(matchesFilter),
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
        {membershipId && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Assigned profiles", value: assigned.size },
              {
                label: "Extra permissions",
                value: exceptions.grantedCapabilities.length,
              },
              {
                label: "Removed from profiles",
                value: exceptions.deniedCapabilities.length,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <p className="text-xl font-semibold">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Permission filters"
          >
            {[
              ["all", "All permissions"],
              ["selected", "Selected"],
              ["sensitive", "Sensitive controls"],
              ...(membershipId ? [["exceptions", "Personal exceptions"]] : []),
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={`min-h-10 rounded-xl px-3 text-xs ${filter === id ? "bg-blue-50 font-semibold text-blue-700" : "bg-slate-50 text-slate-500"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setReview(!review)}
            aria-expanded={review}
            className="flex min-h-10 items-center gap-2 rounded-xl border border-blue-100 px-3 text-xs font-semibold text-blue-600"
          >
            <Eye size={15} />
            {review ? "Close review" : "Review access"}
          </button>
        </div>
        {review && (
          <section
            aria-label="Access review"
            className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5"
          >
            <h3 className="text-sm font-semibold">
              {dirty
                ? "Preview of your unsaved changes"
                : "Current configured access"}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Company app availability, private records and approval rules also
              apply. This preview does not sign in as the user.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {groups
                .filter((group) =>
                  group.capabilities.some((cap) => selected.has(cap)),
                )
                .map((group) => (
                  <div key={group.id} className="rounded-xl bg-white p-4">
                    <h4 className="text-xs font-semibold">{group.name}</h4>
                    <div className="mt-2 space-y-2">
                      {accessSections(group)
                        .filter((section) =>
                          section.capabilities.some((cap) => selected.has(cap)),
                        )
                        .map((section) => (
                          <p
                            key={section.id}
                            className="text-xs leading-5 text-slate-500"
                          >
                            <span className="font-semibold text-slate-700">
                              {section.name}:{" "}
                            </span>
                            {section.capabilities
                              .filter((cap) => selected.has(cap))
                              .map(
                                (cap) =>
                                  permissionLabel(
                                    cap.split(".").at(-1) ?? cap,
                                  ) +
                                  (blocked.has(cap)
                                    ? " (blocked by company)"
                                    : ""),
                              )
                              .join(", ")}
                          </p>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
            {!selected.size && (
              <p className="mt-4 text-xs text-slate-500">
                No app permissions selected.
              </p>
            )}
          </section>
        )}
        <div className="space-y-3">
          {visible.map((group) => {
            const count = group.capabilities.filter((c) =>
              selected.has(c),
            ).length;
            return (
              <details
                key={group.id}
                open={query || filter !== "all" ? true : undefined}
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
                  {group.entryCapability &&
                    count > 0 &&
                    !selected.has(group.entryCapability) && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
                        <p className="max-w-md text-xs leading-5 text-amber-800">
                          Enable workspace entry so this person can open{" "}
                          {group.name}. Each section keeps its own permissions.
                        </p>
                        <button
                          type="button"
                          className="min-h-10 rounded-lg bg-white px-3 text-xs font-semibold text-amber-800"
                          onClick={() => toggle(group.entryCapability!, true)}
                        >
                          Include workspace entry
                        </button>
                      </div>
                    )}
                  {accessSections(group)
                    .filter(
                      (section) =>
                        section.capabilities.some(matchesFilter) &&
                        (!query ||
                          (
                            group.name +
                            " " +
                            section.name +
                            " " +
                            section.capabilities.join(" ") +
                            " " +
                            section.capabilities
                              .map((cap) =>
                                permissionDescription(cap, section.name),
                              )
                              .join(" ")
                          )
                            .toLowerCase()
                            .includes(query)),
                    )
                    .map((section) => (
                      <section
                        key={section.id}
                        aria-label={`${group.name}: ${section.name}`}
                        className="rounded-xl bg-slate-50/70 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-semibold">
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
                        <details
                          className="mt-3"
                          open={query || filter !== "all" ? true : undefined}
                        >
                          <summary className="cursor-pointer text-xs text-blue-600">
                            Individual permissions
                          </summary>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {section.capabilities
                              .filter(matchesFilter)
                              .map((cap) => (
                                <label
                                  key={cap}
                                  className="flex min-h-11 items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 text-xs leading-5 text-slate-600"
                                >
                                  <input
                                    type="checkbox"
                                    aria-label={permissionLabel(
                                      cap.split(".").at(-1) ?? cap,
                                    )}
                                    checked={selected.has(cap)}
                                    onChange={(e) =>
                                      toggle(cap, e.target.checked)
                                    }
                                    className="mt-1 accent-blue-600"
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="font-semibold text-slate-700">
                                      {permissionLabel(
                                        cap.split(".").at(-1) ?? cap,
                                      )}
                                    </span>
                                    <span className="mt-1 block text-[11px] leading-5 text-slate-500">
                                      {permissionDescription(cap, section.name)}
                                    </span>
                                    <span className="mt-2 flex flex-wrap gap-2 text-[10px]">
                                      {isSensitiveCapability(cap) && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 text-amber-700">
                                          <LockKeyhole size={10} />
                                          Sensitive control
                                        </span>
                                      )}
                                      {membershipId && (
                                        <span
                                          className={`rounded-md px-2 ${inherited.has(cap) && !selected.has(cap) ? "bg-rose-50 text-rose-600" : selected.has(cap) && !inherited.has(cap) ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-500"}`}
                                        >
                                          {inherited.has(cap)
                                            ? selected.has(cap)
                                              ? "From profile"
                                              : "Removed for this user"
                                            : selected.has(cap)
                                              ? "Extra access"
                                              : "Not granted"}
                                        </span>
                                      )}
                                      {blocked.has(cap) && (
                                        <span className="rounded-md bg-amber-50 px-2 text-amber-700">
                                          Blocked by company
                                        </span>
                                      )}
                                    </span>
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
              No matching apps or permissions for this filter.
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
              className="min-h-11 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white"
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

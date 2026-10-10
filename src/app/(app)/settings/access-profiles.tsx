"use client";
import type { FormFeedback } from "@/core/shared/form-feedback";
import { useState } from "react";
import { Search, ShieldCheck, ChevronRight } from "lucide-react";
import { AccessEditor } from "@/components/admin/access-editor";
import type { AccessGroup } from "@/core/permissions/access-levels";
type Profile = {
  id: string;
  name: string;
  capabilities: string[];
  revision: string;
};
export function AccessProfiles({
  profiles,
  groups,
  action,
}: {
  profiles: Profile[];
  groups: AccessGroup[];
  action: (form: FormData) => Promise<void | FormFeedback>;
}) {
  const [selected, setSelected] = useState(profiles[0]?.id ?? ""),
    [search, setSearch] = useState(""),
    [dirty, setDirty] = useState(false);
  const active = profiles.find((p) => p.id === selected);
  const choose = (id: string) => {
    if (id === selected) return;
    if (
      dirty &&
      !window.confirm(
        "Discard unsaved profile changes and open another profile?",
      )
    )
      return;
    setDirty(false);
    setSelected(id);
  };
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-blue-100 bg-white p-3">
        <label className="relative block">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input
            aria-label="Search access profiles"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a profile…"
            className="min-h-11 w-full rounded-xl border border-blue-100 py-2 pl-9 pr-3 text-xs"
          />
        </label>
        <div className="mt-3 max-h-80 space-y-1 overflow-y-auto lg:max-h-[65vh]">
          {profiles
            .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
            .map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={selected === p.id}
                onClick={() => choose(p.id)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl p-3 text-left ${selected === p.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <ShieldCheck size={17} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-xs font-bold">
                    {p.name}
                  </span>
                  <span className="mt-1 block text-[10px] opacity-70">
                    {p.capabilities.length} permissions
                  </span>
                </span>
                <ChevronRight size={14} className="shrink-0" />
              </button>
            ))}
        </div>
      </aside>
      <section className="min-w-0 rounded-2xl border border-blue-100 bg-white p-4 sm:p-6">
        {active ? (
          <AccessEditor
            key={active.id + active.revision}
            roleId={active.id}
            profileName={active.name}
            accessRevision={active.revision}
            capabilities={active.capabilities}
            groups={groups}
            action={action}
            onDirtyChange={setDirty}
          />
        ) : (
          <p className="text-sm text-slate-500">
            Create your first access profile, or select one to customise it.
          </p>
        )}
      </section>
    </div>
  );
}

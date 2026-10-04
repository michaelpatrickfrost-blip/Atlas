"use client";

import { useState } from "react";
import { tagLabel, parseTags } from "@/core/shared/hashtags";

export function TagEditor({
  name = "tags",
  initial,
  hint,
}: {
  name?: string;
  initial: string[];
  hint?: string;
}) {
  const [tags, setTags] = useState(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function add(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      const next = parseTags([...tags, trimmed.startsWith("#") ? trimmed : trimmed].join(" "));
      setTags(next);
      setDraft("");
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That tag cannot be saved.");
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={tags.join(", ")} />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button key={tag} type="button" onClick={() => setTags(tags.filter((item) => item !== tag))} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {tagLabel(tag)} ×
          </button>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-400">No tags</span>}
      </div>
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add(draft);
          }
        }}
        placeholder="Add a tag (comma or Enter to add)"
        aria-label="Add a tag"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

// Deprecated: use TagEditor instead
export const HashtagEditor = TagEditor;

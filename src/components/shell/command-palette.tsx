"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type SearchResult = { id: string; title: string; subtitle?: string; href: string; group: string };

/** Global ⌘K / Ctrl+K command palette. Architecture supports future free-text
 *  commands (see docs/MODULE_SPEC.md §Search) — today it searches navigation and
 *  module-contributed entities honestly, with no simulated AI behaviour. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function closePalette() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") closePalette();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length === 0) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    }, 150);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const visibleResults = query.trim().length === 0 ? [] : results;

  function go(href: string) {
    closePalette();
    router.push(href);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-72 items-center gap-2 rounded-[var(--radius-atlas-sm)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-3 py-1.5 text-sm text-[var(--color-ink-faint)] transition-colors hover:border-[var(--color-border-strong)]"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search Atlas or type a command...</span>
        <kbd className="rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-1.5 py-0.5 text-xs">⌘K</kbd>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search Atlas"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[12vh]"
          onClick={closePalette}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
              <Search size={16} className="text-[var(--color-ink-faint)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Atlas or type a command..."
                className="flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)]"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto py-1">
              {visibleResults.length === 0 && query.trim().length > 0 && (
                <li className="px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">No results for &ldquo;{query}&rdquo;</li>
              )}
              {visibleResults.map((result) => (
                <li key={result.id}>
                  <button
                    onClick={() => go(result.href)}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-[var(--color-surface-sunken)]"
                  >
                    <span className="text-[var(--color-ink)]">{result.title}</span>
                    <span className="text-xs text-[var(--color-ink-faint)]">{result.group}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

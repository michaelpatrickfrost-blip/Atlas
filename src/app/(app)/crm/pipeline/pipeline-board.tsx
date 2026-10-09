"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useOnClickOutside } from "@/components/hooks/use-on-click-outside";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { moveOpportunityStage } from "@/modules/crm/services/opportunities";
import { formatMoney } from "@/core/shared/money";

type Item = {
  id: string;
  name: string;
  stageId: string;
  valueAmount: number;
  valueCurrency: string;
  party: { name: string };
  nextActionAt: string | null;
};

export function PipelineBoard({
  stages,
  items,
  editable,
}: {
  stages: { id: string; name: string }[];
  items: Item[];
  editable: boolean;
}) {
  const [query, setQuery] = useState("");
  const [needsAction, setNeedsAction] = useState(false);
  const visibleItems = items.filter(item => `${item.name} ${item.party.name}`.toLowerCase().includes(query.trim().toLowerCase()) && (!needsAction || !item.nextActionAt || new Date(item.nextActionAt) < new Date()));
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setOpenMenu(null), []);
  useOnClickOutside(menuRef, openMenu !== null, closeMenu);

  function move(id: string, stage: string) {
    if (!editable || pending || items.find((item) => item.id === id)?.stageId === stage) return;
    setOpenMenu(null);
    startTransition(async () => {
      try {
        await moveOpportunityStage(id, stage);
        setMessage("Stage updated.");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not move this opportunity.");
      }
    });
  }

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><input type="search" aria-label="Search pipeline" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a deal or customer" className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm" /><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={needsAction} onChange={event => setNeedsAction(event.target.checked)} />Needs a next action</label><span className="text-xs text-slate-400">{visibleItems.length} deals</span></div>
      <p role="status" aria-live="polite" className="mb-5 text-xs text-[var(--color-ink-faint)]">
        {pending ? "Saving stage…" : message || (editable ? "Drag a deal into another stage, or use Move." : "Pipeline overview")}
      </p>
      <div className="flex gap-5 overflow-x-auto pb-6">
        {stages.map((stage) => {
          const cards = visibleItems.filter((item) => item.stageId === stage.id);
          const totals = cards.reduce<Record<string, number>>((sum, item) => {
            sum[item.valueCurrency] = (sum[item.valueCurrency] ?? 0) + item.valueAmount;
            return sum;
          }, {});
          const totalLabel = Object.entries(totals).map(([currency, amount]) => formatMoney(amount, currency)).join(" · ");
          return (
            <section
              key={stage.id}
              aria-label={stage.name}
              onDragOver={(event) => {
                if (editable && !pending) {
                  event.preventDefault();
                  setOver(stage.id);
                }
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(event) => {
                event.preventDefault();
                if (dragged) move(dragged, stage.id);
                setDragged(null);
                setOver(null);
              }}
              className="flex w-[292px] shrink-0 flex-col"
            >
              <header className="mb-3 flex items-baseline gap-2 px-1">
                <h2 className="text-[13px] font-semibold tracking-tight text-[var(--color-ink)]">{stage.name}</h2>
                <span className="text-xs tabular-nums text-[var(--color-ink-faint)]">{cards.length}</span>
              </header>
              <p className="mb-3 min-h-4 px-1 text-xs text-[var(--color-ink-muted)]">{totalLabel || "Empty"}</p>
              <div className={`flex min-h-48 flex-1 flex-col gap-2.5 rounded-2xl p-1.5 ${over === stage.id ? "bg-[var(--color-atlas-blue-soft)]" : "bg-slate-50 border border-slate-100"}`}>
                {cards.map((item) => (
                  <article
                    key={item.id}
                    draggable={editable && !pending}
                    onDragStart={(event) => {
                      setDragged(item.id);
                      event.dataTransfer.setData("text/plain", item.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setDragged(null);
                      setOver(null);
                    }}
                    className={`rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-3.5 ${editable ? "cursor-grab active:cursor-grabbing" : ""} ${dragged === item.id ? "opacity-40" : "hover:border-[var(--color-border-strong)]"}`}
                  >
                    <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">{item.party.name}</p>
                    <Link href={`/crm/opportunities/${item.id}`} className="mt-1 block truncate text-sm font-semibold tracking-tight text-[var(--color-ink)] hover:text-[var(--color-atlas-blue)]">
                      {item.name}
                    </Link>
                    <p className="mt-3 text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">{formatMoney(item.valueAmount, item.valueCurrency)}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className={`truncate text-xs ${item.nextActionAt ? "text-[var(--color-ink-muted)]" : "text-[var(--color-status-warning)]"}`}>
                        {item.nextActionAt ? `Next ${new Date(item.nextActionAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No next step"}
                      </p>
                      {editable && (
                        <div className="relative" ref={openMenu === item.id ? menuRef : undefined}>
                          <button
                            type="button"
                            aria-expanded={openMenu === item.id}
                            aria-label={`Move ${item.name}`}
                            disabled={pending}
                            onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
                            className="rounded-md px-1.5 py-0.5 text-xs text-[var(--color-ink-faint)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
                          >
                            Move
                          </button>
                          {openMenu === item.id && (
                            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-[0_12px_32px_rgba(16,19,26,0.12)]">
                              {stages.map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  disabled={option.id === item.stageId}
                                  onClick={() => move(item.id, option.id)}
                                  className="block w-full px-3 py-2 text-left text-xs text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] disabled:text-[var(--color-ink-faint)]"
                                >
                                  {option.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

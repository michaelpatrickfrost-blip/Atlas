"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Radio } from "lucide-react";
import type { AnalyticsResult } from "@/core/analytics/types";
import {
  widgetSpan,
  type BoardFilters,
  type StudioWidget,
} from "@/modules/analytics/definition";
import { loadDashboardSnapshot } from "@/app/(app)/analytics/actions";
import { palettes, TileChart } from "./charts";
import { useLiveGoals } from "@/modules/kpis/components/use-live-goals";
import { GoalCompare } from "@/modules/kpis/components/goal-compare";
import type { GoalMarker } from "@/modules/kpis/services/workspace";
import styles from "./studio.module.css";

export function Wall({
  name,
  company,
  widgets,
  data: initial,
  filters,
  period,
  refreshSeconds,
  boards,
  goals = [],
}: {
  name: string;
  company: string;
  widgets: StudioWidget[];
  data: Record<string, AnalyticsResult>;
  filters: BoardFilters;
  period: string;
  refreshSeconds: number;
  boards: { id: string; name: string }[];
  goals?: GoalMarker[];
}) {
  const router = useRouter();
  const [metrics, setMetrics] = useState(initial);
  const [clock, setClock] = useState("");
  const [updated, setUpdated] = useState("Just loaded");
  const seconds = refreshSeconds;
  const liveGoals = useLiveGoals(goals, seconds, seconds<=0);
  useEffect(() => {
    document.title = `${name} · Atlas`;
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const timer = window.setInterval(tick, 10000);
    return () => window.clearInterval(timer);
  }, [name]);
  useEffect(() => {
    let stop = false;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const next = await loadDashboardSnapshot({ widgets, filters, period });
        if (!stop) {
          setMetrics(next);
          setUpdated(
            new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        }
      } catch {
        if (!stop) setUpdated("Refresh paused");
      }
    };
    if (seconds <= 0) return;
    const timer = window.setInterval(refresh, seconds * 1000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [period, seconds, widgets, filters]);
  return (
    <main className={styles.wall}>
      <header className={styles.wallHeader}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200/70">
            {company}
          </p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-2 flex items-center gap-2 text-xs text-teal-200">
            <Radio size={12} />
            Live · updated {updated} ·{" "}
            {seconds ? `every ${seconds}s` : "manual refresh"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-2xl font-medium tabular-nums">{clock}</span>
          <button
            className="rounded-full border border-white/15 px-4 py-2"
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            <Monitor size={14} className="mr-2 inline" />
            Fill this monitor
          </button>
          <label className="text-xs text-blue-100/70">
            Board
            <select
              aria-label="Dashboard"
              className="ml-2 rounded-full bg-white/10 px-3 py-2"
              value=""
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                const fresh = value.startsWith("new:");
                const id = value.slice(fresh ? 4 : 0);
                if (fresh)
                  window.open(
                    `/board?dashboard=${encodeURIComponent(id)}&period=${period}`,
                    `atlas-board-${id}`,
                    "popup,width=1680,height=980",
                  );
                else
                  router.push(
                    `/board?dashboard=${encodeURIComponent(id)}&period=${period}`,
                  );
              }}
            >
              <option value="">Switch</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
              {boards.map((board) => (
                <option key={`${board.id}-window`} value={`new:${board.id}`}>
                  Open {board.name} in a new window
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <div className={styles.grid}>
        {widgets.map((widget) => {
          const metric = metrics[widget.id];
          return (
            <section
              key={widget.id}
              className={styles.tile}
              style={{
                ["--span" as string]: widgetSpan(widget),
                ["--tile-height" as string]:
                  widget.height === "tall"
                    ? "420px"
                    : widget.height === "compact"
                      ? "180px"
                      : "280px",
                ["--accent" as string]: palettes[widget.color ?? "blue"][0],
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100/50">
                {metric?.subject ?? "Atlas"}
              </p>
              <h2 className="mt-1 text-sm font-semibold">
                {widget.title || metric?.name || "Unavailable"}
              </h2>
              <div className={styles.chartBody}>
              {metric ? (
                <TileChart metric={metric} widget={widget} />
              ) : (
                <p className="py-8 text-sm text-slate-400">
                  This measure is no longer available.
                </p>
              )}
              </div>
              {metric && (
                <GoalCompare
                  goals={liveGoals}
                  metric={metric}
                  period={period}
                />
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

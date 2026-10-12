"use client";
import React, { type CSSProperties } from "react";
import type { PublishedBusinessView } from "../services/business-view-contract";
import { widgetSpan } from "../definition";
import { palettes, TileChart } from "./charts";
import styles from "./studio.module.css";

/** Original native charts and presentation settings, with supplied authorised
 * results only. No actions/providers/personal board/Goals/local store fallback. */
export function BusinessViewCharts({ view }: { view: Pick<PublishedBusinessView, "content" | "dataByWidget"> }) {
  return <div className={styles.grid}>{view.content.widgets.map(widget => {
    const metric = view.dataByWidget[widget.id];
    return <section key={widget.id} className={`${styles.tile} ${widget.tone === "ink" ? styles.ink : widget.tone === "blue" ? styles.soft : ""} ${widget.borderless ? styles.borderless : ""}`} style={{ "--span": widgetSpan(widget),
      "--tile-height": widget.height === "tall" ? "420px" : widget.height === "compact" ? "180px" : "280px",
      "--accent": palettes[widget.color ?? "blue"][0] } as CSSProperties}>
      <p className="text-xs text-slate-500">{metric?.subject ?? "Atlas"}</p><h2 className="mt-1 text-sm font-semibold">{widget.title || metric?.name || "Unavailable"}</h2>
      <div className={styles.chartBody}>{metric ? <TileChart metric={metric} widget={widget} /> : <p role="status">This measure is unavailable.</p>}</div>
    </section>;
  })}</div>;
}

"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChartNoAxesCombined, Table2, X } from "lucide-react";
import type { AnalyticsResult } from "@/core/analytics/types";
import type { StudioWidget } from "../definition";
import { TileChart, visualOptions } from "./charts";
import styles from "./studio.module.css";

export function ChartExplorer({
  metric,
  widget,
  onClose,
}: {
  metric: AnalyticsResult;
  widget: StudioWidget;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [visual, setVisual] = useState(widget.visual);
  const [category, setCategory] = useState("");
  useEffect(() => {
    const node = dialog.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    node?.showModal();
    return () => {
      node?.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.explorer}
      aria-labelledby="explorer-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.explorerHeader}>
        <div>
          <p className={styles.eyebrow}>{metric.subject} · Explore</p>
          <h2 id="explorer-title">{widget.title || metric.name}</h2>
          <p>
            {metric.grain}
            {metric.snapshot ? " · Current snapshot" : ""}
          </p>
        </div>
        <button
          className={styles.iconButton}
          onClick={onClose}
          aria-label="Close chart explorer"
        >
          <X size={20} />
        </button>
      </div>
      <div className={styles.explorerTools}>
        <button
          className={styles.pill}
          aria-pressed={visual !== "table"}
          onClick={() =>
            setVisual(widget.visual === "table" ? "bar" : widget.visual)
          }
        >
          <ChartNoAxesCombined size={15} /> Chart
        </button>
        <button
          className={styles.pill}
          aria-pressed={visual === "table"}
          onClick={() => setVisual("table")}
        >
          <Table2 size={15} /> Values
        </button>
        <select
          aria-label="Explorer chart type"
          value={visual}
          onChange={(e) => setVisual(e.target.value as StudioWidget["visual"])}
          className={styles.select}
        >
          {visualOptions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
        {category && (
          <button className={styles.focusChip} onClick={() => setCategory("")}>
            {category}
            <X size={12} />
          </button>
        )}
      </div>
      <div className={styles.explorerChart}>
        <TileChart
          metric={metric}
          widget={{
            ...widget,
            tone: "neutral",
            visual,
            category: category || widget.category,
            maxCategories: 50,
          }}
          onPick={(label) => setCategory(category === label ? "" : label)}
        />
      </div>
      <footer className={styles.explorerFooter}>
        <p>
          {metric.definition}
          <br />
          Explore freely. Your saved dashboard stays as you designed it.
        </p>
        <a
          href={
            widget.data
              ? `/reports?dataset=${encodeURIComponent(widget.data.dataset)}`
              : metric.href
          }
        >
          Open source <ArrowUpRight size={15} />
        </a>
      </footer>
    </dialog>
  );
}

/** Decorative chart shapes only: no synthetic business figures in the live gallery. */
export function DashboardIllustration() {
  return (
    <div className={styles.illustration} aria-hidden="true">
      <div className={styles.illustrationTop}>
        <span />
        <span />
        <span />
        <i />
      </div>
      <div className={styles.illustrationCards}>
        <div>
          <i />
          <b />
          <span />
        </div>
        <div>
          <i />
          <b />
          <span />
        </div>
        <div>
          <i />
          <b />
          <span />
        </div>
      </div>
      <div className={styles.illustrationCharts}>
        <div>
          <div className={styles.illustrationLabel} />
          <svg viewBox="0 0 300 120">
            <defs>
              <linearGradient id="gallery-area" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#367df5" stopOpacity=".3" />
                <stop offset="1" stopColor="#367df5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 94 L28 82 L58 90 L90 52 L120 63 L150 33 L180 46 L210 20 L240 32 L270 9 L300 17 L300 120 L0 120Z"
              fill="url(#gallery-area)"
            />
            <path
              d="M0 94 L28 82 L58 90 L90 52 L120 63 L150 33 L180 46 L210 20 L240 32 L270 9 L300 17"
              stroke="#367df5"
              fill="none"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className={styles.illustrationDonut} />
          <div className={styles.illustrationLabel} />
        </div>
      </div>
      <div className={styles.illustrationBars}>
        {[50, 80, 65, 95, 72, 86, 60, 100, 78, 90].map((height, i) => (
          <span key={i} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className={styles.floatingBadge}>
        <ChartNoAxesCombined size={17} /> A fresh perspective
      </div>
    </div>
  );
}

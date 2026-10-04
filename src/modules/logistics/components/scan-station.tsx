"use client";

import { useState, useTransition } from "react";
import { scanAction, shortAction } from "@/app/(app)/logistics/actions";

type Line = { id: string; locationCode: string | null; productCode: string; description: string; requiredQuantity: number; confirmedQuantity: number; status: string; clusterSlot: string | null };

export function ScanStation({ taskId, line }: { taskId: string; line: Line | null }) {
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState(line ? "Scan location" : "Nothing left on this task");
  const [tone, setTone] = useState<"idle" | "ok" | "bad">("idle");
  const [pendingScans, setPendingScans] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function beep(ok: boolean) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = ok ? 880 : 196;
    gain.gain.value = 0.05;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.07);
  }

  function submit(value: string, key = crypto.randomUUID()) {
    if (!line) return;
    startTransition(async () => {
      try {
        const result = await scanAction(taskId, line.id, value, key);
        setPendingScans((current) => current.filter((item) => item !== key));
        if ("title" in result && result.title) {
          setTone("bad");
          setMessage(`${result.title}\nExpected ${"expected" in result ? result.expected : ""}\nScanned ${"scanned" in result ? result.scanned : value}`);
          beep(false);
          return;
        }
        setTone("ok");
        setMessage("message" in result && result.message ? result.message : "Confirmed");
        setBarcode("");
        beep(true);
      } catch (error) {
        const text = error instanceof Error ? error.message : "The scan did not save.";
        if (/fetch|network|failed/i.test(text)) {
          setPendingScans((current) => current.includes(key) ? current : [...current, key]);
          setMessage("Pending sync");
          setTone("bad");
          return;
        }
        setTone("bad");
        setMessage(text);
        beep(false);
      }
    });
  }

  return (
    <section className={`rounded-[28px] border p-6 sm:p-10 ${tone === "bad" ? "border-rose-200 bg-rose-50" : tone === "ok" ? "border-emerald-200 bg-emerald-50" : "border-[var(--color-border)] bg-white"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">Scan</p>
      {line?.clusterSlot && <p className="mt-3 text-sm font-medium text-[var(--color-atlas-blue)]">{line.clusterSlot}</p>}
      <h2 className="mt-3 text-5xl font-semibold tracking-tight text-[var(--color-ink)]">{line?.locationCode ?? "Done"}</h2>
      <p className="mt-4 text-2xl text-[var(--color-ink)]">{line ? `${line.productCode} · ${line.description}` : "Task complete"}</p>
      {line && <p className="mt-6 text-4xl font-semibold tabular-nums">{line.confirmedQuantity} <span className="text-[var(--color-ink-faint)]">/ {line.requiredQuantity}</span></p>}
      <p className="mt-6 whitespace-pre-line text-lg">{message}</p>
      {pendingScans.length > 0 && <p className="mt-3 text-sm font-medium text-amber-700">Pending sync · {pendingScans.length}</p>}
      <form className="mt-8" onSubmit={(event) => { event.preventDefault(); submit(barcode); }}>
        <input autoFocus value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder={line?.status === "OPEN" ? "Scan location" : "Scan product"} className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-5 py-5 text-2xl outline-none focus:border-[var(--color-atlas-blue)]" />
      </form>
      {line && line.confirmedQuantity < line.requiredQuantity && (
        <button type="button" className="mt-4 text-sm text-[var(--color-ink-muted)] underline" disabled={pending} onClick={() => startTransition(async () => { await shortAction(line.id, line.confirmedQuantity, "Stock missing"); setMessage("Short pick recorded. Stock discrepancy sent to Inventory."); })}>Short pick</button>
      )}
    </section>
  );
}

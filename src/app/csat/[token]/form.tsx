"use client";
import { useState, useTransition } from "react";
import { recordCsatComment, recordCsatScore } from "@/modules/csat/services/actions";

export type CsatFormSurvey = { question: string; followUpQuestion: string; lowFollowUpQuestion: string; thanksText: string; lowLabel: string; highLabel: string; reasons: string[] };

/** The customer's side of a survey. With `preview` nothing is saved. */
export function CsatForm({ token, survey, initialScore, alreadyScore, accent = "#1d4ed8", preview = false }: { token: string; survey: CsatFormSurvey; initialScore?: number; alreadyScore?: number; accent?: string; preview?: boolean }) {
  const [score, setScore] = useState<number | undefined>(initialScore ?? alreadyScore);
  const [comment, setComment] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [sentInitial, setSentInitial] = useState(false);
  const [pending, start] = useTransition();

  if (!preview && initialScore && !sentInitial) {
    setSentInitial(true);
    start(async () => { await recordCsatScore(token, initialScore); });
  }

  if (done) return <div><p style={{ fontSize: 16, fontWeight: 600 }}>{survey.thanksText}</p>{preview && <button onClick={() => { setDone(false); setScore(undefined); setReasons([]); setComment(""); }} style={{ marginTop: 14, background: "none", border: "none", color: accent, fontSize: 13, cursor: "pointer", padding: 0 }}>Start the preview again</button>}</div>;
  const low = score !== undefined && score <= 3;
  const pick = (n: number) => { setScore(n); if (!preview) start(async () => { await recordCsatScore(token, n); }); };

  return (
    <div>
      <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, lineHeight: 1.35 }}>{survey.question}</p>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} out of 5`} aria-pressed={score === n} onClick={() => pick(n)} style={{ flex: 1, height: 52, borderRadius: 10, border: score === n ? `2px solid ${accent}` : "1px solid #e5e5e5", background: score === n ? `${accent}14` : "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{n}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#777", margin: "6px 2px 20px" }}><span>{survey.lowLabel}</span><span>{survey.highLabel}</span></div>
      {score !== undefined && (
        <div>
          {!!survey.reasons.length && <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>{low ? "What let us down? Tick any that apply." : "What stood out? Tick any that apply."}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{survey.reasons.map((reason) => { const on = reasons.includes(reason); return <button key={reason} type="button" aria-pressed={on} onClick={() => setReasons((current) => on ? current.filter((value) => value !== reason) : [...current, reason])} style={{ borderRadius: 999, border: on ? `1.5px solid ${accent}` : "1px solid #ddd", background: on ? `${accent}14` : "#fff", color: on ? accent : "#333", padding: "7px 13px", fontSize: 13, cursor: "pointer" }}>{reason}</button>; })}</div>
          </div>}
          <label style={{ fontSize: 13, color: "#555", display: "block" }}>{low && survey.lowFollowUpQuestion ? survey.lowFollowUpQuestion : survey.followUpQuestion}<textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} maxLength={2000} style={{ marginTop: 6, width: "100%", border: "1px solid #e5e5e5", borderRadius: 8, padding: 10, fontSize: 14, boxSizing: "border-box" }} /></label>
          <button type="button" disabled={pending} onClick={() => { if (preview) { setDone(true); return; } start(async () => { await recordCsatComment(token, comment, reasons); setDone(true); }); }} style={{ marginTop: 12, background: accent, color: "#fff", border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>{pending ? "Sending…" : "Send feedback"}</button>
        </div>
      )}
    </div>
  );
}

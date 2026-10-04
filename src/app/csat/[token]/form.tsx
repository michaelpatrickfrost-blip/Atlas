"use client";
import { useState, useTransition } from "react";
import { recordCsatComment, recordCsatScore } from "@/modules/csat/services/actions";

export function CsatForm({ token, question, followUpQuestion, thanksText, initialScore, alreadyScore }: { token: string; question: string; followUpQuestion: string; thanksText: string; initialScore?: number; alreadyScore?: number }) {
  const [score, setScore] = useState<number | undefined>(initialScore ?? alreadyScore);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (initialScore && !done && score === initialScore && !pending) {
    start(async () => { await recordCsatScore(token, initialScore); });
  }

  if (done) return <p style={{ fontSize: 15 }}>{thanksText}</p>;

  return (
    <div>
      <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>{question}</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => { setScore(n); start(async () => { await recordCsatScore(token, n); }); }} style={{ width: 48, height: 48, borderRadius: 8, border: score === n ? "2px solid #1d4ed8" : "1px solid #e5e5e5", background: score === n ? "#eff6ff" : "#fff", fontWeight: 700, cursor: "pointer" }}>{n}</button>
        ))}
      </div>
      {score && (
        <div>
          <label style={{ fontSize: 13, color: "#555" }}>{followUpQuestion}<textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} style={{ marginTop: 6, width: "100%", border: "1px solid #e5e5e5", borderRadius: 8, padding: 10, fontSize: 14 }} /></label>
          <button disabled={pending} onClick={() => start(async () => { await recordCsatComment(token, comment); setDone(true); })} style={{ marginTop: 12, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send</button>
        </div>
      )}
    </div>
  );
}

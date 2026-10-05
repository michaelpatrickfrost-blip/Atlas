"use client";
import { useRef, useState, useTransition } from "react";
import { signContract, declineContract } from "@/core/contracts/actions";

const box: React.CSSProperties = { marginTop: 6, width: "100%", border: "1px solid #d4d4d8", borderRadius: 10, padding: "11px 12px", fontSize: 15, boxSizing: "border-box", background: "#fff" };

/** The signer's side: full name, an optional drawn signature, agreement, then sign or decline. */
export function SignForm({ token, accent, quote, company }: { token: string; accent: string; quote: boolean; company: string }) {
  const [name, setName] = useState(""), [agree, setAgree] = useState(false), [drawn, setDrawn] = useState(false);
  const [done, setDone] = useState<{ name: string; at: string; reference: string } | null>(null);
  const [declining, setDeclining] = useState(false), [reason, setReason] = useState(""), [declined, setDeclined] = useState(false);
  const [error, setError] = useState(""), [pending, start] = useTransition();
  const canvas = useRef<HTMLCanvasElement>(null), drawing = useRef(false);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => { const area = event.currentTarget.getBoundingClientRect(); return { x: ((event.clientX - area.left) / area.width) * event.currentTarget.width, y: ((event.clientY - area.top) / area.height) * event.currentTarget.height }; };
  const down = (event: React.PointerEvent<HTMLCanvasElement>) => { const ctx = event.currentTarget.getContext("2d"); if (!ctx) return; event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true; const { x, y } = point(event); ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111827"; ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const ctx = event.currentTarget.getContext("2d"); if (!ctx) return; const { x, y } = point(event); ctx.lineTo(x, y); ctx.stroke(); setDrawn(true); };
  const clear = () => { const node = canvas.current; node?.getContext("2d")?.clearRect(0, 0, node.width, node.height); setDrawn(false); };

  if (done) return <div style={{ border: "1px solid #a7f3d0", background: "#ecfdf5", borderRadius: 14, padding: 20 }}>
    <p style={{ color: "#047857", fontWeight: 700, fontSize: 17 }}>{quote ? "Approved. Thank you." : "Signed. Thank you."}</p>
    <p style={{ marginTop: 6, fontSize: 14, color: "#065f46" }}>{quote ? "Approved" : "Signed"} by {done.name} on {new Date(done.at).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}. Reference {done.reference}. {company} has been told, and this page stays as your record.</p>
  </div>;
  if (declined) return <p style={{ fontSize: 15 }}>You have declined this {quote ? "quotation" : "document"}. {company} has been told.</p>;

  if (declining) return <div>
    <label style={{ display: "block", fontSize: 14, fontWeight: 600 }}>What would you like changed? (optional)<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={1000} style={box} /></label>
    <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
      <button type="button" disabled={pending} onClick={() => start(async () => { await declineContract(token, reason); setDeclined(true); })} style={{ background: "#b91c1c", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{pending ? "Sending…" : "Decline"}</button>
      <button type="button" onClick={() => setDeclining(false)} style={{ background: "transparent", border: "1px solid #d4d4d8", borderRadius: 10, padding: "11px 18px", fontSize: 14, cursor: "pointer" }}>Back</button>
    </div>
  </div>;

  const ready = agree && name.trim().length >= 2 && !pending;
  return <div>
    <label style={{ display: "block", fontSize: 14, fontWeight: 600 }}>Your full name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="As you would sign it" style={box} /></label>
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ fontSize: 14, fontWeight: 600 }}>Draw your signature <span style={{ fontWeight: 400, color: "#71717a" }}>(optional)</span></span>{drawn && <button type="button" onClick={clear} style={{ background: "none", border: "none", color: accent, fontSize: 13, cursor: "pointer", padding: 0 }}>Clear</button>}</div>
      <canvas ref={canvas} width={900} height={220} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drawing.current = false; }} onPointerLeave={() => { drawing.current = false; }} style={{ marginTop: 6, width: "100%", height: 130, border: "1px dashed #a1a1aa", borderRadius: 10, background: "#fafafa", touchAction: "none", cursor: "crosshair" }} />
    </div>
    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 16, fontSize: 13.5, color: "#3f3f46", lineHeight: 1.5 }}>
      <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
      <span>{quote ? `I have read this quotation and approve it. I am authorised to place this order with ${company} at the prices shown.` : "I have read this document and agree to be bound by its terms."} My name{drawn ? " and signature" : ""} above act as my electronic signature.</span>
    </label>
    {error && <p role="alert" style={{ color: "#b91c1c", fontSize: 13, marginTop: 10 }}>{error}</p>}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
      <button type="button" disabled={!ready} onClick={() => start(async () => { setError(""); try { const result = await signContract(token, name, drawn ? canvas.current?.toDataURL("image/png") : undefined); setDone({ name: name.trim(), at: result.signedAt, reference: result.reference }); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not sign. Try again."); } })}
        style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "13px 26px", fontWeight: 700, fontSize: 15, cursor: ready ? "pointer" : "default", opacity: ready ? 1 : 0.45 }}>{pending ? "Saving…" : quote ? "Approve quotation" : "Sign document"}</button>
      <button type="button" disabled={pending} onClick={() => setDeclining(true)} style={{ background: "transparent", border: "1px solid #d4d4d8", borderRadius: 10, padding: "13px 20px", fontSize: 14, cursor: "pointer" }}>{quote ? "Ask for changes or decline" : "Decline"}</button>
    </div>
    <p style={{ marginTop: 14, fontSize: 12, color: "#71717a" }}>When you {quote ? "approve" : "sign"}, the date, time and your network address are recorded with a fingerprint of this exact document.</p>
  </div>;
}

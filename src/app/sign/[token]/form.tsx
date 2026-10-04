"use client";
import { useState, useTransition } from "react";
import { signContract, declineContract } from "@/core/contracts/actions";

export function SignForm({ token, accent }: { token: string; accent: string }) {
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (done) return <p style={{ color: "#047857", fontWeight: 600 }}>Signed by {done}. A copy has been recorded.</p>;
  if (declined) return <p>You have declined this document.</p>;

  return (
    <div>
      <label style={{ display: "block", fontSize: 14, fontWeight: 500 }}>Type your full name to sign
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ marginTop: 6, width: "100%", border: "1px solid #e5e5e5", borderRadius: 8, padding: 10, fontSize: 15 }} />
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14, fontSize: 13, color: "#444" }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3 }} />
        I have read this document and agree to be bound by its terms. My typed name acts as my electronic signature.
      </label>
      {error && <p style={{ color: "#b91c1c", fontSize: 13, marginTop: 8 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button disabled={pending || !agree || !name.trim()} onClick={() => start(async () => { try { await signContract(token, name); setDone(name); } catch (e) { setError(e instanceof Error ? e.message : "Could not sign."); } })}
          style={{ background: accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: 14, opacity: pending || !agree || !name.trim() ? 0.5 : 1 }}>
          {pending ? "Signing…" : "Sign document"}
        </button>
        <button disabled={pending} onClick={() => start(async () => { await declineContract(token, "Declined by signer"); setDeclined(true); })} style={{ background: "transparent", border: "1px solid #e5e5e5", borderRadius: 10, padding: "12px 20px", fontSize: 14 }}>Decline</button>
      </div>
    </div>
  );
}

import { loadPublicContract } from "@/core/contracts/actions";
import { loadBrand } from "@/core/email/render";
import { SignForm } from "./form";

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const contract = await loadPublicContract(token);
  if (!contract) return <Shell brand={null}><p className="text-lg">This sign link is no longer valid.</p></Shell>;
  const brand = await loadBrand(contract.organisationId);
  const expired = contract.expiresAt && contract.expiresAt < new Date();
  return (
    <Shell brand={brand}>
      <h1 className="mb-1 text-xl font-semibold">{contract.title}</h1>
      <p className="mb-6 text-xs text-slate-500">Reference {contract.reference}</p>
      {contract.status === "SIGNED" ? (
        <p className="font-semibold text-emerald-700">Signed by {contract.signerName} on {contract.signedAt?.toLocaleDateString("en-GB")}.</p>
      ) : contract.status === "DECLINED" ? (
        <p className="font-semibold text-red-700">This document was declined.</p>
      ) : expired ? (
        <p className="font-semibold text-red-700">This sign link has expired. Ask the sender to resend it.</p>
      ) : (
        <>
          <div className="prose prose-sm mb-8 max-w-none rounded-xl border border-slate-200 p-5" dangerouslySetInnerHTML={{ __html: contract.bodyHtml }} />
          <SignForm token={token} accent={brand.accent} />
        </>
      )}
    </Shell>
  );
}

function Shell({ brand, children }: { brand: { name: string; accent: string } | null; children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: "#f4f4f5", padding: 24 }}>
      <div style={{ maxWidth: 680, margin: "0 auto", background: "#fff", borderRadius: 16, padding: 32, borderTop: `3px solid ${brand?.accent ?? "#1d1d1f"}` }}>
        <p style={{ fontWeight: 700, marginBottom: 20 }}>{brand?.name ?? "Atlas"}</p>
        {children}
      </div>
    </main>
  );
}

import { db } from "@/core/db/client";
import { loadBrand } from "@/core/email/render";
import { CsatForm } from "./form";

export default async function CsatPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ score?: string }> }) {
  const { token } = await params;
  const { score } = await searchParams;
  const response = await db.csatResponse.findUnique({ where: { token }, include: { survey: true } });
  if (!response) return <Shell brand={null}><p className="text-lg">This survey link is no longer valid.</p></Shell>;
  const brand = await loadBrand(response.organisationId);
  if (response.respondedAt && !score) return <Shell brand={brand}><p className="text-lg font-semibold">Thank you — your response was already recorded.</p></Shell>;
  const picked = score ? Math.min(5, Math.max(1, Number(score))) : undefined;
  return (
    <Shell brand={brand}>
      <CsatForm token={token} survey={{ question: response.survey.question, followUpQuestion: response.survey.followUpQuestion, lowFollowUpQuestion: response.survey.lowFollowUpQuestion, thanksText: response.survey.thanksText, lowLabel: response.survey.lowLabel, highLabel: response.survey.highLabel, reasons: response.survey.reasons }} accent={brand.accent} initialScore={picked} alreadyScore={response.score ?? undefined} />
    </Shell>
  );
}

function Shell({ brand, children }: { brand: { name: string; accent: string } | null; children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f4f5", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%", background: "#fff", borderRadius: 16, padding: 32, borderTop: `3px solid ${brand?.accent ?? "#1d1d1f"}` }}>
        <p style={{ fontWeight: 700, marginBottom: 16 }}>{brand?.name ?? "Atlas"}</p>
        {children}
      </div>
    </main>
  );
}

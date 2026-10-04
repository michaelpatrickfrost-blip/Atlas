import { db } from "@/core/db/client";
import { emit, DOMAIN_EVENTS } from "@/core/events/bus";
import { loadBrand } from "@/core/email/render";

async function unsubscribe(token: string) {
  "use server";
  const message = await db.emailMessage.findFirst({ where: { openToken: token }, select: { organisationId: true, contactId: true, campaignId: true } });
  if (!message?.contactId) return;
  const profile = await db.marketingProfile.findUnique({ where: { contactId: message.contactId } });
  if (!profile) return;
  await db.marketingSuppression.create({ data: { organisationId: message.organisationId, profileId: profile.id, channel: "EMAIL", reason: "UNSUBSCRIBED", source: "unsubscribe_link", createdBy: "system" } });
  await emit(DOMAIN_EVENTS.marketingConsentChanged, { organisationId: message.organisationId, profileId: profile.id, channel: "EMAIL", state: "UNSUBSCRIBED" });
}

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const message = await db.emailMessage.findFirst({ where: { openToken: token }, select: { organisationId: true } });
  const brand = message ? await loadBrand(message.organisationId) : null;
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f4f5", padding: 24 }}>
      <div style={{ maxWidth: 420, width: "100%", background: "#fff", borderRadius: 16, padding: 32, textAlign: "center" }}>
        <p style={{ fontWeight: 700, marginBottom: 16 }}>{brand?.name ?? "Atlas"}</p>
        <form action={async () => { "use server"; await unsubscribe(token); }}>
          <p style={{ fontSize: 15, marginBottom: 16 }}>Stop receiving marketing emails from us?</p>
          <button style={{ background: "#1d1d1f", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: 14 }}>Unsubscribe</button>
        </form>
      </div>
    </main>
  );
}

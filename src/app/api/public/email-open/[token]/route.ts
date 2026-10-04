import { db } from "@/core/db/client";

const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const message = await db.emailMessage.findFirst({ where: { openToken: token, openedAt: null }, select: { id: true, organisationId: true, campaignId: true, partyId: true, contactId: true, messageClass: true } });
  if (message) {
    await db.emailMessage.update({ where: { id: message.id }, data: { openedAt: new Date() } });
    if (message.campaignId && message.contactId) {
      const profile = await db.marketingProfile.findUnique({ where: { contactId: message.contactId }, select: { id: true } });
      if (profile) await db.marketingEvent.upsert({
        where: { organisationId_idempotencyKey: { organisationId: message.organisationId, idempotencyKey: `open:${message.id}` } }, update: {},
        create: { organisationId: message.organisationId, profileId: profile.id, type: "EMAIL_OPENED", source: "email", occurredAt: new Date(), idempotencyKey: `open:${message.id}`, campaignId: message.campaignId, properties: {} },
      });
    }
  }
  return new Response(PIXEL, { headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" } });
}

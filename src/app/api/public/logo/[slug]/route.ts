import { db } from "@/core/db/client";

/** Company logo for outgoing email. Public by design: it is the company's own mark, nothing else. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await db.organisation.findUnique({ where: { slug }, select: { logoDataUrl: true } });
  const match = org?.logoDataUrl?.match(/^data:(image\/(?:png|jpeg|gif|webp));base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), { headers: { "Content-Type": match[1], "Cache-Control": "public, max-age=3600" } });
}

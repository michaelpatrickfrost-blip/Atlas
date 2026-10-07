import { loadPublicContractFile } from "@/core/contracts/actions";

/** The PDF behind a share link. The token in the address is the only credential. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const file = await loadPublicContractFile((await params).token);
  if (!file) return new Response("This link is no longer valid.", { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  return new Response(new Uint8Array(file.bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${file.name.replace(/"/g, "")}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex", "Referrer-Policy": "no-referrer" } });
}

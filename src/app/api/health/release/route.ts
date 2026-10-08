export const dynamic = "force-dynamic";
/** Public code identity only; no environment, database or company information. */
export function GET() {
  const value = process.env.ATLAS_RELEASE_REVISION ?? "";
  return Response.json({ revision: /^[a-f0-9]{40}$/.test(value) ? value : null }, { headers: { "Cache-Control": "no-store" } });
}

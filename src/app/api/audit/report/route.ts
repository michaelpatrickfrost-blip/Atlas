import { exportAuditReport } from "@/modules/audit/services/actions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? "");
  try {
    const csv = await exportAuditReport({
      query: url.searchParams.get("q") ?? undefined,
      personId: url.searchParams.get("person") ?? undefined,
      systemId: url.searchParams.get("system") ?? undefined,
      teamId: url.searchParams.get("team") ?? undefined,
      days: days === 1 || days === 30 ? days : 7,
    });
    const filename = `atlas-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith("FORBIDDEN") ? "You cannot download this audit report." : "The audit report could not be prepared.";
    return new Response(message, { status: error instanceof Error && error.message.startsWith("FORBIDDEN") ? 403 : 400, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store" } });
  }
}

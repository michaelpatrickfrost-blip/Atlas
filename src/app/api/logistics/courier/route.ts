import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { csvResponse } from "@/core/shared/csv-export";
import { chosenCourierColumns, courierTable } from "@/modules/logistics/domain/handling";
import { courierRecords } from "@/modules/logistics/services/handling";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireSession();
  assertCapability(session, C.shipmentRead);
  await assertModuleEnabled(session, "logistics");
  const params = new URL(request.url).searchParams;
  const ids = (params.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean).slice(0, 200);
  const columns = chosenCourierColumns((params.get("columns") ?? "").split(","));
  if (!ids.length) return new Response("Choose at least one shipment.", { status: 400 });
  const records = await courierRecords(session.organisationId, ids);
  return csvResponse(`atlas-courier-${new Date().toISOString().slice(0, 10)}.csv`, courierTable(records, columns));
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { assertModuleEnabled } from "@/core/modules/access";
import { allocateRequirement, recordDirectShipment, releaseRequirement, restoreCancelledFulfilment, syncMissingDemand } from "@/modules/logistics/services/demand";
import { captureLot, captureSerial, claimTask, completeTask, groupWork, scanTask, shortPick } from "@/modules/logistics/services/work";
import { addPackage, confirmDelivery, createLoad, createShipment, departLoad, dispatchShipment, labelShipment, loadShipment, recordTracking, recordWeight, stageShipment } from "@/modules/logistics/services/shipping";
import { completeReceipt, expectReceipt, moveTransfer, putAway, receiveLine, receiveTransfer } from "@/modules/logistics/services/inbound";
import { authoriseReturn, closeReturn, inspectReturn, receiveReturn, requestReturn } from "@/modules/logistics/services/returns";
import { policyFor } from "@/modules/logistics/services/numbers";
import { packOntoUnit, removeHandlingType, retireHandlingType, saveHandlingType } from "@/modules/logistics/services/handling";
import { assignHandlingEquipment } from "@/modules/logistics/services/equipment";
import { db } from "@/core/db/client";

async function gate(capability: string) {
  const session = await requireSession();
  assertCapability(session, capability);
  await assertModuleEnabled(session, "logistics");
  return session;
}

function refresh(path = "/logistics") { revalidatePath(path); revalidatePath("/logistics"); }

export async function syncDemandAction() {
  const session = await gate(C.fulfilmentRead);
  await syncMissingDemand(session);
  refresh();
}

export async function restoreDeliveryAction(id: string) {
  const session = await gate(C.fulfilmentRelease);
  await restoreCancelledFulfilment(session, id);
  refresh(`/logistics/fulfil/${id}`);
}

export async function releaseAction(id: string) {
  const session = await gate(C.fulfilmentRelease);
  const taskId = await releaseRequirement(session, id);
  refresh(`/logistics/fulfil/${id}`);
  if (taskId) redirect(`/logistics/work/${taskId}`);
}

export async function allocateAction(id: string) {
  const session = await gate(C.fulfilmentRelease);
  await allocateRequirement(session, id);
  refresh(`/logistics/fulfil/${id}`);
}

export async function directShipAction(id: string, form: FormData) {
  const session = await gate(C.shipmentCreate);
  await recordDirectShipment(session, id, String(form.get("tracking") ?? "").trim());
  refresh(`/logistics/fulfil/${id}`);
}

export async function groupAction(form: FormData) {
  const session = await gate(C.fulfilmentRelease);
  const ids = form.getAll("id").map(String);
  const method = String(form.get("method") ?? "BATCH");
  if (!["BATCH", "WAVE", "CLUSTER", "ZONE"].includes(method)) throw new Error("Choose a picking method.");
  const taskId = await groupWork(session, ids, method as "BATCH" | "WAVE" | "CLUSTER" | "ZONE");
  refresh();
  redirect(`/logistics/work/${taskId}`);
}

export async function scanAction(taskId: string, lineId: string, barcode: string, requestKey: string) {
  const session = await gate(C.pickExecute);
  const result = await scanTask(session, taskId, lineId, barcode, requestKey);
  revalidatePath(`/logistics/work/${taskId}`);
  return result;
}

export async function lotAction(lineId: string, lot: string) {
  const session = await gate(C.pickExecute);
  await captureLot(session, lineId, lot);
}

export async function serialAction(lineId: string, serial: string) {
  const session = await gate(C.pickExecute);
  await captureSerial(session, lineId, serial);
}

export async function shortAction(lineId: string, quantity: number, reason: string) {
  const session = await gate(C.pickExecute);
  await shortPick(session, lineId, quantity, reason);
  refresh();
}

export async function completeWorkAction(taskId: string) {
  const session = await requireSession();
  await assertModuleEnabled(session, "logistics");
  const task = await db.warehouseTask.findFirst({ where: { id: taskId, organisationId: session.organisationId }, select: { kind: true } });
  assertCapability(session, task?.kind === "PACK" ? C.packExecute : C.pickExecute);
  await completeTask(session, taskId);
  refresh(`/logistics/work/${taskId}`);
  if (task?.kind === "PACK") {
    const packed = await db.warehouseTask.findFirst({ where: { id: taskId, organisationId: session.organisationId }, select: { shipmentId: true } });
    if (packed?.shipmentId) redirect(`/logistics/shipments/${packed.shipmentId}`);
  }
}

export async function claimAction(taskId: string) {
  const session = await gate(C.pickExecute);
  await claimTask(session, taskId);
  refresh(`/logistics/work/${taskId}`);
}

export async function shipFromPickAction(requirementId: string, form: FormData) {
  const session = await gate(C.shipmentCreate);
  const lines = form.getAll("line").map(String);
  const quantities = lines.map((id) => ({ fulfilmentLineId: id, quantity: Number(form.get(`qty-${id}`)) }));
  const shipmentId = await createShipment(session, requirementId, quantities);
  refresh();
  redirect(`/logistics/shipments/${shipmentId}`);
}

export async function packageAction(shipmentId: string, form: FormData) {
  const session = await gate(C.packExecute);
  await addPackage(session, shipmentId, { packageType: String(form.get("packageType") ?? "BOX"), weightGrams: Number(form.get("weightGrams")) || undefined, contents: [{ description: String(form.get("description") ?? "Contents"), quantity: Number(form.get("quantity") ?? 1), productId: String(form.get("productId") ?? "") || undefined }] });
  refresh(`/logistics/shipments/${shipmentId}`);
}

export async function weightAction(packageId: string, grams: number) {
  const session = await gate(C.packExecute);
  await recordWeight(session, packageId, grams);
  refresh();
}

export async function stageAction(shipmentId: string, form: FormData) {
  const session = await gate(C.dispatchManage);
  await stageShipment(session, shipmentId, String(form.get("lane") ?? "Lane 1"));
  refresh(`/logistics/shipments/${shipmentId}`);
}

export async function labelAction(shipmentId: string) {
  const session = await gate(C.shipmentDispatch);
  return labelShipment(session, shipmentId);
}

export async function dispatchAction(shipmentId: string, requestKey: string) {
  const session = await gate(C.shipmentDispatch);
  await dispatchShipment(session, shipmentId, requestKey);
  revalidatePath("/sales/orders", "layout");
  revalidatePath("/finance", "layout");
  revalidatePath("/stock");
  revalidatePath("/planning");
  refresh(`/logistics/shipments/${shipmentId}`);
}

export async function trackingAction(shipmentId: string, form: FormData) {
  const session = await gate(C.shipmentDispatch);
  await recordTracking(session, shipmentId, String(form.get("status") ?? ""), `track:${shipmentId}:${String(form.get("key") ?? Date.now())}`);
  refresh(`/logistics/shipments/${shipmentId}`);
}

export async function deliverAction(shipmentId: string, form: FormData) {
  const session = await gate(C.shipmentDispatch);
  const outcome = String(form.get("outcome") ?? "DELIVERED");
  if (!["DELIVERED", "PARTIAL", "FAILED"].includes(outcome)) throw new Error("Choose delivered, partial or failed.");
  await confirmDelivery(session, shipmentId, { outcome: outcome as "DELIVERED" | "PARTIAL" | "FAILED", receiver: String(form.get("receiver") ?? ""), note: String(form.get("note") ?? ""), failureReason: String(form.get("reason") ?? "") });
  revalidatePath("/sales/orders", "layout");
  revalidatePath("/finance", "layout");
  revalidatePath("/stock");
  revalidatePath("/planning");
  refresh(`/logistics/shipments/${shipmentId}`);
}

export async function loadCreateAction(form: FormData) {
  const session = await gate(C.routeManage);
  const id = await createLoad(session, { vehicleLabel: String(form.get("vehicle") ?? "").trim() || "Own vehicle", driverName: String(form.get("driver") ?? ""), routeName: String(form.get("route") ?? ""), shipmentIds: form.getAll("shipment").map(String) });
  refresh();
  redirect(`/logistics/loads/${id}`);
}

export async function loadScanAction(loadId: string, form: FormData) {
  const session = await gate(C.dispatchManage);
  await loadShipment(session, loadId, String(form.get("barcode") ?? ""));
  refresh(`/logistics/loads/${loadId}`);
}

export async function departAction(loadId: string) {
  const session = await gate(C.shipmentDispatch);
  await departLoad(session, loadId);
  revalidatePath("/sales/orders", "layout");
  revalidatePath("/finance", "layout");
  revalidatePath("/stock");
  revalidatePath("/planning");
  refresh(`/logistics/loads/${loadId}`);
}

export async function expectAction(form: FormData) {
  const session = await gate(C.receiptExecute);
  const id = await expectReceipt(session, { sourceType: String(form.get("sourceType") ?? "MANUAL"), sourceReference: String(form.get("sourceReference") ?? "").trim(), partyName: String(form.get("partyName") ?? ""), warehouseId: String(form.get("warehouseId") ?? ""), lines: [{ description: String(form.get("description") ?? ""), productId: String(form.get("productId") ?? "") || undefined, quantity: Number(form.get("quantity")) }] });
  refresh("/logistics/receive");
  redirect(`/logistics/receive/${id}`);
}

export async function receiveLineAction(lineId: string, form: FormData) {
  const session = await gate(C.receiptExecute);
  await receiveLine(session, lineId, { quantity: Number(form.get("quantity")), lotCode: String(form.get("lot") ?? "") || undefined, condition: String(form.get("condition") ?? "GOOD"), requestKey: String(form.get("requestKey") ?? `recv:${lineId}:${Date.now()}`) });
  refresh("/logistics/receive");
}

export async function putAwayAction(lineId: string, form: FormData) {
  const session = await gate(C.receiptExecute);
  await putAway(session, lineId, String(form.get("destination") ?? ""), String(form.get("requestKey") ?? `putaway:${lineId}`));
  refresh("/logistics/receive");
}

export async function completeReceiptAction(id: string) {
  const session = await gate(C.receiptExecute);
  await completeReceipt(session, id);
  refresh(`/logistics/receive/${id}`);
}

export async function transferAction(form: FormData) {
  const session = await gate(C.receiptExecute);
  await moveTransfer(session, { productId: String(form.get("productId")), fromWarehouseId: String(form.get("from")), toWarehouseId: String(form.get("to")), quantity: Number(form.get("quantity")), requestKey: `transfer:${String(form.get("requestKey") ?? Date.now())}` });
  refresh("/logistics/receive");
}

export async function transferReceiveAction(form: FormData) {
  const session = await gate(C.receiptExecute);
  await receiveTransfer(session, { productId: String(form.get("productId")), warehouseId: String(form.get("warehouseId")), quantity: Number(form.get("quantity")), requestKey: `transfer-in:${String(form.get("requestKey") ?? Date.now())}` });
  refresh("/logistics/receive");
}

export async function returnRequestAction(form: FormData) {
  const session = await gate(C.returnAuthorise);
  const id = await requestReturn(session, { partyId: String(form.get("partyId")), salesOrderId: String(form.get("salesOrderId") ?? "") || undefined, reason: String(form.get("reason")), lines: [{ description: String(form.get("description") ?? "Returned goods"), productId: String(form.get("productId") ?? "") || undefined, quantity: Number(form.get("quantity") ?? 1) }] });
  refresh("/logistics/returns");
  redirect(`/logistics/returns/${id}`);
}

export async function authoriseReturnAction(id: string, approve: boolean) {
  const session = await gate(C.returnAuthorise);
  await authoriseReturn(session, id, approve);
  refresh(`/logistics/returns/${id}`);
}

export async function receiveReturnAction(lineId: string, form: FormData) {
  const session = await gate(C.receiptExecute);
  await receiveReturn(session, lineId, { quantity: Number(form.get("quantity")), condition: String(form.get("condition") ?? "UNKNOWN"), requestKey: `return:${lineId}:${String(form.get("requestKey") ?? Date.now())}` });
  refresh("/logistics/returns");
}

export async function inspectAction(lineId: string, form: FormData) {
  const session = await gate(C.returnInspect);
  await inspectReturn(session, lineId, String(form.get("disposition")), String(form.get("replacement") ?? "") || undefined);
  refresh("/logistics/returns");
}

export async function closeReturnAction(id: string) {
  const session = await gate(C.returnResolve);
  await closeReturn(session, id);
  refresh(`/logistics/returns/${id}`);
}

export async function assignEquipmentAction(taskId: string, form: FormData) {
  const session = await gate(C.pickExecute);
  const equipmentRef = String(form.get("equipmentRef") ?? "").trim();
  if (!equipmentRef) throw new Error("Name the equipment.");
  const competenceKey = String(form.get("competenceKey") ?? "").trim() || null;
  await assignHandlingEquipment(session, taskId, equipmentRef, competenceKey);
  refresh(`/logistics/work/${taskId}`);
}

export async function packUnitAction(taskId: string, form: FormData) {
  const session = await gate(C.packExecute);
  const lines = form.getAll("taskLine").map(String).map((taskLineId) => ({ taskLineId, quantity: Number(form.get(`qty-${taskLineId}`)) }));
  await packOntoUnit(session, {
    taskId,
    typeCode: String(form.get("typeCode") ?? ""),
    parentId: String(form.get("parentId") ?? "") || undefined,
    lengthMm: Number(form.get("lengthMm")) || undefined,
    widthMm: Number(form.get("widthMm")) || undefined,
    heightMm: Number(form.get("heightMm")) || undefined,
    weightGrams: Number(form.get("weightGrams")) || undefined,
    lines,
  });
  refresh(`/logistics/work/${taskId}`);
}

export async function saveHandlingTypeAction(form: FormData) {
  const session = await gate(C.policyManage);
  const taskId = String(form.get("taskId") ?? "");
  await saveHandlingType(session, {
    code: String(form.get("code") ?? ""),
    name: String(form.get("name") ?? ""),
    lengthMm: Number(form.get("lengthMm")),
    widthMm: Number(form.get("widthMm")),
    heightMm: Number(form.get("heightMm")),
    tareWeightGrams: Math.round(Number(form.get("tareKg") ?? 0) * 1000),
    canContain: form.get("canContain") === "on",
  });
  refresh(taskId ? `/logistics/work/${taskId}` : "/logistics");
}

export async function retireHandlingTypeAction(code: string, taskId: string) {
  const session = await gate(C.policyManage);
  await retireHandlingType(session, code);
  refresh(taskId ? `/logistics/work/${taskId}` : "/logistics");
}

export async function removeHandlingTypeAction(code: string, taskId: string) {
  const session = await gate(C.policyManage);
  await removeHandlingType(session, code);
  refresh(taskId ? `/logistics/work/${taskId}` : "/logistics");
}

export async function policyAction(form: FormData) {
  const session = await gate(C.policyManage);
  const mode = String(form.get("mode") ?? "STANDARD");
  const reservationPolicy = String(form.get("reservationPolicy") ?? "ON_CONFIRMATION");
  const releaseMethod = String(form.get("releaseMethod") ?? "MANUAL");
  if (!["SIMPLE", "STANDARD", "ADVANCED"].includes(mode)) throw new Error("Choose a warehouse mode.");
  await policyFor(session.organisationId);
  await db.logisticsPolicy.update({ where: { organisationId: session.organisationId }, data: { mode, reservationPolicy, releaseMethod, packVerification: String(form.get("packVerification") ?? "BARCODE"), overPickPolicy: String(form.get("overPickPolicy") ?? "PROHIBITED") } });
  refresh("/logistics/reports");
}

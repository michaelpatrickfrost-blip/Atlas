import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";
import { assertDrawFits, openCommitment, type ReleasedDraw } from "../domain/call-off";

type Store = typeof db | Prisma.TransactionClient;
type AgreementLine = { id: string; productId: string | null; description: string; committedQuantity: number; unitPriceAmount: number };
type SourceLine = { agreementLineId?: string | null; productId?: string | null; description?: string; type: string; orderedQuantity: number; cancelledQuantity?: number; discountPercent?: number | null; unitPriceAmount: number };

export function matchAgreementLine(lines: AgreementLine[], line: { agreementLineId?: string | null; productId?: string | null; description?: string }) {
  if (line.agreementLineId) {
    const match = lines.find((item) => item.id === line.agreementLineId);
    if (!match) throw new Error("This call-off line is not on the agreement.");
    return match;
  }
  const matches = lines.filter((item) => item.productId && item.productId === line.productId);
  if (matches.length !== 1) throw new Error(`Choose the agreement line for ${line.description || "this product"}.`);
  return matches[0];
}

export function callOffPrice(lines: AgreementLine[], line: { agreementLineId?: string | null; productId?: string | null; description?: string }, reference: string) {
  const slot = matchAgreementLine(lines, line);
  return { agreementLineId: slot.id, unitPriceAmount: slot.unitPriceAmount, priceSource: `Call-off ${reference}`, label: slot.description };
}

function draws(lines: AgreementLine[], orders: { id: string; lines: SourceLine[] }[]): ReleasedDraw[] {
  return orders.flatMap((order) => order.lines.flatMap((line) => {
    if (["SECTION", "NOTE"].includes(line.type)) return [];
    const quantity = line.orderedQuantity - (line.cancelledQuantity ?? 0);
    if (quantity <= 0) return [];
    return [{ key: matchAgreementLine(lines, { ...line, description: line.description }).id, quantity, orderId: order.id }];
  }));
}

export async function lockAgreement(tx: Prisma.TransactionClient, organisationId: string, agreementId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM sales_agreements WHERE id = ${agreementId} AND "organisationId" = ${organisationId} FOR UPDATE`;
  if (!rows.length) throw new Error("This call-off agreement is unavailable.");
}

export async function loadAgreement(store: Store, organisationId: string, agreementId: string) {
  return store.salesAgreement.findFirstOrThrow({
    where: { id: agreementId, organisationId },
    include: {
      lines: { orderBy: { lineNumber: "asc" } },
      callOffs: { where: { organisationId, commercialStatus: { not: "CANCELLED" } }, include: { lines: true } },
    },
  });
}

export function agreementWindowOpen(agreement: { status: string; startsAt: Date; endsAt: Date }, now = new Date()) {
  if (agreement.status !== "ACTIVE") throw new Error("This call-off agreement is not open.");
  const day = now.toISOString().slice(0, 10);
  if (agreement.startsAt.toISOString().slice(0, 10) > day) throw new Error("This call-off agreement has not started.");
  if (agreement.endsAt.toISOString().slice(0, 10) < day) throw new Error("This call-off agreement has ended.");
}

export async function assertCallOffCapacity(store: Store, input: { organisationId: string; agreementId: string; partyId: string; pricingPartyId?: string | null; currency: string; orderId?: string; lines: SourceLine[] }) {
  const agreement = await loadAgreement(store, input.organisationId, input.agreementId);
  agreementWindowOpen(agreement);
  if (input.partyId !== agreement.partyId) throw new Error("A call-off uses the customer on the agreement.");
  if ((input.pricingPartyId ?? input.partyId) !== (agreement.pricingPartyId ?? agreement.partyId)) throw new Error("A call-off keeps the agreement pricing account.");
  if (input.currency !== agreement.currency) throw new Error(`This agreement is priced in ${agreement.currency}.`);
  const proposed = input.lines.flatMap((line) => {
    if (["SECTION", "NOTE"].includes(line.type)) return [];
    const slot = matchAgreementLine(agreement.lines, line);
    if ((line.discountPercent ?? 0) !== 0 || line.unitPriceAmount !== slot.unitPriceAmount) throw new Error(`Call-off orders use the agreed price for ${slot.description}.`);
    return [{ key: slot.id, quantity: line.orderedQuantity - (line.cancelledQuantity ?? 0), label: slot.description }];
  });
  assertDrawFits(agreement.lines.map((line) => ({ key: line.id, committed: line.committedQuantity })), draws(agreement.lines, agreement.callOffs), proposed, input.orderId);
  return agreement;
}

export function commitmentView(lines: AgreementLine[], orders: { id: string; lines: SourceLine[] }[]) {
  const open = openCommitment(lines.map((line) => ({ key: line.id, committed: line.committedQuantity })), draws(lines, orders));
  return new Map(open.map((line) => [line.key, line]));
}

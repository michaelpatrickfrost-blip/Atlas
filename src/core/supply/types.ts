import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";

/** Owning modules expose bounded, authorised projections; the console owns no ledger. */
export type SupplySpendRequest = { entity?: string; start: string; end: string; group: "supplier" | "category" | "costCentre" | "site" | "month" };
export type SupplySpendReport = {
  entities: Array<{ id: string; name: string; currency: string }>;
  entity: { id: string; name: string; currency: string } | null;
  start: string; end: string;
  totals: Array<{ currency: string; postedNet: string | null; committedNet: string | null; receivedNet: string | null; openPayables: string | null }>;
  groups: Array<{ label: string; currency: string; net: string; documents: number }>;
  documents: Array<{ id: string; reference: string; supplier: string; kind: string; date: string; currency: string; net: string; sourceId: string | null; sourceReference: string | null }>;
  purchaseCount: number; warnings: string[];
};
export type SupplySpendProvider = (session: Session, request: SupplySpendRequest) => Promise<SupplySpendReport>;
export type PurchaseProposal = { id: string; runId: string; productId: string; productName: string; productCode: string; unit: string; quantity: string; neededBy: string | null; version: string };
export type SupplyPurchaseProvider = {
  read(session: Session, id: string): Promise<PurchaseProposal>;
  claim(session: Session, tx: Prisma.TransactionClient, input: { id: string; version: string; documentId: string; productId: string; quantity: string }): Promise<void>;
};

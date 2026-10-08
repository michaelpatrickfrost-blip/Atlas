import type { Session } from "@/core/auth/session";

export type RecordRef = { moduleId: string; type: string; id: string };
/** Owner-authorised identity anchors; no copied commercial/private field payloads. */
export type RelationshipContext = { record: RecordRef; anchors: RecordRef[] };
export type RecordRelationship = {
  id: string;
  title: string;
  kind: string;
  href: string;
  direction: "upstream" | "downstream" | "related";
  detail?: string;
};
export type RelationshipContribution = { links: RecordRelationship[]; hasMore?: boolean };
export type RecordContextProvider = (session: Session, record: RecordRef) => Promise<RelationshipContext | null>;
export type RecordRelationshipProvider = (session: Session, context: RelationshipContext) => Promise<RelationshipContribution>;

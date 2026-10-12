import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { nativeFieldMutationSessionInTransaction } from "@/core/studio/fields/runtime-authority";
import { parseBlocks, validateFields } from "./domain";
import { requireTemplateWorkspace, resolveTemplateContext, templateRecords, templateSources } from "./service";
import { TARGET_MODULES } from "./types";

const targetsSchema = z.array(z.enum(TARGET_MODULES)).min(1).max(TARGET_MODULES.length);
const previewSchema = z.strictObject({ titleTemplate: z.string().trim().min(1).max(300), blocks: z.unknown(),
  targetModules: targetsSchema, sourceModule: z.enum(TARGET_MODULES), sourceType: z.string().min(1).max(100), sourceId: z.string().min(1).max(100) });
export type DocumentPreviewChoice = { module: string; type: string; id: string; label: string };
export type DocumentPreview = { fields: Record<string, string>; sourceLabel: string; companyName: string };

/** Explicit read, no template/PDF/document/Audit mutation. Genuine current native
 * authority is independent of Studio. Owning providers enforce their source Read,
 * tenant and private access; the browser cannot supply source facts or a tenant. */
export async function listDocumentPreviewRecordsInTransaction(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown): Promise<DocumentPreviewChoice[]> {
  const { session } = await nativeFieldMutationSessionInTransaction(authenticated, transaction);
  assertCapability(session, "core.contract.manage"); await requireTemplateWorkspace(session);
  const targets = targetsSchema.parse(input), sources = (await templateSources(session)).filter(source => targets.includes(source.module));
  const groups = await Promise.all(sources.map(async source => (await templateRecords(session, source.module, source.type)).slice(0, 200)
    .map(record => ({ module: source.module, type: source.type, id: record.id, label: `${source.label} · ${record.label}` }))));
  return groups.flat().slice(0, 1000);
}
export async function previewDocumentInTransaction(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown): Promise<DocumentPreview> {
  const { session } = await nativeFieldMutationSessionInTransaction(authenticated, transaction);
  assertCapability(session, "core.contract.manage"); await requireTemplateWorkspace(session);
  const packet = previewSchema.parse(input), blocks = parseBlocks(packet.blocks);
  validateFields(`${packet.titleTemplate}\n${blocks.map(block => block.text).join("\n")}`);
  if (!packet.targetModules.includes(packet.sourceModule)) throw new Error("Choose a record from an app selected for this template.");
  const context = await resolveTemplateContext(session, packet);
  if (!context.source) throw new Error("Choose an available business record.");
  return { fields: context.fields, sourceLabel: context.source.label, companyName: context.brand.name };
}

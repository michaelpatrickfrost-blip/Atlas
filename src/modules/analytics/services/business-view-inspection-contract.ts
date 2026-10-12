import { z } from 'zod';
import { analyticsBusinessViewContentSchema, type BusinessViewContent } from './business-view-contract';
export const businessViewInspectionSchema = z.strictObject({ definitionId: z.uuid(),
  revision: z.number().int().nonnegative().max(2147483646), definitionRevision: z.number().int().nonnegative().max(2147483646),
  content: analyticsBusinessViewContentSchema });
export type BusinessMeasureReference = { id: string; name: string; sourceHref: string; whereUsedHref: string };
export type BusinessViewInspection = { definitionId: string; revision: number; definitionRevision: number;
  content: BusinessViewContent; warnings: string[]; measures: BusinessMeasureReference[] };
export type BusinessViewComparison = { definitionId: string; revision: number; definitionRevision: number; activeVersionId: string | null;
  saved: BusinessViewContent; local: BusinessViewContent; warnings: string[]; changes: string[]; measures: BusinessMeasureReference[] };

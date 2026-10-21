import { z } from "zod";

/** Browser-safe shared contract identity. Keep this shape byte-for-byte stable:
 * the server compiler and published hashes use this same schema. */
export const referenceSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/),
  version: z.number().int().positive(), schemaHash: z.string().regex(/^[a-f0-9]{64}$/),
  contractHash: z.string().regex(/^[a-f0-9]{64}$/),
});

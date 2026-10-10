import { z } from "zod";

export const fieldMigrationIdentity = {
  organisationId: z.string().min(1).max(100), userId: z.string().min(1).max(100),
  membershipId: z.string().min(1).max(100),
  authVersion: z.number().int().nonnegative(), sessionVersion: z.number().int().nonnegative(),
};
/** Identity only. Current permissions and support audit are resolved server-side. */
export const fieldMigrationPrincipalSchema = z.discriminatedUnion("authority", [
  z.strictObject({ ...fieldMigrationIdentity, authority: z.literal("customer") }),
  z.strictObject({ ...fieldMigrationIdentity, authority: z.literal("staff_support"), auditId: z.string().min(1).max(100) }),
]);
export type FieldMigrationPrincipal = z.infer<typeof fieldMigrationPrincipalSchema>;

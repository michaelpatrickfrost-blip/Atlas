import { createHash } from "node:crypto";

/** Public account snapshot; never send password hashes to an administration form. */
export function managedAccountRevision(member: {
  id: string;
  active: boolean;
  sessionVersion: number;
  user: { id: string; name: string; email: string; authVersion: number };
}) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        member.id,
        member.active,
        member.sessionVersion,
        member.user.id,
        member.user.name,
        member.user.email,
        member.user.authVersion,
      ]),
    )
    .digest("hex");
}

export function assertCompanyManagedAccount(user: {
  platformAdmin: unknown;
  _count: { memberships: number };
}) {
  if (user.platformAdmin || user._count.memberships !== 1)
    throw new Error(
      "Company administrators cannot change platform or shared accounts. The account owner must manage their details and password.",
    );
}

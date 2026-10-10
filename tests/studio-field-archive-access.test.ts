import { expect, it } from "vitest";
import type { Session } from "@/core/auth/session";
import { canReadModel } from "@/server/data-api/read-policy";
import { planRead } from "@/server/data-api/read-query";

const session: Session = { organisationId: "company", organisationName: "Company", userId: "user", membershipId: "member",
  userName: "User", userEmail: "user@example.invalid", capabilities: new Set([
    "studio.definition.read", "studio.definition.edit", "studio.definition.publish",
    "tickets.ticket.read", "tickets.ticket.manage", "atlas.staff.manage", "atlas.companies.manage",
  ]) };

it("generic desktop queries cannot expose field review identities, source records, fingerprints or counts", () => {
  for (const model of ["StudioFieldMigrationPreparation", "StudioFieldMigrationReview", "StudioFieldMigrationObservation", "StudioFieldMigrationPublication"] as const) {
    expect(canReadModel(session, model)).toBe(false);
    for (const args of [{}, { where: { organisationId: "other" } }, { select: { id: true } }])
      expect(() => planRead(session, model, args)).toThrow("FORBIDDEN");
    expect(() => planRead(session, model, {}, 0, false, false)).toThrow("FORBIDDEN");
  }
});

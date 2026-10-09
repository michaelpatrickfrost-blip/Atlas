import { describe, expect, it } from "vitest";
import {
  appointmentSchema,
  appointmentDay,
  appointmentWeek,
  appointmentInstant,
  appointmentLocalInput,
} from "@/modules/crm/domain/appointments";
const input = {
  requestKey: "6f119a62-5fca-4ca3-b03d-632e0518a74f",
  subject: "Customer visit",
  type: "SITE_VISIT",
  startsAt: "2026-10-09T09:00:00Z",
  endsAt: "2026-10-09T10:00:00Z",
  partyId: "account",
};
describe("Sales appointment validation and London calendar", () => {
  it("requires a real linked account and a positive, bounded duration", () => {
    expect(appointmentSchema.safeParse(input).success).toBe(true);
    for (const changed of [
      { partyId: "" },
      { prospectId: "prospect" },
      { endsAt: input.startsAt },
      { endsAt: "2026-10-11T09:00:00Z" },
      { type: "EMAIL" },
      { startsAt: "bad" },
      { subject: "   " },
      { version: -1 },
      { notes: "x".repeat(10001) },
    ])
      expect(
        appointmentSchema.safeParse({ ...input, ...changed }).success,
      ).toBe(false);
  });
  it("never accepts tenant scope, cancellation or completion fields from the editor", () => {
    for (const changed of [
      { organisationId: "foreign" },
      { completedAt: input.startsAt },
      { cancelledAt: input.startsAt },
      { outcome: "done" },
    ])
      expect(
        appointmentSchema.safeParse({ ...input, ...changed }).success,
      ).toBe(false);
  });
  it("converts London wall time without depending on the host timezone", () => {
    expect(appointmentInstant("2026-10-09T10:00")).toBe(
      "2026-10-09T09:00:00.000Z",
    );
    expect(appointmentInstant("2026-12-09T10:00")).toBe(
      "2026-12-09T10:00:00.000Z",
    );
    expect(appointmentLocalInput("2026-10-09T09:00:00Z")).toBe(
      "2026-10-09T10:00",
    );
    expect(() => appointmentInstant("2026-03-29T01:30")).toThrow(
      "clocks change",
    );
    expect(() => appointmentInstant("2026-02-30T09:00")).toThrow();
  });
  it("groups midnight and clock changes into the correct local week", () => {
    expect(appointmentDay("2026-10-08T23:30:00Z")).toBe("2026-10-09");
    expect(appointmentWeek("2026-10-11").days).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
    expect(() => appointmentWeek("2026-02-30")).toThrow();
  });
});

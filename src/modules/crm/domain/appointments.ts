import { z } from "zod";

export const APPOINTMENT_TYPES = [
  "MEETING",
  "CALL",
  "DEMO",
  "SITE_VISIT",
  "FOLLOW_UP",
] as const;
const optionalId = z.string().max(100).default("");
export const appointmentSchema = z
  .object({
    id: optionalId,
    version: z.coerce.number().int().min(1).default(1),
    requestKey: z.string().uuid(),
    subject: z.string().trim().min(1, "Give the appointment a title.").max(300),
    type: z.enum(APPOINTMENT_TYPES),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }),
    location: z.string().trim().max(500).default(""),
    notes: z.string().trim().max(10000).default(""),
    partyId: optionalId,
    prospectId: optionalId,
    opportunityId: optionalId,
    ownerUserId: optionalId,
  })
  .strict()
  .superRefine((value, ctx) => {
    const start = new Date(value.startsAt).getTime(),
      end = new Date(value.endsAt).getTime();
    if (end <= start || end - start > 86400000)
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End time must follow the start, within 24 hours.",
      });
    if (!value.partyId && !value.prospectId && !value.opportunityId)
      ctx.addIssue({
        code: "custom",
        path: ["partyId"],
        message: "Link a customer, prospect or deal.",
      });
    if (value.partyId && value.prospectId)
      ctx.addIssue({
        code: "custom",
        path: ["partyId"],
        message: "Choose a customer or a prospect.",
      });
  });
export function appointmentDay(iso: string, timeZone = "Europe/London") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}
export function appointmentWeek(value?: string) {
  const today = appointmentDay(new Date().toISOString());
  const day = /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? value! : today;
  const date = new Date(`${day}T12:00:00Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== day
  )
    throw new Error("Choose a valid calendar date.");
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + index);
    return d.toISOString().slice(0, 10);
  });
  return {
    days,
    start: new Date(`${days[0]}T00:00:00Z`),
    end: new Date(new Date(`${days[6]}T00:00:00Z`).getTime() + 86400000),
  };
}

export function appointmentLocalInput(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
export function appointmentInstant(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error("Choose a date and time.");
  const wall = new Date(`${value}:00Z`);
  if (!Number.isFinite(wall.getTime()))
    throw new Error("Choose a valid date and time.");
  let instant = wall;
  for (let index = 0; index < 2; index++) {
    const projected = new Date(
      `${appointmentLocalInput(instant.toISOString())}:00Z`,
    );
    instant = new Date(
      instant.getTime() + wall.getTime() - projected.getTime(),
    );
  }
  if (appointmentLocalInput(instant.toISOString()) !== value)
    throw new Error(
      "This time does not exist when the clocks change. Choose another time.",
    );
  return instant.toISOString();
}

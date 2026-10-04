import crypto from "node:crypto";

export type CalendarInvite = {
  uid?: string; title: string; description?: string; location?: string; url?: string;
  startsAt: string; endsAt: string; organiserEmail: string; organiserName?: string;
  attendees: Array<{ email: string; name?: string }>; reminderMinutes?: number;
};

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const fold = (line: string) => line.length <= 73 ? line : line.match(/.{1,73}/g)!.join("\r\n ");
const clean = (v: string) => v.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 meeting request. METHOD:REQUEST makes Outlook, Google and Apple show Accept / Decline. */
export function buildIcs(invite: CalendarInvite) {
  const uid = invite.uid ?? `${crypto.randomUUID()}@atlas`;
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Atlas//Calendar//EN", "CALSCALE:GREGORIAN", "METHOD:REQUEST",
    "BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(invite.startsAt)}`, `DTEND:${stamp(invite.endsAt)}`, `SUMMARY:${clean(invite.title)}`,
    ...(invite.description ? [`DESCRIPTION:${clean(invite.description + (invite.url ? `\n${invite.url}` : ""))}`] : invite.url ? [`DESCRIPTION:${clean(invite.url)}`] : []),
    ...(invite.location ? [`LOCATION:${clean(invite.location)}`] : []),
    ...(invite.url ? [`URL:${invite.url}`] : []),
    `ORGANIZER;CN=${clean(invite.organiserName ?? invite.organiserEmail)}:mailto:${invite.organiserEmail}`,
    ...invite.attendees.map((a) => `ATTENDEE;CN=${clean(a.name ?? a.email)};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${a.email}`),
    "STATUS:CONFIRMED", "SEQUENCE:0",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Reminder", `TRIGGER:-PT${invite.reminderMinutes ?? 30}M`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ];
  return { uid, ics: lines.map(fold).join("\r\n") + "\r\n" };
}

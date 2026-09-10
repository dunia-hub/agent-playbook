import { createHash } from "node:crypto";

function escapeText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function escapeParameter(value) {
  return String(value).replace(/["\r\n]/g, "");
}

function toIcsTimestamp(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function createCalendarInvite({ intent, calendar, slot, now = new Date() }) {
  if (!slot?.start || !slot?.end) {
    throw new Error("A confirmed slot is required to create an invite.");
  }

  const uidSeed = [calendar.owner.email, intent.title, slot.start, slot.end].join("|");
  const uid = `${createHash("sha256").update(uidSeed).digest("hex").slice(0, 24)}@duniahub.xyz`;
  const description = intent.notes || "Prepared by the Dunia Hub Booking Agent.";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dunia Hub//Booking Agent//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsTimestamp(now)}`,
    `DTSTART:${toIcsTimestamp(slot.start)}`,
    `DTEND:${toIcsTimestamp(slot.end)}`,
    `SUMMARY:${escapeText(intent.title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `ORGANIZER;CN=${escapeParameter(calendar.owner.name)}:mailto:${calendar.owner.email}`,
    ...intent.attendees.map(
      ({ name, email }) =>
        `ATTENDEE;CN=${escapeParameter(name)};RSVP=TRUE:mailto:${email}`
    ),
    ...(intent.location ? [`LOCATION:${escapeText(intent.location)}`] : []),
    "STATUS:TENTATIVE",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];

  return lines.join("\r\n");
}

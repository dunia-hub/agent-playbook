function formatTimestamp(timestamp, timeZone) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(timestamp));
}

export function formatPreview({ intent, calendar, slots }) {
  const attendeeText = intent.attendees.length
    ? intent.attendees.map(({ name, email }) => `${name} <${email}>`).join(", ")
    : "None supplied";

  const slotLines = slots.length
    ? slots.map(
        (slot, index) =>
          `${index + 1}. ${formatTimestamp(slot.start, intent.timeZone)} – ${formatTimestamp(
            slot.end,
            intent.timeZone
          )}`
      )
    : ["No conflict-free slots were found in the requested window."];

  return [
    "# Booking Preview",
    "",
    "Status: Awaiting confirmation",
    `Title: ${intent.title}`,
    `Organizer: ${calendar.owner.name} <${calendar.owner.email}>`,
    `Attendees: ${attendeeText}`,
    `Duration: ${intent.durationMinutes} minutes`,
    `Time zone: ${intent.timeZone}`,
    `Location: ${intent.location || "Not specified"}`,
    "",
    "## Available Slots",
    "",
    ...slotLines,
    "",
    "## Safety Checks",
    "",
    "- Availability window checked",
    "- Existing busy periods checked",
    `- Minimum notice checked (${calendar.minimumNoticeMinutes} minutes)`,
    "- No calendar event or invitation has been created",
    "",
    "## Next Action",
    "",
    slots.length
      ? "Review the details, then rerun with --confirm SLOT_NUMBER to prepare an ICS file."
      : "Adjust the requested window or calendar availability and try again.",
  ].join("\n");
}

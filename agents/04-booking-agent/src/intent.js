const INTENT_KEYS = [
  "title",
  "durationMinutes",
  "windowStart",
  "windowEnd",
  "timeZone",
  "attendees",
  "location",
  "notes",
];

function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

function parseTimestamp(value, field) {
  if (typeof value !== "string" || !/(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    throw new Error(`${field} must be an ISO 8601 timestamp with a UTC offset.`);
  }
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`${field} is not a valid timestamp.`);
  }
  return timestamp;
}

export function parseModelJson(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("The model response is empty.");
  }

  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch {
    throw new Error("The model response is not valid JSON.");
  }
}

export function validateBookingIntent(intent) {
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    throw new Error("Booking intent must be a JSON object.");
  }

  const extraKeys = Object.keys(intent).filter((key) => !INTENT_KEYS.includes(key));
  const missingKeys = INTENT_KEYS.filter((key) => !(key in intent));
  if (missingKeys.length) {
    throw new Error(`Booking intent is missing: ${missingKeys.join(", ")}.`);
  }
  if (extraKeys.length) {
    throw new Error(`Booking intent has unsupported keys: ${extraKeys.join(", ")}.`);
  }

  if (typeof intent.title !== "string" || !intent.title.trim()) {
    throw new Error("title must be a non-empty string.");
  }
  if (
    !Number.isInteger(intent.durationMinutes) ||
    intent.durationMinutes < 15 ||
    intent.durationMinutes > 480
  ) {
    throw new Error("durationMinutes must be an integer from 15 to 480.");
  }
  if (typeof intent.timeZone !== "string" || !isValidTimeZone(intent.timeZone)) {
    throw new Error("timeZone must be a valid IANA time-zone name.");
  }

  const windowStart = parseTimestamp(intent.windowStart, "windowStart");
  const windowEnd = parseTimestamp(intent.windowEnd, "windowEnd");
  if (windowStart >= windowEnd) {
    throw new Error("windowStart must be earlier than windowEnd.");
  }
  if (windowEnd - windowStart < intent.durationMinutes * 60_000) {
    throw new Error("The requested window is shorter than the meeting duration.");
  }

  if (!Array.isArray(intent.attendees)) {
    throw new Error("attendees must be an array.");
  }
  for (const attendee of intent.attendees) {
    if (!attendee || typeof attendee !== "object") {
      throw new Error("Every attendee must be an object.");
    }
    if (typeof attendee.name !== "string" || !attendee.name.trim()) {
      throw new Error("Every attendee must have a name.");
    }
    if (
      typeof attendee.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendee.email)
    ) {
      throw new Error("Every attendee must have a valid email address.");
    }
  }

  for (const field of ["location", "notes"]) {
    if (intent[field] !== null && typeof intent[field] !== "string") {
      throw new Error(`${field} must be a string or null.`);
    }
  }

  return {
    ...intent,
    title: intent.title.trim(),
    attendees: intent.attendees.map((attendee) => ({
      name: attendee.name.trim(),
      email: attendee.email.trim().toLowerCase(),
    })),
    location: intent.location?.trim() || null,
    notes: intent.notes?.trim() || null,
  };
}

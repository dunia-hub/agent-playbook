function parseTimestamp(value, label) {
  const timestamp = new Date(value);
  if (typeof value !== "string" || Number.isNaN(timestamp.getTime())) {
    throw new Error(`${label} must be a valid ISO 8601 timestamp.`);
  }
  return timestamp;
}

function validateRange(range, label) {
  if (!range || typeof range !== "object") {
    throw new Error(`${label} must be an object.`);
  }
  const start = parseTimestamp(range.start, `${label}.start`);
  const end = parseTimestamp(range.end, `${label}.end`);
  if (start >= end) {
    throw new Error(`${label}.start must be earlier than ${label}.end.`);
  }
  return { ...range, start: start.toISOString(), end: end.toISOString() };
}

export function validateCalendar(calendar) {
  if (!calendar || typeof calendar !== "object" || Array.isArray(calendar)) {
    throw new Error("Calendar data must be a JSON object.");
  }
  if (!calendar.owner || typeof calendar.owner !== "object") {
    throw new Error("Calendar owner is required.");
  }
  if (typeof calendar.owner.name !== "string" || !calendar.owner.name.trim()) {
    throw new Error("Calendar owner name is required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(calendar.owner.email || "")) {
    throw new Error("Calendar owner email must be valid.");
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: calendar.owner.timeZone }).format();
  } catch {
    throw new Error("Calendar owner timeZone must be a valid IANA time zone.");
  }

  const slotStepMinutes = calendar.slotStepMinutes ?? 15;
  const minimumNoticeMinutes = calendar.minimumNoticeMinutes ?? 0;
  if (!Number.isInteger(slotStepMinutes) || slotStepMinutes < 5 || slotStepMinutes > 120) {
    throw new Error("slotStepMinutes must be an integer from 5 to 120.");
  }
  if (
    !Number.isInteger(minimumNoticeMinutes) ||
    minimumNoticeMinutes < 0 ||
    minimumNoticeMinutes > 43_200
  ) {
    throw new Error("minimumNoticeMinutes must be an integer from 0 to 43200.");
  }
  if (!Array.isArray(calendar.availability) || calendar.availability.length === 0) {
    throw new Error("Calendar availability must contain at least one range.");
  }
  if (!Array.isArray(calendar.busy)) {
    throw new Error("Calendar busy must be an array.");
  }

  return {
    owner: {
      name: calendar.owner.name.trim(),
      email: calendar.owner.email.trim().toLowerCase(),
      timeZone: calendar.owner.timeZone,
    },
    slotStepMinutes,
    minimumNoticeMinutes,
    availability: calendar.availability.map((range, index) =>
      validateRange(range, `availability[${index}]`)
    ),
    busy: calendar.busy.map((range, index) =>
      validateRange(range, `busy[${index}]`)
    ),
  };
}

export function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function findAvailableSlots({ intent, calendar, now = new Date(), limit = 3 }) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new Error("Slot limit must be an integer from 1 to 20.");
  }

  const durationMs = intent.durationMinutes * 60_000;
  const stepMs = calendar.slotStepMinutes * 60_000;
  const earliestAllowed = now.getTime() + calendar.minimumNoticeMinutes * 60_000;
  const requestedStart = new Date(intent.windowStart).getTime();
  const requestedEnd = new Date(intent.windowEnd).getTime();
  const slots = [];

  for (const available of calendar.availability) {
    const availableStart = new Date(available.start).getTime();
    const availableEnd = new Date(available.end).getTime();
    const searchStart = Math.max(availableStart, requestedStart, earliestAllowed);
    const remainder = Math.max(0, searchStart - requestedStart) % stepMs;
    let candidateStart = remainder === 0 ? searchStart : searchStart + stepMs - remainder;
    const searchEnd = Math.min(availableEnd, requestedEnd);

    while (candidateStart + durationMs <= searchEnd) {
      const candidateEnd = candidateStart + durationMs;
      const conflict = calendar.busy.some((event) =>
        rangesOverlap(
          candidateStart,
          candidateEnd,
          new Date(event.start).getTime(),
          new Date(event.end).getTime()
        )
      );

      if (!conflict) {
        slots.push({
          start: new Date(candidateStart).toISOString(),
          end: new Date(candidateEnd).toISOString(),
        });
        if (slots.length === limit) return slots;
      }
      candidateStart += stepMs;
    }
  }

  return slots;
}

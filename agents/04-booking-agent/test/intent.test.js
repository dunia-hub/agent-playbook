import test from "node:test";
import assert from "node:assert/strict";
import { parseModelJson, validateBookingIntent } from "../src/intent.js";

const validIntent = {
  title: "Planning call",
  durationMinutes: 30,
  windowStart: "2026-09-16T13:00:00+03:00",
  windowEnd: "2026-09-16T17:00:00+03:00",
  timeZone: "Africa/Nairobi",
  attendees: [{ name: " Amina ", email: "AMINA@example.com" }],
  location: null,
  notes: " Discuss launch. ",
};

test("intent: parses plain JSON", () => {
  assert.deepEqual(parseModelJson('{"title":"Call"}'), { title: "Call" });
});

test("intent: recovers JSON from a code fence", () => {
  assert.deepEqual(parseModelJson('```json\n{"title":"Call"}\n```'), {
    title: "Call",
  });
});

test("intent: rejects prose around JSON", () => {
  assert.throws(
    () => parseModelJson('Here you go: {"title":"Call"}'),
    /not valid JSON/
  );
});

test("intent: validates and normalizes a complete intent", () => {
  const result = validateBookingIntent(validIntent);
  assert.equal(result.attendees[0].name, "Amina");
  assert.equal(result.attendees[0].email, "amina@example.com");
  assert.equal(result.notes, "Discuss launch.");
});

test("intent: rejects missing and unsupported keys", () => {
  const { notes, ...missing } = validIntent;
  assert.throws(() => validateBookingIntent(missing), /missing: notes/);
  assert.throws(
    () => validateBookingIntent({ ...validIntent, booked: true }),
    /unsupported keys: booked/
  );
});

test("intent: rejects unsafe meeting durations", () => {
  assert.throws(
    () => validateBookingIntent({ ...validIntent, durationMinutes: 10 }),
    /15 to 480/
  );
  assert.throws(
    () => validateBookingIntent({ ...validIntent, durationMinutes: 481 }),
    /15 to 480/
  );
});

test("intent: requires timestamps with explicit offsets", () => {
  assert.throws(
    () =>
      validateBookingIntent({
        ...validIntent,
        windowStart: "2026-09-16T13:00:00",
      }),
    /UTC offset/
  );
});

test("intent: rejects reversed or undersized windows", () => {
  assert.throws(
    () =>
      validateBookingIntent({
        ...validIntent,
        windowStart: "2026-09-16T17:00:00+03:00",
      }),
    /earlier/
  );
  assert.throws(
    () =>
      validateBookingIntent({
        ...validIntent,
        durationMinutes: 90,
        windowEnd: "2026-09-16T14:00:00+03:00",
      }),
    /shorter/
  );
});

test("intent: validates time zones and attendee emails", () => {
  assert.throws(
    () => validateBookingIntent({ ...validIntent, timeZone: "Nairobi" }),
    /IANA/
  );
  assert.throws(
    () =>
      validateBookingIntent({
        ...validIntent,
        attendees: [{ name: "Amina", email: "not-an-email" }],
      }),
    /valid email/
  );
});

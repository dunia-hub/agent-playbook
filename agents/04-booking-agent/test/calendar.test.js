import test from "node:test";
import assert from "node:assert/strict";
import {
  findAvailableSlots,
  rangesOverlap,
  validateCalendar,
} from "../src/calendar.js";

const intent = {
  title: "Planning call",
  durationMinutes: 30,
  windowStart: "2026-09-16T10:00:00.000Z",
  windowEnd: "2026-09-16T13:00:00.000Z",
  timeZone: "Africa/Nairobi",
  attendees: [],
  location: null,
  notes: null,
};

const rawCalendar = {
  owner: {
    name: "Dunia Hub",
    email: "HELLO@duniahub.xyz",
    timeZone: "Africa/Nairobi",
  },
  slotStepMinutes: 15,
  minimumNoticeMinutes: 60,
  availability: [
    { start: "2026-09-16T10:00:00.000Z", end: "2026-09-16T13:00:00.000Z" },
  ],
  busy: [
    { start: "2026-09-16T10:30:00.000Z", end: "2026-09-16T11:00:00.000Z" },
  ],
};

test("calendar: validates and normalizes calendar data", () => {
  const calendar = validateCalendar(rawCalendar);
  assert.equal(calendar.owner.email, "hello@duniahub.xyz");
  assert.equal(calendar.availability[0].start, "2026-09-16T10:00:00.000Z");
});

test("calendar: supplies safe defaults", () => {
  const calendar = validateCalendar({
    ...rawCalendar,
    slotStepMinutes: undefined,
    minimumNoticeMinutes: undefined,
  });
  assert.equal(calendar.slotStepMinutes, 15);
  assert.equal(calendar.minimumNoticeMinutes, 0);
});

test("calendar: rejects missing availability", () => {
  assert.throws(
    () => validateCalendar({ ...rawCalendar, availability: [] }),
    /at least one range/
  );
});

test("calendar: rejects invalid ranges", () => {
  assert.throws(
    () =>
      validateCalendar({
        ...rawCalendar,
        busy: [{ start: "2026-09-16T12:00:00Z", end: "2026-09-16T11:00:00Z" }],
      }),
    /earlier/
  );
});

test("overlap: treats touching boundaries as conflict-free", () => {
  const ten = Date.parse("2026-09-16T10:00:00Z");
  const eleven = Date.parse("2026-09-16T11:00:00Z");
  const noon = Date.parse("2026-09-16T12:00:00Z");
  assert.equal(rangesOverlap(ten, eleven, eleven, noon), false);
  assert.equal(rangesOverlap(ten, noon, eleven, noon), true);
});

test("slots: skips conflicts and returns the requested limit", () => {
  const calendar = validateCalendar(rawCalendar);
  const slots = findAvailableSlots({
    intent,
    calendar,
    now: new Date("2026-09-10T00:00:00Z"),
    limit: 3,
  });
  assert.deepEqual(slots, [
    { start: "2026-09-16T10:00:00.000Z", end: "2026-09-16T10:30:00.000Z" },
    { start: "2026-09-16T11:00:00.000Z", end: "2026-09-16T11:30:00.000Z" },
    { start: "2026-09-16T11:15:00.000Z", end: "2026-09-16T11:45:00.000Z" },
  ]);
});

test("slots: honors minimum notice", () => {
  const calendar = validateCalendar(rawCalendar);
  const slots = findAvailableSlots({
    intent,
    calendar,
    now: new Date("2026-09-16T10:00:00Z"),
    limit: 1,
  });
  assert.equal(slots[0].start, "2026-09-16T11:00:00.000Z");
});

test("slots: returns an empty list when duration cannot fit", () => {
  const calendar = validateCalendar(rawCalendar);
  const slots = findAvailableSlots({
    intent: { ...intent, durationMinutes: 240 },
    calendar,
    now: new Date("2026-09-10T00:00:00Z"),
  });
  assert.deepEqual(slots, []);
});

test("slots: aligns candidates to the requested-window step", () => {
  const calendar = validateCalendar({
    ...rawCalendar,
    availability: [
      { start: "2026-09-16T10:07:00Z", end: "2026-09-16T13:00:00Z" },
    ],
    busy: [],
  });
  const slots = findAvailableSlots({
    intent,
    calendar,
    now: new Date("2026-09-10T00:00:00Z"),
    limit: 1,
  });
  assert.equal(slots[0].start, "2026-09-16T10:15:00.000Z");
});

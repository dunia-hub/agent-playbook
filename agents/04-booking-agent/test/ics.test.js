import test from "node:test";
import assert from "node:assert/strict";
import { createCalendarInvite } from "../src/ics.js";

const calendar = {
  owner: { name: "Dunia Hub", email: "hello@duniahub.xyz" },
};
const intent = {
  title: "Planning, review; launch",
  attendees: [{ name: "Amina", email: "amina@example.com" }],
  location: "Meet, room 1",
  notes: "First line\nSecond line",
};
const slot = {
  start: "2026-09-16T10:00:00.000Z",
  end: "2026-09-16T10:45:00.000Z",
};

test("ics: creates a standards-shaped tentative invitation", () => {
  const invite = createCalendarInvite({
    intent,
    calendar,
    slot,
    now: new Date("2026-09-10T06:00:00Z"),
  });
  assert.match(invite, /BEGIN:VCALENDAR\r\nVERSION:2.0/);
  assert.match(invite, /DTSTART:20260916T100000Z/);
  assert.match(invite, /DTEND:20260916T104500Z/);
  assert.match(invite, /STATUS:TENTATIVE/);
  assert.match(invite, /ATTENDEE;CN=Amina;RSVP=TRUE:mailto:amina@example.com/);
});

test("ics: escapes text fields", () => {
  const invite = createCalendarInvite({ intent, calendar, slot });
  assert.match(invite, /SUMMARY:Planning\\, review\\; launch/);
  assert.match(invite, /DESCRIPTION:First line\\nSecond line/);
  assert.match(invite, /LOCATION:Meet\\, room 1/);
});

test("ics: creates a stable UID for the same meeting", () => {
  const first = createCalendarInvite({ intent, calendar, slot });
  const second = createCalendarInvite({ intent, calendar, slot });
  const uid = (text) => text.match(/UID:(.+)\r\n/)[1];
  assert.equal(uid(first), uid(second));
});

test("ics: requires a confirmed slot", () => {
  assert.throws(
    () => createCalendarInvite({ intent, calendar, slot: null }),
    /confirmed slot/
  );
});

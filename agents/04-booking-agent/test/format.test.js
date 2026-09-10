import test from "node:test";
import assert from "node:assert/strict";
import { formatPreview } from "../src/format.js";

test("preview: formats slots in the requester's time zone", () => {
  const preview = formatPreview({
    intent: {
      title: "Planning call",
      durationMinutes: 30,
      timeZone: "Africa/Nairobi",
      attendees: [{ name: "Amina", email: "amina@example.com" }],
      location: null,
    },
    calendar: {
      owner: { name: "Dunia Hub", email: "hello@duniahub.xyz" },
      minimumNoticeMinutes: 60,
    },
    slots: [
      {
        start: "2026-09-16T10:00:00.000Z",
        end: "2026-09-16T10:30:00.000Z",
      },
    ],
  });

  assert.match(preview, /Status: Awaiting confirmation/);
  assert.match(preview, /Wednesday, 16 September 2026 at 13:00 GMT\+3/);
  assert.match(preview, /No calendar event or invitation has been created/);
});

test("preview: explains when no slots are available", () => {
  const preview = formatPreview({
    intent: {
      title: "Planning call",
      durationMinutes: 30,
      timeZone: "Africa/Nairobi",
      attendees: [],
      location: null,
    },
    calendar: {
      owner: { name: "Dunia Hub", email: "hello@duniahub.xyz" },
      minimumNoticeMinutes: 0,
    },
    slots: [],
  });

  assert.match(preview, /No conflict-free slots/);
  assert.match(preview, /Adjust the requested window/);
});

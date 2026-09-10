# Booking Agent Prompt

The Booking Agent uses the model for one narrow task: converting a natural-language
request into a structured booking intent. Deterministic code—not the model—checks
availability, detects conflicts, proposes slots, and creates the calendar file.

## Required JSON

The model must return exactly these fields:

1. `title`
2. `durationMinutes`
3. `windowStart`
4. `windowEnd`
5. `timeZone`
6. `attendees`
7. `location`
8. `notes`

Timestamps must include numeric UTC offsets. The time zone must be an IANA name,
such as `Africa/Nairobi`. This prevents the scheduler from silently interpreting
an ambiguous local time in the wrong zone.

## Separation of responsibilities

The model may:

- Resolve relative dates using the supplied current timestamp
- Extract duration, attendees, location, and meeting context
- Use the calendar owner's time zone when the requester supplies none

The model may not:

- Claim that a meeting was booked
- Select a final time
- Invent attendee email addresses
- Read or override busy periods
- Generate the calendar invitation

## Confirmation boundary

Preview mode is the default. It prints candidate slots but writes nothing. The user
must provide `--confirm SLOT_NUMBER` before the agent creates an ICS file. Even then,
the file remains local: it is not emailed and is not inserted into a calendar.

The exact runtime prompt is stored in `src/prompt.js` as the single source of truth.

## Ideas to extend

- Add Google Calendar or CalDAV adapters behind the same confirmation boundary
- Recheck availability immediately before an external calendar write
- Add multiple participants' free/busy windows
- Add configurable buffers before and after meetings
- Produce a signed audit log for booking decisions

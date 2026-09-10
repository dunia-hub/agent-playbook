# Booking Agent

Dunia Hub Agent Playbook 04.

This Node.js agent turns a natural-language meeting request into safe booking
options. It extracts the request, validates every field, checks a local calendar for
availability and conflicts, and proposes up to three slots. It only prepares an
importable ICS calendar file after explicit confirmation.

## What the agent does

- Converts a natural-language request into structured booking data with Groq
- Supports a fully offline, no-API mode with a prepared JSON intent
- Handles ISO timestamps and IANA time zones
- Applies working availability, busy periods, meeting duration, slot intervals, and
  minimum-notice rules
- Shows a booking preview before taking action
- Requires `--confirm SLOT_NUMBER` before writing an ICS file
- Creates a tentative calendar invitation that can be reviewed and imported

It does **not** email attendees, write to Google Calendar, or claim that a meeting is
booked.

## Stack

- Node.js 20 or newer with ES modules
- [groq-sdk](https://www.npmjs.com/package/groq-sdk) for intent extraction
- [dotenv](https://www.npmjs.com/package/dotenv) for local configuration
- Node's built-in `Intl`, `crypto`, file-system, and test APIs
- Node's built-in test runner (`node --test`), with no live API calls in tests

No agent framework, database, paid API, frontend, or external calendar account is
required.

## Setup

Install dependencies:

```bash
npm install
```

For natural-language mode, create `.env` and add a free Groq developer key:

```bash
cp .env.example .env
```

```env
GROQ_API_KEY=your_real_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

Never commit `.env` or share the API key.

## Try it without an API key

The repository includes a validated intent and a sample calendar. Preview the
available slots entirely offline:

```bash
npm start -- \
  --intent examples/parsed-intent.json \
  --calendar examples/calendar.json
```

The result remains in **Awaiting confirmation** status. Nothing is written or sent.

## Use natural language

```bash
npm start -- \
  --request examples/booking-request.txt \
  --calendar examples/calendar.json
```

The model only extracts intent. The local scheduling engine performs all conflict and
availability checks.

## Confirm a slot

After reviewing the preview, confirm one of the numbered slots:

```bash
npm start -- \
  --intent examples/parsed-intent.json \
  --calendar examples/calendar.json \
  --confirm 1 \
  --output output/booking.ics
```

This prepares a tentative ICS file. It still does not send an email or add an event
to an external calendar.

## Calendar input

`examples/calendar.json` demonstrates the expected format:

```json
{
  "owner": {
    "name": "Dunia Hub",
    "email": "hello@duniahub.xyz",
    "timeZone": "Africa/Nairobi"
  },
  "slotStepMinutes": 15,
  "minimumNoticeMinutes": 60,
  "availability": [
    {
      "start": "2026-09-16T09:00:00+03:00",
      "end": "2026-09-16T17:00:00+03:00"
    }
  ],
  "busy": []
}
```

All availability and busy timestamps should be ISO 8601 values with an explicit
offset or `Z`.

## Run tests

```bash
npm test
```

The offline suite covers command parsing, model-response validation, time zones,
calendar validation, overlap boundaries, minimum notice, slot selection, mocked
Groq calls, ICS formatting, escaping, and stable event IDs.

## Project structure

```text
04-booking-agent/
├── examples/
│   ├── booking-request.txt
│   ├── calendar.json
│   └── parsed-intent.json
├── src/
│   ├── arguments.js
│   ├── calendar.js
│   ├── files.js
│   ├── format.js
│   ├── groq.js
│   ├── ics.js
│   ├── index.js
│   ├── intent.js
│   └── prompt.js
├── test/
│   ├── arguments.test.js
│   ├── calendar.test.js
│   ├── format.test.js
│   ├── groq.test.js
│   ├── ics.test.js
│   └── intent.test.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── prompts.md
├── README.md
└── resources.md
```

## Safety boundaries

- Model output is untrusted and must pass strict validation.
- The scheduling engine—not the model—checks availability and conflicts.
- Preview mode cannot create a calendar file.
- Confirmation selects only a slot returned by the current availability check.
- The generated event is tentative and remains local until the user imports it.
- Calendar availability can change; recheck it before any future external write.

## Limitations

This workshop version reads local JSON rather than live free/busy data. It checks the
calendar owner's supplied availability and busy periods, but it cannot verify an
attendee's calendar. Natural-language date extraction depends on the selected model;
always review the normalized preview before confirmation.

export function parseArguments(args) {
  const options = {
    requestPath: null,
    intentPath: null,
    calendarPath: null,
    confirm: null,
    outputPath: "output/booking.ics",
    help: false,
  };

  const valueFlags = new Map([
    ["--request", "requestPath"],
    ["--intent", "intentPath"],
    ["--calendar", "calendarPath"],
    ["--confirm", "confirm"],
    ["--output", "outputPath"],
  ]);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }

    const key = valueFlags.get(argument);
    if (!key) {
      throw new Error(`Unknown argument: ${argument}`);
    }

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} requires a value.`);
    }

    options[key] = value;
    index += 1;
  }

  if (options.confirm !== null) {
    const selection = Number(options.confirm);
    if (!Number.isInteger(selection) || selection < 1) {
      throw new Error("--confirm must be a positive slot number.");
    }
    options.confirm = selection;
  }

  if (!options.help) {
    if (!options.calendarPath) {
      throw new Error("--calendar is required.");
    }
    if (Boolean(options.requestPath) === Boolean(options.intentPath)) {
      throw new Error("Provide exactly one of --request or --intent.");
    }
  }

  return options;
}

export const HELP_TEXT = `Booking Agent

Preview slots with a natural-language request:
  npm start -- --request examples/booking-request.txt --calendar examples/calendar.json

Preview slots without an API call:
  npm start -- --intent examples/parsed-intent.json --calendar examples/calendar.json

Confirm one previewed slot and prepare an ICS file:
  npm start -- --intent examples/parsed-intent.json --calendar examples/calendar.json --confirm 1 --output output/booking.ics`;

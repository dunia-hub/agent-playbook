import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArguments, HELP_TEXT } from "./arguments.js";
import { readJsonFile, readTextFile } from "./files.js";
import { extractBookingIntent } from "./groq.js";
import { parseModelJson, validateBookingIntent } from "./intent.js";
import { findAvailableSlots, validateCalendar } from "./calendar.js";
import { formatPreview } from "./format.js";
import { createCalendarInvite } from "./ics.js";

// Load local configuration without letting dotenv interpret this agent's CLI flags.
config({ quiet: true });

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  const calendar = validateCalendar(await readJsonFile(options.calendarPath));
  let rawIntent;

  if (options.intentPath) {
    rawIntent = await readJsonFile(options.intentPath);
  } else {
    const request = await readTextFile(options.requestPath);
    const modelResponse = await extractBookingIntent({
      request,
      ownerTimeZone: calendar.owner.timeZone,
    });
    rawIntent = parseModelJson(modelResponse);
  }

  const intent = validateBookingIntent(rawIntent);
  const slots = findAvailableSlots({ intent, calendar });

  console.log(formatPreview({ intent, calendar, slots }));

  if (options.confirm === null) return;
  if (options.confirm > slots.length) {
    throw new Error(
      `Cannot confirm slot ${options.confirm}. Only ${slots.length} slot(s) are available.`
    );
  }

  const selectedSlot = slots[options.confirm - 1];
  const invite = createCalendarInvite({ intent, calendar, slot: selectedSlot });
  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, invite, "utf8");
  console.log(`\nICS file prepared: ${options.outputPath}`);
  console.log("The invitation has not been emailed or added to any calendar.");
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});

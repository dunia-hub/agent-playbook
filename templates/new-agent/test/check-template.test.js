import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { findMarkers } from "../src/check-template.js";

test("template check: finds customization markers", async () => {
  const directory = await mkdtemp(join(tmpdir(), "agent-template-"));
  await writeFile(join(directory, "ready.txt"), "Complete");
  assert.deepEqual(await findMarkers(directory), []);
  await writeFile(join(directory, "agent.txt"), `${["CUSTOM", "IZE"].join("")} this agent`);
  assert.deepEqual(await findMarkers(directory), ["agent.txt"]);
});

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { inspectAgent } from "../src/inspect.js";

const sample = fileURLToPath(new URL("../examples/sample-agent", import.meta.url));

test("inspection: reads the sample without executing it", async () => {
  const agent = await inspectAgent(sample);
  assert.equal(agent.slug, "sample-agent");
  assert.equal(agent.packageData.type, "module");
  assert.match(agent.readme, /# Sample Agent/);
  assert.equal(await agent.hasDirectory("src"), true);
});

test("inspection: ignores dependency and output directories", async () => {
  const directory = await mkdtemp(join(tmpdir(), "community-agent-"));
  await mkdir(join(directory, "node_modules"));
  await mkdir(join(directory, "output"));
  await writeFile(
    join(directory, "node_modules", "secret.js"),
    ["gsk", "_", "fake_but_long_enough_to_match_123456789"].join("")
  );
  await writeFile(join(directory, "output", "result.json"), "{}");
  const agent = await inspectAgent(directory);
  assert.deepEqual(agent.files, []);
});

test("inspection: reports a missing directory", async () => {
  await assert.rejects(() => inspectAgent(join(tmpdir(), "missing-community-agent-fixture")), /not found/);
});

test("inspection: reports invalid package JSON", async () => {
  const directory = await mkdtemp(join(tmpdir(), "community-agent-"));
  await writeFile(join(directory, "package.json"), "{");
  assert.equal((await inspectAgent(directory)).packageError, "package.json is invalid JSON.");
});

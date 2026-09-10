import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { inspectAgent } from "../src/inspect.js";
import { evaluateAgent } from "../src/rules.js";

const sample = fileURLToPath(new URL("../examples/sample-agent", import.meta.url));

async function copySample(name = "sample-agent") {
  const root = await mkdtemp(join(tmpdir(), "community-validator-"));
  const directory = join(root, name);
  await cp(sample, directory, { recursive: true });
  return directory;
}

function check(results, id) {
  return results.find((result) => result.id === id);
}

test("rules: accepts the complete sample fixture", async () => {
  const results = await evaluateAgent(await inspectAgent(sample));
  assert.equal(results.length, 11);
  assert.equal(results.every((result) => result.passed), true);
});

test("rules: rejects an invalid folder name", async () => {
  const results = await evaluateAgent(await inspectAgent(await copySample("Bad Agent")));
  assert.equal(check(results, "slug").passed, false);
});

test("rules: detects template markers", async () => {
  const directory = await copySample();
  await writeFile(join(directory, "src", "marker.js"), `// ${["CUSTOM", "IZE"].join("")} this`);
  const results = await evaluateAgent(await inspectAgent(directory));
  assert.equal(check(results, "markers").passed, false);
  assert.match(check(results, "markers").detail, /marker\.js/);
});

test("rules: detects committed environment files", async () => {
  const directory = await copySample();
  await writeFile(join(directory, ".env"), "KEY=value");
  const results = await evaluateAgent(await inspectAgent(directory));
  assert.equal(check(results, "env").passed, false);
});

test("rules: detects common secret patterns", async () => {
  const directory = await copySample();
  const fakeKey = ["gsk", "_", "abcdefghijklmnopqrstuvwxyz123456"].join("");
  await writeFile(join(directory, "src", "bad.js"), `const key = '${fakeKey}';`);
  const results = await evaluateAgent(await inspectAgent(directory));
  assert.equal(check(results, "secrets").passed, false);
  assert.match(check(results, "secrets").detail, /Groq-style/);
});

test("rules: rejects incomplete project configuration", async () => {
  const directory = await copySample();
  await writeFile(join(directory, "package.json"), JSON.stringify({ name: "incomplete" }));
  const results = await evaluateAgent(await inspectAgent(directory));
  assert.equal(check(results, "package").passed, false);
});

test("rules: requires sensitive and generated files to be ignored", async () => {
  const directory = await copySample();
  await writeFile(join(directory, ".gitignore"), "node_modules/\n");
  const results = await evaluateAgent(await inspectAgent(directory));
  assert.equal(check(results, "ignores").passed, false);
  assert.match(check(results, "ignores").detail, /\.env, output\//);
});

test("rules: requires documentation sections and disclosures", async () => {
  const directory = await copySample();
  await writeFile(join(directory, "README.md"), "# Small Agent\n\nNo details yet.");
  const results = await evaluateAgent(await inspectAgent(directory));
  assert.equal(check(results, "readme").passed, false);
  assert.equal(check(results, "free-path").passed, false);
  assert.equal(check(results, "services").passed, false);
});

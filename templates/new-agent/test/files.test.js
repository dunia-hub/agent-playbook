import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readText } from "../src/files.js";

test("files: reads and trims text", async () => {
  const directory = await mkdtemp(join(tmpdir(), "agent-template-"));
  const path = join(directory, "input.txt");
  await writeFile(path, "  hello  \n");
  assert.equal(await readText(path), "hello");
});

test("files: explains missing and empty inputs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "agent-template-"));
  await assert.rejects(() => readText(join(directory, "missing.txt"), "Input"), /Input not found/);
  const empty = join(directory, "empty.txt");
  await writeFile(empty, "  ");
  await assert.rejects(() => readText(empty, "Input"), /Input is empty/);
});

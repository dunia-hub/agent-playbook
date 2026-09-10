import { readFile } from "node:fs/promises";

export async function readTextFile(filePath) {
  let text;
  try {
    text = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Could not read ${filePath}: ${error.message}`);
  }

  if (!text.trim()) {
    throw new Error(`${filePath} is empty.`);
  }

  return text;
}

export async function readJsonFile(filePath) {
  const text = await readTextFile(filePath);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${filePath} does not contain valid JSON.`);
  }
}

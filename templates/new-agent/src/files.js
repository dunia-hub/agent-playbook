import { readFile } from "node:fs/promises";

export async function readText(path, label = "File") {
  try {
    const value = await readFile(path, "utf8");
    if (value.trim() === "") throw new Error(`${label} is empty.`);
    return value.trim();
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`${label} not found: ${path}`);
    throw error;
  }
}

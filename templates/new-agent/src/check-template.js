import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    if (["node_modules", ".git"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await collect(path));
    else paths.push(path);
  }
  return paths;
}

export async function findMarkers(directory = process.cwd()) {
  const marker = ["CUSTOM", "IZE"].join("");
  const results = [];
  for (const path of await collect(directory)) {
    const content = await readFile(path, "utf8");
    if (content.includes(marker)) results.push(path.slice(directory.length + 1));
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const markers = await findMarkers();
  if (markers.length) {
    console.error(`Customization markers remain:\n${markers.map((path) => `- ${path}`).join("\n")}`);
    process.exitCode = 1;
  } else console.log("No customization markers remain.");
}

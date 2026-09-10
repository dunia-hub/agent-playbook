import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join, relative } from "node:path";

const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "output", "coverage"]);
const TEXT_EXTENSIONS = /(?:\.env(?:\.example)?|\.gitignore|\.(?:cjs|js|json|jsx|md|mjs|sol|ts|tsx|txt|yaml|yml))$/i;

async function exists(path, type) {
  try {
    const entry = await stat(path);
    return type === "directory" ? entry.isDirectory() : entry.isFile();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function collectFiles(root, directory = root) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(root, path));
    else files.push({ path, relativePath: relative(root, path) });
  }
  return files;
}

export async function inspectAgent(directory) {
  if (!await exists(directory, "directory")) {
    throw new Error(`Agent directory not found: ${directory}`);
  }
  const files = await collectFiles(directory);
  const textFiles = [];
  for (const file of files.filter((item) => TEXT_EXTENSIONS.test(item.relativePath))) {
    textFiles.push({ ...file, content: await readFile(file.path, "utf8") });
  }

  let packageData = null;
  let packageError = null;
  try {
    packageData = JSON.parse(await readFile(join(directory, "package.json"), "utf8"));
  } catch (error) {
    packageError = error instanceof SyntaxError ? "package.json is invalid JSON." : "package.json is missing.";
  }

  const readmeFile = textFiles.find((file) => file.relativePath === "README.md");
  const gitignoreFile = textFiles.find((file) => file.relativePath === ".gitignore");
  return {
    directory,
    slug: basename(directory),
    files,
    textFiles,
    packageData,
    packageError,
    readme: readmeFile?.content ?? "",
    gitignore: gitignoreFile?.content ?? "",
    hasFile: (path) => files.some((file) => file.relativePath === path),
    hasDirectory: (path) => exists(join(directory, path), "directory"),
  };
}

const REQUIRED_HEADINGS = [
  "How it works",
  "Requirements",
  "Run locally",
  "Safety and permissions",
  "Limitations",
  "Tests",
];

const SECRET_PATTERNS = [
  { label: "private-key block", pattern: /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/ },
  { label: "Groq-style API key", pattern: /\bgsk_[A-Za-z0-9_-]{20,}\b/ },
  { label: "OpenAI-style API key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { label: "GitHub-style token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
];

function result(id, label, passed, detail) {
  return { id, label, passed, detail };
}

export async function evaluateAgent(agent) {
  const requiredFiles = ["README.md", "resources.md", "package.json", "package-lock.json", ".gitignore"];
  const requiredDirectories = ["src", "test", "examples"];
  const missingFiles = requiredFiles.filter((path) => !agent.hasFile(path));
  const missingDirectories = [];
  for (const path of requiredDirectories) {
    if (!await agent.hasDirectory(path)) missingDirectories.push(path);
  }

  const missingHeadings = REQUIRED_HEADINGS.filter(
    (heading) => !new RegExp(`^##\\s+${heading}\\s*$`, "im").test(agent.readme)
  );
  const nodeEngine = agent.packageData?.engines?.node;
  const declaredNodeVersion = Number(nodeEngine?.match(/\d+/)?.[0]);
  const packageReady = agent.packageData
    && agent.packageData.type === "module"
    && agent.packageData.scripts?.start?.trim()
    && agent.packageData.scripts?.test?.trim()
    && declaredNodeVersion >= 20;

  const freePathDocumented = /\b(?:free|offline|local)\b/i.test(agent.readme);
  const servicesDocumented = /external service/i.test(agent.readme)
    && /\b(?:cost|pricing|free tier|free-tier)\b/i.test(agent.readme);
  const ignoredEntries = ["node_modules/", ".env", "output/"];
  const ignoredLines = agent.gitignore.split(/\r?\n/).map((line) => line.trim());
  const missingIgnores = ignoredEntries.filter((entry) => !ignoredLines.includes(entry));

  const markerFiles = agent.textFiles
    .filter((file) => /\b(?:CUSTOMIZE|TODO|YOUR_AGENT_NAME)\b/.test(file.content))
    .map((file) => file.relativePath);
  const envFiles = agent.files
    .filter((file) => /(^|\/)\.env$/.test(file.relativePath))
    .map((file) => file.relativePath);
  const secretFindings = [];
  for (const file of agent.textFiles) {
    for (const secret of SECRET_PATTERNS) {
      if (secret.pattern.test(file.content)) secretFindings.push(`${file.relativePath}: ${secret.label}`);
    }
  }

  return [
    result("slug", "Lowercase hyphenated folder name", /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(agent.slug), agent.slug),
    result("files", "Required files", missingFiles.length === 0, missingFiles.length ? `Missing: ${missingFiles.join(", ")}` : "All required files are present."),
    result("directories", "Required directories", missingDirectories.length === 0, missingDirectories.length ? `Missing: ${missingDirectories.join(", ")}` : "src, test, and examples are present."),
    result("package", "Node.js project configuration", Boolean(packageReady), agent.packageError ?? (packageReady ? "ES modules, start/test scripts, and Node.js 20 or newer are declared." : "Declare ES modules, non-empty start/test scripts, and Node.js 20 or newer.")),
    result("readme", "Required README sections", missingHeadings.length === 0, missingHeadings.length ? `Missing headings: ${missingHeadings.join(", ")}` : "All required headings are present."),
    result("free-path", "Free or offline path documented", freePathDocumented, freePathDocumented ? "README describes a free, offline, or local path." : "README must describe a free, offline, or local path."),
    result("services", "External services and costs documented", servicesDocumented, servicesDocumented ? "README discloses external services and possible costs." : "README must disclose external services and possible costs."),
    result("ignores", "Sensitive and generated files ignored", missingIgnores.length === 0, missingIgnores.length ? `Missing .gitignore entries: ${missingIgnores.join(", ")}` : "node_modules, .env, and output are ignored."),
    result("markers", "No template markers", markerFiles.length === 0, markerFiles.length ? `Markers found in: ${markerFiles.join(", ")}` : "No template markers found."),
    result("env", "No committed .env file", envFiles.length === 0, envFiles.length ? `Remove: ${envFiles.join(", ")}` : "No .env file found."),
    result("secrets", "No common secret patterns", secretFindings.length === 0, secretFindings.length ? secretFindings.join("; ") : "No common secret patterns found."),
  ];
}

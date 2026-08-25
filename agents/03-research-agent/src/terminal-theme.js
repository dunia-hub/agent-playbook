const RESET = "\u001b[0m";
const ORANGE = "\u001b[1;38;5;208m";
const GOLD = "\u001b[38;5;214m";
const TEAL = "\u001b[38;5;37m";
const GREY = "\u001b[38;5;245m";

export function styleProgress(message, enabled = process.stderr.isTTY) {
  if (!enabled) {
    return `→ ${message}`;
  }

  return `${ORANGE}→${RESET} ${message}`;
}

export function styleTerminalReport(
  report,
  enabled = process.stdout.isTTY,
) {
  if (!enabled) {
    return report;
  }

  return report
    .split("\n")
    .map((line) => {
      if (line.startsWith("#")) {
        return `${ORANGE}${line}${RESET}`;
      }

      if (line.startsWith(">")) {
        return `${GREY}${line}${RESET}`;
      }

      return line
        .replace(
          /\[S\d+\]/g,
          (sourceId) => `${GOLD}${sourceId}${RESET}`,
        )
        .replace(
          /Confidence: (high|medium|low)/g,
          (confidence) => `${GOLD}${confidence}${RESET}`,
        )
        .replace(
          /https?:\/\/[^>]+/g,
          (url) => `${TEAL}${url}${RESET}`,
        );
    })
    .join("\n");
}

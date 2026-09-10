import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseArguments, HELP_TEXT } from "./arguments.js";
import { readJsonFile } from "./files.js";
import { extractTextMessage, isDuplicateMessage } from "./webhook.js";
import { hashSender, redactSensitiveText } from "./privacy.js";
import { validateAnalysis } from "./analysis.js";
import { analyzeMessageWithGroq } from "./groq.js";
import { retrieveArticles, validateKnowledgeBase } from "./knowledge.js";
import { assessEscalation, validatePolicy } from "./policy.js";
import { composeReply } from "./reply.js";
import { formatSupportPreview } from "./format.js";
import { createWhatsAppPayload } from "./payload.js";

config({ quiet: true });

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  const inbound = extractTextMessage(await readJsonFile(options.webhookPath));
  const senderHash = hashSender(inbound.from);
  const processedData = options.processedPath
    ? await readJsonFile(options.processedPath)
    : null;

  if (isDuplicateMessage(inbound.messageId, processedData)) {
    console.log(formatSupportPreview({ inbound, senderHash, duplicate: true }));
    return;
  }

  const policy = validatePolicy(await readJsonFile(options.policyPath));
  const { articles } = validateKnowledgeBase(
    await readJsonFile(options.knowledgePath)
  );
  const privacy = redactSensitiveText(inbound.text);
  const analysis = options.analysisPath
    ? validateAnalysis(await readJsonFile(options.analysisPath))
    : await analyzeMessageWithGroq({
        redactedText: privacy.redactedText,
        supportedLanguages: policy.supportedLanguages,
      });
  const matches = retrieveArticles({
    articles,
    language: analysis.language,
    text: privacy.redactedText,
    searchTerms: analysis.searchTerms,
  });
  const escalation = assessEscalation({
    analysis,
    redactedText: privacy.redactedText,
    detectedTypes: privacy.detectedTypes,
    matches,
    policy,
  });
  const reply = composeReply({ analysis, matches, escalation, policy });

  console.log(
    formatSupportPreview({
      inbound,
      senderHash,
      privacy,
      analysis,
      matches,
      escalation,
      reply,
    })
  );

  if (!options.approve) return;
  if (escalation.needsHuman) {
    throw new Error("Cannot approve an automated reply while human review is required.");
  }

  const payload = createWhatsAppPayload({ inbound, reply });
  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`\nWhatsApp payload prepared: ${options.outputPath}`);
  console.log("The payload has not been sent to WhatsApp.");
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});

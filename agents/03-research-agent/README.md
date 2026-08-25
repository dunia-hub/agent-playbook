# Research Agent

The Research Agent is Workshop 03 in the Dunia Hub Agent Playbook series.

It turns a research question into a source-grounded Markdown report with cited findings, source-quality notes, conflicts, uncertainty, and evidence gaps.

## What It Does

The agent:

1. Breaks a broad question into focused research tasks.
2. Generates targeted search queries.
3. Searches the public web without a paid search API.
4. Opens and extracts readable text from multiple sources.
5. Assesses relevance, quality, limitations, and conflicting claims.
6. Uses Groq strict JSON Schema output so evidence analysis cannot return malformed JSON.
7. Discards findings whose supporting excerpt cannot be verified in the retrieved source.
8. Verifies which planned research tasks the surviving findings answer.
9. Labels the report partial and shows unsupported tasks instead of crashing or pretending the answer is complete.
10. Builds the final cited report deterministically, grouped by research task.

The final report is assembled in code rather than by a third model call. This keeps citations attached to their validated source IDs and stays within Groq's free-tier token limits more reliably.

## Requirements

- Node.js 20.18.1 or newer.
- A free Groq API key.

## Setup

```bash
npm install
cp .env.example .env
```

Add your values to `.env`:

```text
GROQ_API_KEY=your_real_key
GROQ_MODEL=openai/gpt-oss-20b
```

Never commit `.env`.

## Run Locally

Pass the question as an argument:

```bash
npm start -- "What is the difference between AI agents and traditional chatbots?"
```

Or start the agent and enter the question when prompted:

```bash
npm start
```

## Report Sections

- Research Question.
- Answer.
- Key Findings.
- Conflicts and Uncertainty.
- Evidence Gaps.
- Source Assessment.
- Sources.

## Testing

```bash
npm test
```

Tests use fake Groq, search, and page-reader implementations. They do not make live API or web requests.

## Important Limitations

- DuckDuckGo's HTML results are not a guaranteed public API and may change.
- Some websites block automated reading or return content that cannot be extracted.
- Source-quality labels are judgments based on the retrieved material, not proof that a source is correct.
- A citation shows which retrieved source supports a finding; it does not guarantee the underlying source is accurate.
- Numeric claims supported by only one retrieved source cannot receive high confidence.
- A partial report is an honest result: supported findings remain usable while missing task coverage is shown explicitly.
- Important findings should always be checked in the original sources before use.

## Contributing

Suggestions, fixes, tests, and alternative free search approaches are welcome.

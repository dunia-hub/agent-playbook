# Research Agent Prompts

The runtime uses two Groq calls.

## Planning Stage

`src/planner.js` asks the model to return the original question, two to five focused tasks, targeted search queries, and verification needs. The planner must not answer the question or invent findings.

## Evidence Stage

`src/evidence-prompt.js` supplies up to four retrieved sources, with each page limited to 1,800 characters. It requests quality and relevance assessments, source-supported findings, their exact research-task IDs, short copied excerpts, conflicts, and evidence gaps.

The evidence request uses Groq strict JSON Schema mode on `openai/gpt-oss-20b`, constraining generation to the exact evidence-analysis structure before the runtime validator checks grounding.

The validator removes individual findings when their excerpt is over 20 words or cannot be matched to the retrieved title, description, or page content. It rejects task IDs that were not connected to the source during collection. After validation, the agent records which planned tasks have supported findings.

## Final Report

The final answer is not generated through another model call. `src/deterministic-synthesis.js` balances validated claims across research tasks and assembles evidence IDs, source IDs, confidence levels, conflicts, and gaps. Single-source numeric claims are capped at medium confidence. `src/report-renderer.js` groups the answer by research task, labels the report complete or partial, shows unsupported tasks explicitly, and adds the verified source links.

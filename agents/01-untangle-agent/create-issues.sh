#!/usr/bin/env bash
# Creates the 10 "what's next" issues for the Untangle Agent.
# Prereqs: gh CLI installed and authenticated (gh auth status).
# Run from inside the agent-playbook repo.
set -euo pipefail

gh issue create --title "[Untangle Agent] Add more chaotic example dumps" \
  --label "good first issue,enhancement" \
  --body "$(cat <<'EOF'
Difficulty: beginner

## What
Add 2-3 more messy brain-dumps to `examples/`, in different domains (e.g. moving apartments, launching a side project, planning a trip).

## Why
The agent's whole job is staying faithful across chaotic input. More varied examples make that easier to test and demo.

## Acceptance criteria
- New `.txt` files in `examples/`, each genuinely messy (maybes, questions, no owners or dates).
- `cat examples/<file> | npm start` returns all five sections with nothing invented.
- README lists the new examples.
EOF
)"

gh issue create --title "[Untangle Agent] Save output to a file with --out flag" \
  --label "good first issue,enhancement" \
  --body "$(cat <<'EOF'
Difficulty: beginner

## What
Add an optional `--out <path>` flag to `src/index.js` that writes the structured result to a markdown file, in addition to printing it.

## Why
People want to keep the untangled result, not just read it once in the terminal.

## Acceptance criteria
- `npm start -- --out result.md < dump.txt` writes `result.md`.
- Without the flag, behavior is unchanged (still prints to stdout).
- README documents the flag.
EOF
)"

gh issue create --title "[Untangle Agent] Validate each section has at least one bullet" \
  --label "enhancement,help wanted" \
  --body "$(cat <<'EOF'
Difficulty: intermediate

## What
`validateResponse` currently checks only that the five headings exist and are ordered. Extend it to flag any section that has a heading but no bullet beneath it.

## Why
A model can emit an empty section and still pass validation today. That should be caught.

## Acceptance criteria
- `src/validate.js` reports an error for any section with a heading but no content.
- New cases added to `test/untangle.test.js`.
- All existing tests still pass, still no live API calls.
EOF
)"

gh issue create --title "[Untangle Agent] Retry once on empty model content" \
  --label "enhancement,help wanted" \
  --body "$(cat <<'EOF'
Difficulty: intermediate

## What
gpt-oss reasoning models occasionally return empty content. In `src/groq.js`, if the returned content is empty, retry once with a higher `max_completion_tokens` (and/or `reasoning_effort: 'medium'`) before giving up.

## Why
We hit this exact bug during the build. A single retry makes the agent more robust without hiding real failures.

## Acceptance criteria
- `untangle()` retries once on empty content, logging the retry to stderr.
- Returns content on success, or a clear error after the retry.
- Behavior documented in `prompts.md`.
EOF
)"

gh issue create --title "[Untangle Agent] Add a 'Decisions Already Made' section" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
Difficulty: intermediate

## What
Some dumps contain settled decisions ("we're definitely doing snacks"). Add an optional section that captures ONLY clearly-stated decisions.

## Why
Right now settled items get mixed into Tasks. Separating them makes the output clearer, as long as we do not weaken faithfulness.

## Notes
Keep it optional: a dump with no decisions must not fail validation. Please propose the approach in the issue before coding.

## Acceptance criteria
- Prompt, `REQUIRED_SECTIONS` handling, and validation updated.
- Tests cover both presence and absence of the section.
- No invented decisions; only things the writer clearly settled.
EOF
)"

gh issue create --title "[Untangle Agent] Add JSON output mode via Groq structured outputs" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
Difficulty: advanced

## What
Add a `--json` flag that returns machine-readable JSON (the five sections as arrays) using Groq structured outputs, instead of markdown.

## Why
Makes the agent composable: other tools can consume its output directly.

## Acceptance criteria
- `--json` returns valid, parseable JSON with the five keys.
- Markdown mode is unchanged when the flag is absent.
- Add an offline test for a JSON-shape validator function.
- README documents the flag.
EOF
)"

gh issue create --title "[Untangle Agent] Model fallback and deprecation guard" \
  --label "enhancement,help wanted" \
  --body "$(cat <<'EOF'
Difficulty: intermediate

## What
If `GROQ_MODEL` errors (deprecated or invalid), catch it and fall back to `openai/gpt-oss-20b` with a clear stderr warning instead of crashing.

## Why
Groq deprecated the old Llama models in June 2026. New contributors may still have a dead model in their `.env`.

## Acceptance criteria
- An invalid/deprecated model triggers the fallback plus a warning.
- A valid model is used unchanged.
- Documented near the deprecation note in `resources.md`.
EOF
)"

gh issue create --title "[Untangle Agent] Flag contradictions without resolving them" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
Difficulty: advanced

## What
When the dump contains contradictory statements (e.g. "no budget" and "let's do catering"), surface the contradiction under Missing Info WITHOUT deciding which side is right.

## Why
Contradictions are signal. Resolving them would violate the "invent nothing" rule; flagging them neutrally does not.

## Acceptance criteria
- Prompt updated to surface stated contradictions neutrally.
- A new example dump containing a contradiction added to `examples/`.
- Manual check confirms the contradiction is surfaced, not resolved.
EOF
)"

gh issue create --title "[Untangle Agent] Add a faithfulness eval script" \
  --label "enhancement,help wanted" \
  --body "$(cat <<'EOF'
Difficulty: advanced

## What
Add `scripts/eval.js` that runs the agent on the example dumps and applies heuristic checks: no dates, owner names, or numbers appear in the output that are not in the input.

## Why
Faithfulness is the core promise. A repeatable check helps us keep it as the prompt evolves.

## Notes
This script hits the live API, so it must NOT be part of `npm test`. Document it separately and mark it clearly.

## Acceptance criteria
- `scripts/eval.js` reports pass/fail per example.
- README documents how to run it and that it uses the API.
EOF
)"

gh issue create --title "[Untangle Agent] Add CONTRIBUTING.md and improve README" \
  --label "documentation,good first issue" \
  --body "$(cat <<'EOF'
Difficulty: beginner

## What
Write `CONTRIBUTING.md` covering the faithfulness philosophy (invent no facts, owners, or deadlines), how to run the tests, and how to pick up an issue. Link it from the README.

## Why
New contributors need to understand the one rule that must never break before they touch the prompt.

## Acceptance criteria
- `CONTRIBUTING.md` exists and covers setup, tests, and the "invent nothing" rule.
- README links to it.
EOF
)"

echo "Done. All 10 issues created."

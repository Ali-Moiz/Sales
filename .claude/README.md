# .claude — Sales CRM Playwright Test Generation

Optimized configuration for generating Playwright tests via `/generate-test`.

## Structure

```
.claude/
├── README.md                                          # This file
├── settings.json                                      # Scoped hooks (test files only)
├── agents/
│   └── generate-playwright-tests.md                   # 9-phase workflow with doc-review pause
├── commands/
│   └── generate-test.md                               # Thin router
└── skills/
    └── playwright-test-standards/
        └── SKILL.md                                   # Authoritative standards
```

## The Flow at a Glance

```
You: /generate-test

Agent asks 3 questions:
  1. Requirements (comma-separated)
  2. Doc file path (.md)
  3. Test output file path (.spec.js)

Agent runs:
  → Phase 0: Verify Playwright MCP, infer module from spec path
  → Phase 1: Discover selectors via Playwright MCP
  → Phase 2: Plan POM methods and assertion points
  → Phase 3: Write manual steps to doc → PAUSE

You review and edit the doc, then reply "proceed"

Agent continues:
  → Phase 3.5: Re-read doc (your edits = source of truth)
  → Phase 4: Append POM methods
  → Phase 5: Generate test code
  → Phase 6: Validate
  → Phase 7: Run headless via Playwright MCP
  → Phase 8: Auto-fix if failures (2 attempts → ask you)
```

## Key Behaviors

### Multi-requirement handling (shared describe)
Pass `"Verify X, Verify Y, Verify Z"` and you get ONE `test.describe()` block titled with your exact string. Inside:
- **Shared flow** → one test with `test.step()` per requirement
- **Independent flows** → separate tests in the same describe

### Module inference
Module comes from the spec path: `tests/e2e/contract-module.spec.js` → `contract` → `pages/contract-module.js`. Agent only asks if the path doesn't match this pattern.

### Doc-review pause
After Phase 3 writes manual steps to your doc, the agent STOPS. You can edit TC codes, steps, expected results, test names — anything. On resume ("proceed"), the agent re-reads the doc and uses your edited version as the source of truth.

### Playwright MCP required
The agent halts at Phase 0 if Playwright MCP is not connected. No silent fallback — MCP is how Claude actually inspects your DOM and runs tests.

### Bounded auto-fix
If a test fails: attempt 1 (selectors) → attempt 2 (waits) → **PAUSE and ask you** with rich context (what was tried, error, hypothesis). You pick:
- `[a]` Try attempt 3 (logic/import/typo)
- `[b]` Mark `test.fail()` with TODO, continue
- `[c]` Stop for manual debugging

After attempt 3 fails, the agent auto-marks `test.fail()` without asking again (hard cap).

## Changes from Previous Version

- **Inputs reduced from 5 to 3.** Module inferred from spec path; codegen handoff folded into MCP-based discovery.
- **Auth setup check dropped.** No longer a blocker.
- **Playwright MCP required.** Replaces the old ambiguous codegen handoff.
- **Doc-review pause added.** Phase 3 stops; Phase 3.5 re-reads doc after your "proceed".
- **Multi-requirement shared describe.** Comma-separated requirements = one describe with `test.step()` groups.
- **Auto-fix changed from "3 attempts silent" to "2 attempts → pause → optional 3rd → `test.fail()`".**

## Prerequisites

Before running `/generate-test`:

- [ ] Playwright MCP server connected in Claude Code
- [ ] `.env.uat` (or `.env`) with `BASE_URL`
- [ ] `playwright.config.js` exists and is configured
- [ ] `pages/` directory for POMs (agent creates the POM file on ask if missing)

## Key Files

- **For rules:** `skills/playwright-test-standards/SKILL.md` (authoritative)
- **For workflow:** `agents/generate-playwright-tests.md`
- **For invocation:** `commands/generate-test.md`

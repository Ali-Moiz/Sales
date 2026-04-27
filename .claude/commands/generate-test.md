---
name: generate-test
description: Generate Playwright tests from comma-separated requirements. Writes manual steps to a doc file first, pauses for user review, then generates passing test code based on the edited doc. Uses Playwright MCP for discovery and headless execution.
---

# Generate Test (Claude Code)

Thin router that invokes the `generate-playwright-tests` agent. All logic lives in the agent + skill.

---

## Usage

```
/generate-test
```

The agent asks for **3 inputs** in one batched prompt:

1. **Requirements** — comma-separated string. Example: `"Verify deleting a service updates totals, Verify remaining service forms work after deletion"`
2. **Documentation file** — where manual steps are added under each requirement heading. Example: `docs/contract-module-test-steps.md`
3. **Test output file** — where the `.spec.js` is written. Example: `tests/e2e/contract-module.spec.js`

The **module** is inferred from the spec file path (e.g., `contract-module.spec.js` → `pages/contract-module.js`). Agent asks only if the pattern doesn't match.

---

## Workflow

| Phase | Purpose | Interactive? |
|---|---|---|
| 0    | Pre-flight (verify Playwright MCP, parse requirements, infer module) | Halts if MCP missing |
| 1    | Selector discovery via Playwright MCP | — |
| 2    | Analyze & plan POM methods, test structure, assertion points | May ask about missing POM |
| 3    | Write manual steps to doc → **STOP** | **Waits for user review** |
| 3.5  | Re-read doc after user says "proceed" — edits override original plan | — |
| 4    | Append new methods to POM (never modifies existing) | — |
| 5    | Generate test code (shared describe block with `test.step()` or separate tests) | — |
| 6    | Validate syntax and standards compliance | — |
| 7    | Execute tests headless via Playwright MCP | — |
| 8    | Auto-fix failures (attempt 1 → attempt 2 → **pause & ask** → optional attempt 3 → `test.fail()`) | Pauses after 2 attempts |

---

## Critical Rules

From `.claude/skills/playwright-test-standards/SKILL.md`:

- **Playwright MCP is REQUIRED.** Agent halts at Phase 0 if not connected.
- **Multiple comma-separated requirements → ONE shared `test.describe()` block.** Shared flow → one test with `test.step()` groups. Independent flows → separate tests.
- **`test.describe()` title = user's exact input string** (comma-separated as passed).
- **Doc-review pause is mandatory** between manual-steps generation and test generation. User edits to the doc are the source of truth on resume.
- **TC codes come from the doc, never invented** during test generation.
- **Auto-fix bounded**: 2 attempts → pause with rich context → user chooses [a] try attempt 3 / [b] mark `test.fail()` / [c] stop. After attempt 3 fails, auto-marks `test.fail()` without asking again.
- **All tests must pass headless via MCP before delivery.**

---

## Doc Review Pause

After Phase 3, the agent writes manual steps and STOPS. You can edit:

- Manual steps (add/remove/reorder)
- TC codes (renumber, rename)
- Expected results / assertion points
- TC names (the part after the ` | ` in test titles)

Reply **"proceed"** (or "continue" / "go ahead") to resume. The agent re-reads the doc and uses your edited version as the source of truth. Reply **"cancel"** to abort.

---

## Auto-Fix Pause Example

After 2 failed attempts on a test:

```
[AUTO-FIX PAUSED] TC-CONTRACT-002 still failing after 2 attempts.

Attempt 1 (selector investigation):
  Tried: [data-testid="service-row"], .service-row, getByRole('row')
  Result: Element not found after dialog opens

Attempt 2 (wait investigation):
  Added: waitForResponse for /api/services
  Result: API returns 200 but UI still shows loading state

Error: TimeoutError: locator.click: Timeout 5000ms exceeded
Hypothesis: Client-side state transition not tied to a network response.

What should I do?
  [a] Try attempt 3 — logic/import/typo check
  [b] Mark this test as test.fail() with TODO and continue
  [c] Stop workflow for manual debugging
```

---

## References

| File | Purpose |
|---|---|
| `.claude/agents/generate-playwright-tests.md` | Workflow orchestration (9 phases) |
| `.claude/skills/playwright-test-standards/SKILL.md` | All standards, rules, patterns |

---

## Prerequisites (Project-Level)

- Playwright MCP server connected in Claude Code
- `.env.uat` (or `.env`) with `BASE_URL`
- `playwright.config.js` configured
- `pages/` directory for Page Object Models (agent creates POM file on ask if missing)
- Doc file is optional — agent creates it in Phase 3 if missing

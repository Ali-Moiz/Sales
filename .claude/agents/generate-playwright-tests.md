---
name: generate-playwright-tests
description: Convert comma-separated user requirements into a Playwright test suite. Generates manual steps in a doc file, pauses for user review, then generates test code based on the edited doc. Uses Playwright MCP for selector discovery. Uses CLI for test execution. All rules live in the `playwright-test-standards` skill — this agent references, never duplicates.
---

# Generate Playwright Tests — Workflow Agent

Orchestrates test generation for the Sales CRM. Load the **`playwright-test-standards` skill** before doing anything else. All standards live there — do not duplicate.

---

## Non-Negotiable Rules

1. **Single session, single window.** All tests in a spec file share ONE browser context, ONE page, ONE login. Use `beforeAll` for setup, `beforeEach` for navigation reset. Never create separate contexts per sub-describe. (Skill §9.1)
2. **Describe title = short summary** — never concatenated requirement strings. Each requirement string appears as `test()` title, `test.step()` title, or `//` comment. (Skill §9.3)
3. **TC names = user's EXACT requirement text** — never shortened or paraphrased. (Skill §9.4)
4. **TC codes come from the doc file, never invented.** (Skill §9.4)
5. **Playwright MCP is REQUIRED for selector discovery only.** Halt at Phase 0 if not connected.
6. **Doc-review pause between Phase 3 and Phase 4 is mandatory.** Do NOT auto-resume.
7. **All tests must pass headless before delivery.** Run via CLI (`npx playwright test`), NOT MCP browser. Failures trigger auto-fix (Skill §12).
8. **Already-implemented requirements are NOT skipped.** Update title, add missing assertions, add `//` comment.
9. **Token budget:** Prefer CLI test runs over MCP browser interactions. MCP is for selector discovery (Phase 0) and targeted debugging only — never for running test suites.

---

## Inputs (3 Questions)

1. **Requirements** — comma-separated list.
2. **Documentation file** — where manual steps go. Example: `docs/contract-module-test-steps.md`
3. **Test output file** — the `.spec.js`. Example: `tests/e2e/contract-module.spec.js`

Module is inferred from spec path: `contract-module.spec.js` → `pages/contract-module.js`. Ask only if pattern doesn't match.

---

## Phase 0: Pre-Flight & Discovery (merged)

1. Load `playwright-test-standards` skill.
2. Verify Playwright MCP is connected. If NOT → STOP with: `[PHASE 0] BLOCKED — Playwright MCP not connected.`
3. Parse requirements into array.
4. Infer module from spec path.
5. Check files: doc (existing TC codes?), spec (existing tests?), POM (exists?).
6. Read `.env.uat` for `BASE_URL`. Fail if missing.
7. Launch browser via MCP, navigate to feature, snapshot DOM, identify selectors per Skill §2 priority.
8. Record selector map + interaction sequence per requirement.

Report: 1-line status per item (MCP status, requirements count, module, files, selectors found).

---

## Phase 2: Analyze & Plan

1. Finalize selectors (Skill §2). Map to existing POM methods; list new methods needed.
2. If POM missing → ask user before creating.
3. Decide test structure: shared flow → one `test()` with `test.step()` groups; independent → separate `test()` blocks. (Skill §1.2)
4. Plan 2-6 assertion points per test/step (Skill §7.1).

Report: 1-line summary (structure decision, POM methods to add, assertion count).

---

## Phase 3: Write Manual Steps to Doc → PAUSE

1. Open doc file (create if missing).
2. For each requirement, add:
   ```markdown
   ### TC-{{PREFIX}}-{{number}} | {{exact requirement text as provided by the user}}
   **Preconditions:** {{list}}
   **Steps:**
   1. {{step}}
   **Expected results / Assertion points:**
   - After step X: {{expected}}
   ```
3. Save. Then STOP and tell user to review. Do NOT proceed until user says "proceed"/"continue"/"go ahead".

---

## Phase 3.5: Re-Read Doc

On user proceed: re-read doc, extract final TC codes/names/steps/assertions. User edits override original plan. Dropped sections → drop from plan. Added sections → include.

---

## Phase 4: Update POM (Append-Only)

Add new selectors to constructor, new methods below existing ones. Never modify/rename/delete existing code. (Skill §8)

---

## Phase 5: Generate Tests

1. Structure per Skill §9: single session pattern (§9.1), describe title = short summary (§9.3); requirement strings in `test()`/`test.step()` titles.
2. NEW requirements → full test/step. ALREADY IMPLEMENTED → update title + add missing assertions + add `//` comment.
3. Apply: single session/single window (§9.1), locator-first selectors (§2), event-based waits (§5), critical-point assertions (§7), unique test data (§6), `test.step()` logging, tags `@smoke`/`@regression` (§9.5).
4. Do NOT add per-test `goto` to the module listing page — the parent `beforeEach` handles state reset (§9.6).

---

## Phase 6: Validate

Run ESLint + grep for banned patterns (`waitForTimeout`, `networkidle`, `xpath=`, `toBeDefined()`). Verify against Skill §13 hard constraints table. Fix any violations before Phase 7.

---

## Phase 7: Execute via CLI

Run tests via **CLI** (`npx playwright test --grep "TC-CODE"` via Bash tool), NOT via MCP browser. CLI output is compact and sufficient for pass/fail + error diagnosis.

1. Run: `npx playwright test <spec-file> --grep "TC-CODE-1|TC-CODE-2"` (combine all generated TC codes).
2. If all pass → deliver.
3. If any fail → capture the CLI error output (test name, error message, line number) and proceed to Phase 8.

**Do NOT** use MCP `browser_navigate` / `browser_snapshot` to run tests — this wastes tokens on DOM serialization.

---

## Phase 8: Auto-Fix (Token-Efficient)

Hard cap: **2 attempts per failing test.** Prioritize CLI error messages over MCP exploration.

```
Attempt 1 — Read CLI error output. Fix based on error message alone (selector typo, missing await, wrong locator).
  Re-run via CLI.
  ↓ still failing?
Attempt 2 — Use MCP DOM snapshot on the SPECIFIC failing element only (not full page). Fix selector/wait.
  Re-run via CLI.
  ↓ still failing?
Auto-mark test.fail() with TODO. No further attempts, no user pause.
```

**Rules:**
- Always re-run via CLI, never MCP browser.
- MCP snapshots: only in attempt 2, only on the specific area of failure — never full-page snapshots.
- Never bump timeouts to fix flakiness. Investigate root cause.
- `test.fail()` TODO format per Skill §12.

---

## Final Report

After all phases, output a compact summary: requirements processed, TC codes, pass/fail counts, files changed.

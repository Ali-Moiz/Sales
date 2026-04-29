---
name: generate-playwright-tests
description: Convert comma-separated user requirements into a Playwright test suite. Generates manual steps in a doc file, pauses for user review, then generates test code based on the edited doc. Uses Playwright MCP for selector discovery and headless execution. All rules live in the `playwright-test-standards` skill — this agent references, never duplicates.
---

# Generate Playwright Tests — Workflow Agent

Orchestrates test generation for the Sales CRM. All standards live in the **`playwright-test-standards` skill** — load it before doing anything else.

---

## Test Philosophy (Per Skill Section 1)

- **Multiple comma-separated requirements** → **ONE shared `test.describe()` block**.
- Inside the describe:
  - Requirements with a **shared flow** → ONE `test()` with `test.step()` groups per requirement.
  - Requirements with **independent flows** → separate `test()` blocks in the same describe.
- Target 3–6 assertions per happy-path test (or 2–4 per `test.step()` group in multi-requirement tests).

---

## ⚠️ Non-Negotiable Rules

1. **`test.describe()` title = short summary of the requirements group** — never the concatenated requirement strings. Each individual requirement string appears as the `test()` title, `test.step()` title, or an inline `//` comment at its implementation point. Skill Section 8.4.
2. **TC codes come from the doc file, never invented.** Skill Section 8.5.
3. **Playwright MCP is REQUIRED.** If not connected, agent halts at Phase 0.
4. **Doc-review pause between Phase 3 and Phase 5 is mandatory.** After Phase 3 writes manual steps, agent STOPS and waits for user confirmation. On resume, agent re-reads the doc (user edits override original plan).
5. **All tests must pass headless via MCP before delivery.** Failures trigger Phase 8 auto-fix (2 attempts → pause → optional attempt 3 → `test.fail()`).
6. **Already-implemented requirements are NOT skipped.** For any requirement whose TC code or test already exists in the output file, the agent MUST: (a) update the `test()` or `test.step()` title to match the requirement string if it doesn't already, (b) add any missing assertions identified in Phase 2, (c) add an inline `//` comment at the relevant implementation point referencing the requirement.

---

## Inputs (Single Batched Prompt — 3 Inputs)

Use ONE `ask_user_input_v0` call with these 3 questions:

1. **Requirements** (free text) — comma-separated list. Example: `"Verify deleting a service updates totals, Verify remaining service forms work after deletion"`
2. **Documentation file** (file path) — where manual steps are added under each requirement heading. Example: `docs/contract-module-test-steps.md`
3. **Test output file** (file path) — where the `.spec.js` is written. Example: `tests/e2e/contract-module.spec.js`

The agent infers the **module** from the test output file path (e.g., `contract-module.spec.js` → module = `contract` → POM = `pages/contract-module.js`). Skill Section 7.

---

## Phase 0: Pre-Flight

1. **Load the `playwright-test-standards` skill.**
2. **Verify Playwright MCP is connected.**
   - Scan available tools for Playwright MCP server.
   - **If NOT connected:** STOP. Report:
     ```
     [PHASE 0] BLOCKED — Playwright MCP not connected.

     This workflow requires the Playwright MCP server for selector discovery
     and headless test execution. Connect it and re-run.
     ```
   - Do NOT proceed.
3. **Parse requirements:** split user's comma-separated string into array of requirements.
4. **Infer module** from test output file path:
   - `tests/e2e/contract-module.spec.js` → `contract` → POM = `pages/contract-module.js`
   - If path doesn't match `{module}-module.spec.js` pattern → ask user to confirm module.
5. **Check files:**
   - Doc file: exists? If yes, parse existing TC codes to avoid collisions.
   - Test output file: exists? If yes, scan for TC codes AND test/step titles to classify each requirement as NEW or ALREADY IMPLEMENTED. For already-implemented ones, record: current title, current assertions, and what's missing.
   - POM file: exists? If not, flag for Phase 4 (will ask user before creating).
6. **Load `.env`:**
   - Read `.env.uat` (or `.env`) for `BASE_URL`.
   - Fail if `BASE_URL` missing.
7. **Report:**
```
[PHASE 0] PRE-FLIGHT
  Playwright MCP: CONNECTED
  Requirements parsed: {{N}}
    1. {{requirement 1}} — {{NEW | ALREADY IMPLEMENTED (TC-X-001, title match: YES/NO, missing assertions: N)}}
    2. {{requirement 2}} — {{NEW | ALREADY IMPLEMENTED (TC-X-002, ...)}}
  Module (inferred): {{module}}
  Doc file: {{path}} ({{exists | new}})
  POM file: {{path}} ({{exists | will prompt to create}})
  Test output: {{path}} ({{exists with N tests | new}})
  Existing TC codes in doc: {{list or "none"}}
  BASE_URL: {{value}}
```

---

## Phase 1: Selector Discovery via Playwright MCP

For each requirement, use Playwright MCP to discover selectors:

1. Launch browser via MCP at `process.env.BASE_URL`.
2. Navigate to the feature for the first requirement.
3. Snapshot DOM / accessibility tree.
4. Identify selectors per skill Section 2 priority order.
5. Repeat for each requirement's entry point.
6. Record: selector map + interaction sequence per requirement.

**If user-supplied codegen paste is available**, merge with MCP findings (skill Section 2.5).

### Report:
```
[PHASE 1] SELECTOR DISCOVERY (via Playwright MCP)
  Requirement 1: {{short name}}
    Entry: {{URL}}
    Selectors identified: {{N}} ({{list of data-testid/CSS/role}})
    Interactions: {{list}}
  Requirement 2: {{short name}}
    ...
  New selectors needed in POM: {{M}}
  XPath → locator conversions (from codegen paste, if any): {{K}}
```

---

## Phase 2: Analyze & Plan

Apply skill Sections 2, 4, 6, 7:

1. **Selectors:** Finalize using Section 2 priority.
2. **POM mapping:** Open `pages/{{module}}-module.js`.
   - List reusable existing methods.
   - List new methods needed.
   - **If POM missing:** use `ask_user_input_v0`: "POM file `pages/{{module}}-module.js` not found. Create it? [Yes / No, use different name / Cancel]"
3. **Waits:** Flag flaky waits to replace.
4. **Test structure decision** (skill Section 1.2):
   - Shared flow across requirements? → ONE test, `test.step()` groups per requirement.
   - Independent flows? → separate tests in same describe.
5. **Assertion planning:** For each test (or each `test.step()` group), list 2–6 assertion points per skill Section 6.1.

### Report:
```
[PHASE 2] ANALYSIS & PLANNING
  Test structure: {{shared-flow | independent-flows}}
  Planned test count: {{N}}
  POM methods to reuse: {{list}}
  POM methods to add: {{list}}
  Waits to convert: {{K}}
  Assertion plan:
    Test 1 / Step 1 ({{requirement}}): {{N}} assertions
      1. {{description}} → {{assertion type}}
      ...
    Test 1 / Step 2 ({{requirement}}): {{N}} assertions
      ...
```

---

## Phase 3: Write Manual Steps to Doc File → PAUSE

1. Open `{{DOC_PATH}}` (create if missing).
2. For each requirement, add a section:
   ```markdown
   ## {{REQUIREMENT_DESCRIPTION}}

   ### TC-{{PREFIX}}-{{number}} | {{short name}}
   **Preconditions:** {{list}}
   **Steps:**
   1. Navigate to {{URL}}.
   2. Click {{element}}.
   3. Fill {{field}} with {{value}}.
   ...
   **Expected results / Assertion points:**
   - After step X: {{expected UI state}}
   - After step Y: {{expected value}}
   ```
3. Include TC codes the agent proposes (next available numbers after existing TC codes found in Phase 0).
4. Save the doc.

### PAUSE — wait for user review

After writing the doc, the agent STOPS and reports:

```
[PHASE 3] MANUAL STEPS WRITTEN TO DOC — REVIEW PAUSE

Doc: {{DOC_PATH}}
Sections added:
  ## {{Requirement 1}}
    ### TC-{{PREFIX}}-{{N}} | {{name}}
  ## {{Requirement 2}}
    ### TC-{{PREFIX}}-{{N+1}} | {{name}}

Proposed describe title: "{{exact comma-joined requirement string}}"
(Alternative: "{{requirements joined with | }}" — reply with preference if you want to change)

PLEASE REVIEW THE DOC:
  - Edit manual steps if needed
  - Edit/renumber TC codes if needed
  - Edit expected results/assertion points if needed
  - Edit TC names (what appears after the | in the test title) if needed

When ready, reply with:
  "proceed" (or "continue", "go ahead") to generate tests based on the CURRENT doc contents
  "cancel" to abort

The agent will re-read the doc on resume and use your edited version as the source of truth.
```

**The agent MUST NOT proceed to Phase 3.5 until the user explicitly replies with a proceed signal.** If the user says anything else first (e.g., another question), address it but do not auto-resume the workflow.

---

## Phase 3.5: Re-Read Doc (User Edits Override)

On user proceed signal:

1. Re-read `{{DOC_PATH}}`.
2. Re-parse every section under the requirement headings.
3. Extract for each requirement:
   - Final TC code(s)
   - Final TC name(s) (after the ` | `)
   - Final step list
   - Final assertion points
4. **If the user changed anything** (renumbered TC codes, added steps, changed assertions), update the internal plan to match the doc exactly.
5. **If the user removed a requirement's section entirely**, drop it from the plan.
6. **If the user added a new requirement section**, include it in the plan.

### Report:
```
[PHASE 3.5] DOC RE-READ
  Source of truth: {{DOC_PATH}} (current state)
  Final TC codes to generate: {{list}}
  Changes from Phase 3 plan: {{list edits the user made, or "none"}}
```

---

## Phase 4: Update POM (Append-Only — Skill Section 7)

For each new method from Phase 2 (filtered by Phase 3.5 changes):

1. Add selectors to the constructor (locator-first).
2. Add methods below existing ones.
3. Encapsulate waits inside POM methods where appropriate.

Do NOT modify, rename, or refactor existing code.

### Report:
```
[PHASE 4] POM UPDATE
  File: pages/{{module}}-module.js
  Methods added: {{N}} ({{list}})
  Methods modified: 0 (append-only enforced)
```

---

## Phase 5: Generate Tests

1. **Structure** per skill Section 8 and Phase 2's test structure decision:
   - `test.describe()` title = **short summary** of the requirements group — never the concatenated requirement strings.
   - One test with `test.step()` groups (shared flow) OR separate tests (independent flows).
   - **Each requirement string** must appear as: the `test()` title (independent flows), the `test.step()` title (shared flow), or an inline `//` comment directly above the relevant implementation block.

2. **For each requirement, apply the correct mode:**

   **NEW requirement** (not found in spec file):
   - Generate a full test or `test.step()` block.
   - Use the requirement string as the `test()` or `test.step()` title.

   **ALREADY IMPLEMENTED requirement** (TC code or matching test found):
   - Update the `test()` or `test.step()` title to match the requirement string if it doesn't already.
   - Add any missing assertions identified in Phase 2.
   - Add an inline `// {{requirement string}}` comment at the relevant implementation point if not already present.
   - Do NOT rewrite working test logic — only add/update titles, assertions, and comments.

3. **Apply ALL skill rules:**
   - Locator-first selectors (Section 2)
   - Event-based waits (Section 4)
   - Critical-point assertions only (Section 6.1)
   - Unique test data (Section 5)
   - `test.step()` logging (Section 8.6)
   - Tags: `@smoke` on happy path, `@regression` on edge cases (Section 8.7)

4. Write to `{{TEST_OUTPUT_FILE}}`.

---

## Phase 6: Validate

### 6a. Syntax
```bash
npx eslint {{TEST_OUTPUT_FILE}}
```

### 6b. Standards compliance (grep-based scan)
```bash
# Should all return zero matches
grep -n "waitForTimeout\|networkidle\|xpath=\|toBeDefined()" {{TEST_OUTPUT_FILE}}
```

Checklist:
- [ ] No XPath
- [ ] No `waitForTimeout`
- [ ] No `networkidle`
- [ ] No double-waits
- [ ] No `toBeDefined()` as sole assertion
- [ ] No hardcoded URLs/credentials
- [ ] Describe title is a short summary — NOT the concatenated requirement string
- [ ] Each requirement string appears in a `test()` title, `test.step()` title, or `//` comment
- [ ] All TC codes match doc
- [ ] `test.step()` used to group multi-requirement assertions
- [ ] Assertion counts within target (3–6 per test, 2–4 per step)

### Report:
```
[PHASE 6] VALIDATION
  Syntax (ESLint): PASS | FAIL ({{errors}})
  Standards:       PASS | FAIL ({{violations}})
  Describe title:  MATCHES | MISMATCH
  TC codes match doc: YES | NO ({{discrepancies}})
```

If FAIL → fix in place before Phase 7.

---

## Phase 7: Execute in Headless Mode via Playwright MCP (MANDATORY)

Run tests via Playwright MCP:

1. Execute `{{TEST_OUTPUT_FILE}}` filtered to the TC codes generated in this run.
2. Capture structured per-test results (pass/fail, duration, error message, failing selector if any).
3. **If all tests pass:** proceed to delivery.
4. **If any test fails:** enter Phase 8.

### Report:
```
[PHASE 7] HEADLESS EXECUTION (via Playwright MCP)
  Tests run: {{list of TC codes}}
  Results:
    TC-X-001: PASS ({{time}}s)
    TC-X-002: FAIL ({{time}}s) — {{error summary}}
  Total: {{passed}}/{{total}} in {{time}}s
  Status: {{READY | Entering Phase 8 for N failing tests}}
```

---

## Phase 8: Auto-Fix (Bounded — Skill Section 10)

For each failing test, run attempts in sequence. After **2 failed attempts**, PAUSE and ask the user.

### Attempt 1: Selector investigation

- Try alternative selectors in priority order.
- Use Playwright MCP to snapshot DOM at failure.
- Re-run the single test. If pass → move to next failing test.

### Attempt 2: Wait root-cause investigation (NOT timeout bumps)

- Check for missing `waitForResponse`, loading spinner, animation, validation race.
- Use MCP to observe timing at failure point.
- Re-run the single test. If pass → move to next failing test.

### PAUSE — Ask user (after attempt 2)

If attempt 2 fails, STOP and present rich context:

```
[AUTO-FIX PAUSED] TC-{{CODE}} still failing after 2 attempts.

Attempt 1 (selector investigation):
  Tried: {{selectors tried}}
  Result: {{what happened}}
  DOM snapshot at failure: {{captured via MCP — key findings}}

Attempt 2 (wait investigation):
  Added: {{wait pattern tried}}
  Result: {{what happened}}

Error: {{exact error message}}
Failed at: {{line / assertion}}

Hypothesis: {{agent's best guess at root cause}}

What should I do?
  [a] Try attempt 3 — logic/import/typo check
  [b] Mark this test as test.fail() with TODO and continue
  [c] Stop workflow for manual debugging
```

Wait for user response. Then:

- **[a] Attempt 3:** check imports, typos, awaits, variable references. Re-run. If still failing, **auto-mark `test.fail()` — do NOT ask again.** Skill Section 10.
- **[b] Skip:** mark `test.fail()` with full TODO block, move on.
- **[c] Stop:** terminate workflow. Report status of all tests.

### Report (after auto-fix loop):
```
[PHASE 8] AUTO-FIX
  TC-X-001: PASSED (attempt 1)
  TC-X-002: PAUSED → user picked [a] → attempt 3 PASSED
  TC-X-003: PAUSED → user picked [b] → marked test.fail()
  Final: {{N}} passing, {{M}} marked test.fail(), {{K}} stopped
```

---

## Final Report

```
═══════════════════════════════════════════════════════════════
  PLAYWRIGHT TEST GENERATION — FINAL REPORT
═══════════════════════════════════════════════════════════════

Requirements processed: {{N}}
  1. {{requirement 1}}
  2. {{requirement 2}}

Module (inferred): {{module}}
Test structure: {{shared-flow one-test | independent-flows multi-test}}

[PHASE 0]    Pre-flight:       PASS (Playwright MCP connected)
[PHASE 1]    Discovery:        {{N}} selectors via MCP
[PHASE 2]    Analysis:         {{N}} POM reused, {{M}} added
[PHASE 3]    Doc written:      {{list of requirements/TC codes}}
[PHASE 3.5]  Doc re-read:      {{edits applied | none}}
[PHASE 4]    POM update:       {{N}} methods appended
[PHASE 5]    Tests generated:  {{list of TC codes}}
[PHASE 6]    Validation:       PASS
[PHASE 7]    Headless run:     {{passed}}/{{total}}
[PHASE 8]    Auto-fix:         {{summary}}

Final status: READY | PARTIAL ({{N}} tests marked test.fail()) | STOPPED

Files changed:
  - {{DOC_PATH}}           (documentation)
  - {{POM_PATH}}           (page object, append-only)
  - {{TEST_OUTPUT_FILE}}   (tests)
```

---

## Agent Constraints

- **Load `playwright-test-standards` skill first** — do not duplicate its rules.
- **Playwright MCP is mandatory** — halt at Phase 0 if not connected.
- **ONE shared describe block** for multi-requirement runs. Describe title = short summary, never the concatenated requirement string.
- **Each requirement string** must surface as a `test()` title, `test.step()` title, or `//` comment — not buried in the describe title.
- **Already-implemented requirements** are NOT skipped — update title, add missing assertions, add comment.
- **Doc-review pause is mandatory** — do NOT skip Phase 3 pause, do NOT auto-resume.
- **Re-read doc on resume** — user's edits override the original plan.
- **Infer module from spec path** — don't ask unless path doesn't match pattern.
- **Never invent TC codes** — they come from the doc (Phase 3/3.5).
- **Never modify existing POM code** — append only.
- **Never hardcode credentials or URLs** — `.env` only.
- **Never bump timeouts to fix flakiness** — investigate root cause.
- **Auto-fix caps at 2 attempts before pause, 3 total hard cap.**
- **After attempt 3 fails, auto-mark `test.fail()` without asking again.**
- **Report clearly at each phase.**

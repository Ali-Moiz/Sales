---
name: generate-playwright-tests
description: Convert a single requirement into one comprehensive Playwright test with multiple assertions. Orchestrates the full workflow from codegen recording through auto-fix. Generates ONE test per requirement, packing all critical assertions (state changes, value updates, UI verifications) into a single focused test flow. Use when the user wants to generate a focused Playwright test for a specific requirement.
---

# Generate Playwright Tests — Single Test Workflow Agent

Generate **ONE comprehensive test per requirement** with multiple assertions packed into a single focused test flow. Orchestrate the full test generation lifecycle for the Sales CRM. All coding standards, selectors, timeouts, and patterns are defined in the **`playwright-test-standards` skill** — this agent references those rules; it does not duplicate them.

**Before doing anything else, load the `playwright-test-standards` skill.** Every phase below assumes you are following those rules.

**Key Philosophy:** One requirement = one test with multiple assertions at critical points (not 10+ tests with 1 assertion each).

---

## ⚠️ CRITICAL REQUIREMENTS (Non-Negotiable)

### 1. Test Describe Block Title Must Match User Requirement EXACTLY

The `test.describe()` block title **MUST** be exactly the user's requirement description—no modifications, variations, or abbreviations.

```javascript
// User provides: "Verify devices quantity cannot go below 0 and cannot accept non-numeric input"

// ✅ CORRECT — Exactly matches
test.describe('Verify devices quantity cannot go below 0 and cannot accept non-numeric input', () => {
  // tests...
});

// ❌ WRONG — Does not match
test.describe('Module Feature Validation', () => { /* ... */ });
test.describe('Module — Feature Tests', () => { /* ... */ });
```

**Why:** The describe block title is the explicit contract between user intent and test implementation. It must appear in test reports exactly as requested.

### 2. All Tests Must Pass in Headless Mode Before Delivery (MANDATORY)

This is a verification requirement, not optional. Do NOT deliver until all generated tests pass in headless mode.

**Verification command (Phase 7):**
```bash
npm run test:uat:{{MODULE}} -- --grep "TC-{{TC_PREFIX}}" --reporter=list
```

**Acceptance criteria:**
- ✅ ALL tests PASS (zero failures)
- ✅ Exit code = 0
- ✅ No timeouts or skipped tests

**If any test fails:** → Run Phase 8 auto-fix (max 3 attempts) → Re-verify → Then deliver

---

## Inputs (4 Required)

Use the `ask_user_input` tool to collect these up front:

### Input 1: Requirement Description
- **Question:** "What feature or functionality should be tested?"
- **Type:** Free text
- **Example:** "Verify deleting a service updates totals and does not break remaining service forms"
- **Usage:** Section header in docs + **EXACT test describe block title** (must match exactly)
- **CRITICAL:** The `test.describe()` block name MUST be exactly the user's requirement description

### Input 2: Module Name
- **Question:** "Which module is being tested?"
- **Type:** Single select
- **Options:** Company, Deal, Property, Contact, Contract, Service, Other
- **Usage:** Context for `test.describe()` label

### Input 3: Documentation File
- **Question:** "Where should test scenarios be documented?"
- **Type:** Single select (glob: `docs/*.md`) + "Create new file" option
- **Example:** `docs/contract-module-test-steps.md`

### Input 4: Test Output File
- **Question:** "Where should automation tests be written?"
- **Type:** Single select (glob: `tests/e2e/*.spec.js`) + "Create new file" option
- **Example:** `tests/e2e/contract-module.spec.js`

### Optional Input 5: Codegen Recording
- **Question:** "Do you want to record the flow with Playwright Codegen first?"
- **Type:** Yes / No
- **If No:** Agent proceeds with DOM inspection via headed mode instead

---

## Phase 0: Pre-Flight Checks

Before writing ANY code:

1. **Load the `playwright-test-standards` skill.**
2. **Parse documentation** (`@{{DOC_PATH}}`):
   - Extract test case ID (e.g., `TC-{{PREFIX}}-001`)
   - Confirm requirement is documented
3. **Check output file** (`@{{TEST_OUTPUT_FILE}}`):
   - Not exist → create fresh with the test
   - Exists → check if test already exists, skip if present
4. **Load environment:**
   - Read `@.env.uat` for `BASE_URL` and credentials
   - Fail fast if `BASE_URL` missing
5. **Report:**
   ```
   [PRE-FLIGHT] Found {{TC_CODE}} in doc; already implemented? {{YES/NO}}; generating 1 test
   ```

---

## Phase 1: Record Flow with Codegen (Optional)

**Skip this phase if user answered "No" to Input 5.**

### If Yes (Codegen):

1. **Start Codegen:**
   ```bash
   HEADLESS=false npx playwright codegen https://uat.sales.teamsignal.com
   ```
2. **User manually performs** the test scenario (follow steps from `@{{DOC_PATH}}`).
3. **Capture codegen output** → save to `codegen-output.js` (temp file).

**Known codegen limitations to fix in Phase 2:**
- Produces XPath → must convert
- No page objects → must refactor
- Hardcoded waits → must replace with event-based
- No assertions → must add
- No logging → must add `test.step()`

### If No (DOM inspection fallback):

1. **Launch headed browser manually:**
   ```bash
   HEADLESS=false npx playwright test --debug
   ```
2. **Inspect DOM via browser devtools** or MCP Playwright tools if available.
3. **Record selector candidates** in notes (don't generate code yet).

---

## Phase 2: Analyze & Generalize (Claude Analysis)

**Input:** Codegen output from Phase 1 (or DOM inspection notes).

**Apply ALL rules from the `playwright-test-standards` skill.** Specifically:

### 2a. Convert Selectors
- XPath → `page.locator()` (CSS/testid/text) → fallback to `getByRole`/`getByLabel`
- See skill Section 2 for the full decision flow

### 2b. Map to Existing POM Methods
- Search `pages/{{module}}-module.js` for existing methods
- List interactions that map to existing methods
- List interactions needing new methods

### 2c. Replace Waits
- `networkidle` → `domcontentloaded` + specific event waits
- `waitForTimeout` → `waitForResponse` / `expect().toBeVisible()` / `waitForURL`
- Remove double-waits (skill Section 4)

### 2d. Add Assertions
- Every test needs at least one meaningful assertion (skill Section 6)
- No `toBeDefined()` alone

### 2e. Add `test.step()` Logging
- Wrap logical sections for trace viewer visibility

### Output:
`codegen-cleaned.js` — production-ready reference for Phase 5.

### Report:
```
[PHASE 2] ANALYSIS & GENERALIZATION
[SELECTORS] {{X}} XPath converted, {{Y}} locators, {{Z}} getByRole/getByLabel fallbacks
[POM MAPPED] {{N}} interactions to existing methods
[NEW METHODS NEEDED] {{M}}: [list]
[WAITS] Replaced {{K}} networkidle/waitForTimeout with event-based waits
[ASSERTIONS] Planned {{J}} assertions at critical points in single test
```

---

## Phase 3: Update Documentation

1. Open `@{{DOC_PATH}}` (create if missing).
2. Add section: `## {{REQUIREMENT_DESCRIPTION}}`
3. Document **ONE comprehensive scenario** that covers the core requirement:
   - Include the primary happy path
   - Identify critical assertion points along the way (state changes, value updates, UI changes)
   - Include edge cases/validations as assertions within that flow
4. For the scenario:
   - **Preconditions:** Required state, data, auth
   - **Step-by-step execution:** Numbered, manual-friendly
   - **Expected results:** List all assertion points (not final result only)
     - After step X: verify Y
     - After step Z: verify condition A
5. Save as DRAFT — finalize after tests generated.

---

## Phase 4: Update Page Object (Append-Only)

**POM rules from skill Section 7 apply. Never modify existing code.**

1. Parse `{{REQUIREMENT_DESCRIPTION}}` → identify module type
2. Search `pages/` for `{{module}}-module.js`:
   - Found → append new methods
   - Not found → ask user: "POM file not found. Create `pages/{{suggested-name}}.js`? [Yes/No]"
3. **Append only:**
   - Add new selectors to constructor (locator-first per skill Section 2)
   - Add new methods below existing ones
4. **Do NOT:**
   - Modify existing methods
   - Rename existing selectors
   - Refactor or delete

---

## Phase 5: Generate Single Test with Multiple Assertions

1. **Reference `codegen-cleaned.js`** from Phase 2 as the structure template.
2. **Generate ONE test per requirement** — pack all assertion points into a single test flow.
3. **Structure:**
   - **Setup:** Create test data, navigate, preconditions
   - **Execution:** Follow documented scenario steps
   - **Assertions (multiple):** Add `await expect()` at each critical point:
     - After action 1: verify state changed
     - After action 2: verify value updated
     - After action 3: verify UI reflects changes
4. **Apply ALL skill rules:**
   - Test structure (skill Section 8)
   - Locator-first selectors (skill Section 2)
   - Event-based waits (skill Section 4)
   - **Meaningful assertions at each step** (skill Section 6) — multiple per test
   - Test isolation (skill Section 5) — unique data per test
   - `test.step()` logging (skill Section 8) — one step per logical phase
5. Write to `@{{TEST_OUTPUT_FILE}}`.

---

## Phase 6: Validate

### 6a. Syntax (ESLint)
```bash
npx eslint {{TEST_OUTPUT_FILE}}
```

Check for:
- Syntax errors
- Missing imports
- Undefined variables
- Debugger statements

### 6b. Standards Compliance (against skill)
Scan generated file for violations:
- [ ] No XPath selectors
- [ ] No `waitForTimeout()` calls
- [ ] No `networkidle` waits
- [ ] No double-waits (`waitFor` before `expect`)
- [ ] No `toBeDefined()` as sole assertion
- [ ] No hardcoded URLs/credentials
- [ ] All tests have `test.step()` sections
- [ ] All tests have at least one meaningful assertion

### 6c. Duplication Detection
- Identical `beforeEach` across tests
- Duplicate assertions
- Repeated logic

Flag but don't auto-refactor — suggest consolidation.

### Report:
```
[SYNTAX] (PASS) No errors (ESLint passed)
[STANDARDS] (PASS) Passed / (FAIL) {{N}} violations (list)
[DUPLICATION] (WARN) {{M}} patterns flagged (recommendations above)
[READY] Test file ready for execution
```

---

## Phase 7: Execute Tests (Headless Mode — BEFORE DELIVERY)

**CRITICAL:** All tests must pass in headless mode before delivery. This is verification, not optional.

1. **Set environment (headless):**
   - Default `.env.uat` (override with `ENV_NAME=prod`)
   - `HEADLESS=true` (default, enforced)
   - Run tests in headless mode to verify they work in CI/CD

2. **Run the generated test:**
   ```bash
   npx playwright test {{TEST_OUTPUT_FILE}} --grep "TC-{{ TEST_CODE }}" --reporter=list
   ```

3. **Verify results:**
   - Test must PASS (0 failures)
   - All assertions within the test must succeed
   - If test fails → move to Phase 8 auto-fix (max 3 attempts)
   - Only deliver when test passes

4. **Capture:**
   - Per-test pass/fail status
   - Execution time per test
   - Error messages if any fail

### Report:
```
[RUN START] TC-{{TEST_CODE}} from {{TEST_OUTPUT_FILE}} (HEADLESS MODE)
[PASS] TC-{{TEST_CODE}} ({{TIME}}s, {{N}} assertions passed)
[RUN COMPLETE] Test passed with all {{N}} assertions | Total: {{TIME}}s
[DELIVERY] ✓ Test passing — ready for delivery
```

**FAIL CHECK:** If test fails:
```
[DELIVERY BLOCKED] Test failing — running Phase 8 auto-fix (max 3 attempts)
```

---

## Phase 8: Auto-Fix Failing Tests (Max 3 Attempts)

**Follow the auto-fix methodology in skill Section 10.** The priority order has changed from legacy — investigate root cause BEFORE bumping timeouts.

### Attempt 1: Selector Investigation
- Is element in DOM when selector runs?
- Try alternatives: `[data-testid]` → CSS → `text=` → `getByLabel` → `getByRole`
- Inspect live DOM via headed mode / MCP

### Attempt 2: Root-Cause Wait Investigation (NOT timeout bumps)

Check in order:
- Missing `waitForResponse` for API call?
- Loading spinner being ignored?
- Modal/drawer animation not awaited?
- Form validation race (button enables async)?

**Timeout increase only permitted if you identify and measure a genuinely slow backend operation.** Target the specific assertion, not the test-level timeout.

### Attempt 3: Logic & Import Fixes
- Missing imports / undeclared variables
- Missing `await` keywords
- Typos

### Attempt 4 (if 1–3 fail): Mark Unresolvable
```javascript
test('TC-X-005 | ...', async () => {
  test.fail();
  // TODO: Root cause unknown after 3 auto-fix attempts
  // Tried: [list of attempts]
  // Recommendation: HEADLESS=false npx playwright test ... --debug
});
```

### Auto-Fix Execution Flow
```
Test fails
  |
[FIX 1/3] Selector investigation
  ├─ Passes? (YES)
  └─ Fails? (Continue)
  |
[FIX 2/3] Wait investigation (NOT timeout bump)
  ├─ Passes? (YES)
  └─ Fails? (Continue)
  |
[FIX 3/3] Logic/import fixes
  ├─ Passes? (YES)
  └─ Fails? (test.fail() + TODO + REPORT)
```

---

## Final Report Template

```
[PHASE 0] PRE-FLIGHT
═══════════════════════════════════════════════════════════════
[PRE-FLIGHT] {{TC_CODE}} documented; exists in file? {{YES/NO}}; generating 1 test

[PHASE 1] CODEGEN (if run)
═══════════════════════════════════════════════════════════════
[CODEGEN] {{X}} selectors captured, {{Y}} interactions recorded
  — OR —
[CODEGEN SKIPPED] Using DOM inspection fallback

[PHASE 2] ANALYSIS & GENERALIZATION
═══════════════════════════════════════════════════════════════
[SELECTORS] XPath converted → locator-first
[POM] {{N}} methods mapped, {{M}} new methods identified
[WAITS] Replaced {{K}} flaky waits with event-based
[ASSERTIONS] Planned {{J}} assertions at critical points

[PHASE 3-5] DOCUMENTATION, POM, TEST
═══════════════════════════════════════════════════════════════
[DOCS] (PASS) Scenario documented with {{J}} assertion points
[POM] (PASS) {{M}} methods appended to {{POM_FILE}}
[TEST] (PASS) {{TC_CODE}} generated with {{J}} assertions

[PHASE 6] VALIDATION
═══════════════════════════════════════════════════════════════
[SYNTAX] (PASS) ESLint passed
[STANDARDS] (PASS) All skill rules followed / (FAIL) {{N}} violations

[PHASE 7] EXECUTION
═══════════════════════════════════════════════════════════════
[RUN] {{TC_CODE}} passed with {{J}}/{{J}} assertions | {{TIME}}s

[PHASE 8] AUTO-FIX (if needed)
═══════════════════════════════════════════════════════════════
[STATUS] {{FIXED/UNRESOLVED}}

[FINAL]
═══════════════════════════════════════════════════════════════
(PASS) TEST PASSING
  — OR —
(WARN) TEST NEEDS MANUAL INSPECTION
  Debug: HEADLESS=false npx playwright test {{FILE}} --debug
```

---

## Example Invocation

```
User: /generate-test

> Requirement: "Verify deleting a service updates totals correctly"
> Module: Contract
> Docs: docs/contract-module-test-steps.md
> Tests: tests/e2e/contract-module.spec.js
> Record with codegen: Yes

[Agent loads playwright-test-standards skill]
[Runs all 8 phases]
[Generates ONE test: TC-CONTRACT-123]
[Test includes assertions for: modal opens, service removed, total updated, confirmation visible]
[All assertions pass in headless mode]
[Reports final status]
```

---

## Agent Constraints

- **Always load `playwright-test-standards` skill first.** Do not duplicate its rules inline.
- **Generate ONE test per requirement** — pack all assertions into a single test flow.
- **Add multiple assertions at critical points** — after each major action, verify state changed.
- **Do not generate 10–15 scenarios** — document ONE comprehensive scenario with assertion points.
- **Do not modify existing POM code** — append only (skill Section 7).
- **Do not bump timeouts to fix flakiness** — investigate root cause (skill Section 10).
- **Do not generate tests that already exist** — skip if test for this TC code exists.
- **Do not hardcode credentials or URLs** — `.env` only (skill Section 9).
- **Ask user before creating new POM files** — default is append to existing.
- **Report clearly at each phase** — use the templates above.

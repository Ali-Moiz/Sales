---
name: generate-playwright-tests
description: Convert manual test case documentation into automated Playwright tests following the playwright-test-standards skill. Orchestrates the full workflow from codegen recording through auto-fix. Use when the user wants to generate Playwright tests, expand test coverage for a module, or convert manual QA test cases into automation.
---

# Generate Playwright Tests — Workflow Agent

Orchestrate the full test generation lifecycle for the Sales CRM. All coding standards, selectors, timeouts, and patterns are defined in the **`playwright-test-standards` skill** — this agent references those rules; it does not duplicate them.

**Before doing anything else, load the `playwright-test-standards` skill.** Every phase below assumes you are following those rules.

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
   - Extract test case IDs (e.g., `TC-{{PREFIX}}-001`)
   - Count total scenarios
3. **Check output file** (`@{{TEST_OUTPUT_FILE}}`):
   - Not exist → create fresh with all tests
   - Exists → extract existing test names, compute DELTA (new tests only)
4. **Load environment:**
   - Read `@.env.uat` for `BASE_URL` and credentials
   - Fail fast if `BASE_URL` missing
5. **Report:**
   ```
   [PRE-FLIGHT] Found {{N}} test cases in doc; {{M}} already implemented; generating {{DELTA}} new tests
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
[ASSERTIONS] Added {{J}} meaningful assertions
```

---

## Phase 3: Update Documentation

1. Open `@{{DOC_PATH}}` (create if missing).
2. Add section: `## {{REQUIREMENT_DESCRIPTION}}`
3. Document **10–15 scenarios**:
   - **Positive cases** (happy path)
   - **Negative cases** (invalid inputs, errors)
   - **Edge cases** (boundaries, state transitions, role-based access)
4. For each scenario:
   - **Scenario type:** Positive / Negative / Edge Case
   - **Preconditions:** Required state, data, auth
   - **Step-by-step execution:** Numbered, manual-friendly
   - **Expected result:** Final outcome
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

## Phase 5: Generate DELTA Tests

1. **Reference `codegen-cleaned.js`** from Phase 2 as the structure template.
2. **Generate only missing tests** (DELTA from Phase 0).
3. **Apply ALL skill rules:**
   - Test structure (skill Section 8)
   - Locator-first selectors (skill Section 2)
   - Event-based waits (skill Section 4)
   - Meaningful assertions (skill Section 6)
   - Test isolation (skill Section 5) — unique data per test
   - `test.step()` logging (skill Section 8)
4. Write to `@{{TEST_OUTPUT_FILE}}`.

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

2. **Run test grep (only generated tests):**
   ```bash
   npx playwright test {{TEST_OUTPUT_FILE}} --grep "TC-{{ TEST_CASE_PATTERN }}" --reporter=list
   ```

3. **Verify results:**
   - ALL tests must PASS (0 failures)
   - If any fail → move to Phase 8 auto-fix (max 3 attempts)
   - Only deliver when ALL tests pass

4. **Capture:**
   - Per-test pass/fail status
   - Execution time per test
   - Error messages if any fail

### Report:
```
[RUN START] {{N}} tests from {{TEST_OUTPUT_FILE}} (HEADLESS MODE)
[PASS] TC-{{PREFIX}}-001 (32s)
[PASS] TC-{{PREFIX}}-002 (28s)
...
[RUN COMPLETE] {{PASS}}/{{TOTAL}} passed | Total: {{TIME}}s
[DELIVERY] ✓ All tests passing — ready for delivery
```

**FAIL CHECK:** If ANY test fails:
```
[DELIVERY BLOCKED] {{N}} test(s) failing — running Phase 8 auto-fix (max 3 attempts)
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
[PRE-FLIGHT] {{N}} scenarios in doc; {{M}} existing; {{DELTA}} new

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
[ASSERTIONS] Added {{J}} meaningful assertions

[PHASE 3-5] DOCUMENTATION, POM, TESTS
═══════════════════════════════════════════════════════════════
[DOCS] (PASS) {{N}} scenarios documented
[POM] (PASS) {{M}} methods appended to {{POM_FILE}}
[TESTS] (PASS) {{DELTA}} tests generated; {{SKIP}} skipped (already exist)

[PHASE 6] VALIDATION
═══════════════════════════════════════════════════════════════
[SYNTAX] (PASS) ESLint passed
[STANDARDS] (PASS) All skill rules followed / (FAIL) {{N}} violations
[DUPLICATION] (WARN) {{M}} patterns flagged

[PHASE 7] EXECUTION
═══════════════════════════════════════════════════════════════
[RUN] {{PASS}} passed, {{FAIL}} failed, {{SKIP}} skipped | {{TIME}}s

[PHASE 8] AUTO-FIX
═══════════════════════════════════════════════════════════════
[FIXED] {{X}} tests auto-fixed
[UNRESOLVED] {{Y}} tests need manual inspection

[FINAL]
═══════════════════════════════════════════════════════════════
(PASS) ALL TESTS PASSING
  — OR —
(WARN) {{N}} MANUAL FIXES NEEDED
  Debug: HEADLESS=false npx playwright test {{FILE}} --debug
```

---

## Example Invocation

```
User: /generate-playwright-tests

> Requirement: "Verify feature validates input correctly"
> Module: {{MODULE_NAME}}
> Docs: docs/{{module}}-test-steps.md
> Tests: tests/e2e/{{module}}.spec.js
> Record with codegen: Yes

[Agent loads playwright-test-standards skill]
[Runs all 9 phases]
[Reports final status]
```

---

## Agent Constraints

- **Always load `playwright-test-standards` skill first.** Do not duplicate its rules inline.
- **Do not modify existing POM code** — append only (skill Section 7).
- **Do not bump timeouts to fix flakiness** — investigate root cause (skill Section 10).
- **Do not generate tests that already exist** — DELTA only.
- **Do not hardcode credentials or URLs** — `.env` only (skill Section 9).
- **Ask user before creating new POM files** — default is append to existing.
- **Report clearly at each phase** — use the templates above.

---
name: generate-playwright-tests
description: Convert a single requirement into one comprehensive Playwright test through a 9-phase workflow. Starts with step discovery (identify what needs to happen), documents steps in the test file, then generates test code as a direct translation of the documented steps. Generates ONE test per requirement, packing all critical assertions (state changes, value updates, UI verifications) into a single focused test flow. Use when the user wants to generate a focused Playwright test for a specific requirement.
---

# Generate Playwright Tests — Single Test Workflow Agent (9 Phases)

Generate **ONE comprehensive test per requirement** through a 9-phase discovery-to-code workflow. The process separates "what needs to happen" (documented in test files) from "how to automate it" (generated test code), making the documentation the authoritative source of truth.

**Workflow:** Step Discovery (Phase 1) → optional Codegen (Phase 2) → Analysis (Phase 3) → Doc Write (Phase 4) → POM Update (Phase 5) → Test Generation (Phase 6) → Validation (Phase 7) → Headless Execution (Phase 8) → Auto-Fix (Phase 9)

All coding standards, selectors, timeouts, and patterns are defined in the **`playwright-test-standards` skill** — this agent references those rules; it does not duplicate them.

**Before doing anything else, load the `playwright-test-standards` skill.** Every phase below assumes you are following those rules.

**Key Philosophy:** One requirement = one test with multiple assertions at critical points (not 10+ tests with 1 assertion each). Doc file is the single source of truth; test code is a direct translation.

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

**Verification command (Phase 8):**
```bash
npm run test:uat:{{MODULE}} -- --grep "TC-{{TC_PREFIX}}" --reporter=list
```

**Acceptance criteria:**
- ✅ ALL tests PASS (zero failures)
- ✅ Exit code = 0
- ✅ No timeouts or skipped tests

**If any test fails:** → Run Phase 9 auto-fix (max 3 attempts) → Re-verify → Then deliver

---

## Inputs (4 Required + 1 Optional)

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

### Optional Input 5: Additional Context
- **Question:** "Any additional context for clarity? (e.g., user role, browser type, preconditions, priority, dependencies)"
- **Type:** Free text (optional)
- **Example:** "HO role only, requires existing contract in draft status, mobile testing"
- **Default:** Empty (none provided)
- **Usage:** Captured and noted in test comments and Phase 0 report for agent reference
- **Why:** Allows user to provide any non-standard requirements or clarifications that don't fit the four main inputs

### Optional Input 6: Codegen Recording
- **Question:** "Do you want to record the flow with Playwright Codegen first?"
- **Type:** Yes / No
- **If No:** Agent proceeds with DOM inspection via headed mode instead

---

## Phase 0: Pre-Flight Checks

Before writing ANY code:

1. **Load the `playwright-test-standards` skill.**
2. **Capture additional context:**
   - Note any user-provided context (Input 5) for reference in test comments
   - Extract key details (role, preconditions, dependencies, priority, browser type) if provided
3. **Parse documentation** (`@{{DOC_PATH}}`):
   - Extract test case ID (e.g., `TC-{{PREFIX}}-001`)
   - Confirm requirement is documented
4. **Check output file** (`@{{TEST_OUTPUT_FILE}}`):
   - Not exist → create fresh with the test
   - Exists → check if test already exists, skip if present
5. **Load environment:**
   - Read `@.env.uat` for `BASE_URL` and credentials
   - Fail fast if `BASE_URL` missing
6. **Report:**
   ```
   [PRE-FLIGHT] Found {{TC_CODE}} in doc; already implemented? {{YES/NO}}; generating 1 test
   [CONTEXT] {{ADDITIONAL_CONTEXT_OR_NONE}}
   ```

---

## Phase 1: Step Discovery & Planning

**No files are touched in this phase.** This is pure reasoning to identify what the test should do.

1. **Analyze the requirement:**
   - Parse the requirement description (Input 1) for key actions and outcomes
   - Consider the module context (Input 2)
   - Incorporate additional context from Input 5 (role, preconditions, dependencies)

2. **Identify execution steps:**
   - Enumerate the step-by-step flow: what the user navigates to, what UI elements they interact with, and in what order
   - Write in plain English, numbered, manual-friendly (not code)
   - Example: "1. Navigate to Contract module", "2. Click 'Create Proposal' button", "3. Fill proposal name field"

3. **Identify assertion points:**
   - List what should be verified after each critical step (state changes, value updates, UI visibility)
   - One assertion per critical action (not all actions—focus on observable outcomes that confirm the requirement)
   - Example: "After step 2: verify Create Proposal drawer opens", "After step 4: verify total is recalculated"

4. **Output format (matches existing doc format):**
   ```
   Execution steps:
   1. [Step 1]
   2. [Step 2]
   ...
   
   Assertion points:
   - After step 2: verify [expected state]
   - After step 4: verify [expected outcome]
   ...
   ```

### Report:
```
[PHASE 1] STEP DISCOVERY & PLANNING
[STEPS] {{N}} execution steps identified
[ASSERTIONS] {{M}} assertion points planned
[READY] Steps ready for doc write
```

---

## Phase 2: Record Flow with Codegen (Optional)

**Skip this phase if user answered "No" to Input 6.**

**Role:** Codegen is now used to **validate and enrich** the steps identified in Phase 1 — capturing real selectors and interactions from the live app if the user opts in. Phase 1 is the source of truth for test steps; codegen provides supporting evidence.

### If Yes (Codegen):

1. **Start Codegen:**
   ```bash
   HEADLESS=false npx playwright codegen https://uat.sales.teamsignal.com
   ```
2. **User manually performs** the test scenario (follow steps from `@{{DOC_PATH}}`).
3. **Capture codegen output** → save to `codegen-output.js` (temp file).

**Known codegen limitations to fix in Phase 3:**
- Produces XPath → must convert
- No page objects → must refactor
- Hardcoded waits → must replace with event-based
- No assertions → must add (already planned in Phase 1)
- No logging → must add `test.step()` (already planned in Phase 1)

### If No (DOM inspection fallback):

1. **Launch headed browser manually:**
   ```bash
   HEADLESS=false npx playwright test --debug
   ```
2. **Inspect DOM via browser devtools** or MCP Playwright tools if available.
3. **Record selector candidates** in notes (don't generate code yet).

---

## Phase 3: Analyze & Generalize (Claude Analysis)

**Input:** 
- Phase 1 identified steps (execution steps + assertion points)
- Optional: Codegen output from Phase 2 (or DOM inspection notes)

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
[PHASE 3] ANALYSIS & GENERALIZATION
[SELECTORS] {{X}} XPath converted, {{Y}} locators, {{Z}} getByRole/getByLabel fallbacks
[POM MAPPED] {{N}} interactions to existing methods
[NEW METHODS NEEDED] {{M}}: [list]
[WAITS] Replaced {{K}} networkidle/waitForTimeout with event-based waits
[ASSERTIONS] {{J}} assertions from Phase 1 confirmed / enriched with codegen evidence
```

---

## Phase 4: Update Documentation (from Phase 1 Steps)

**Input:** Execution steps and assertion points from Phase 1.

1. Open `@{{DOC_PATH}}` (create if missing).
2. Add section: `## {{REQUIREMENT_DESCRIPTION}}`
3. **Write the steps identified in Phase 1** as the authoritative test scenario:
   - **Preconditions:** Required state, data, auth (from additional context if provided)
   - **Execution steps:** Copy the numbered steps from Phase 1 (plain English, manual-friendly)
   - **Assertion points:** Copy the assertion points from Phase 1 (what to verify at each critical step)
4. Save as FINAL — these steps are now the contract for test generation in Phase 6.

### Report:
```
[PHASE 4] DOC WRITE
[DOC] Written {{N}} steps and {{M}} assertion points to {{DOC_PATH}}
[TC] {{TC_CODE}} documented (FINAL)
```

---

## Phase 5: Update Page Object (Append-Only)

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

## Phase 6: Generate Single Test from Documented Steps

**Input:** Documented execution steps and assertion points from Phase 4.

1. **Read the documented steps** from `@{{DOC_PATH}}` (the Phase 4 output).
2. **Generate ONE test per requirement** — direct translation of documented steps into code.
3. **Mapping:**
   - Each execution step → a `test.step('step description', async () => { ... })` block
   - Each assertion point → an `await expect(...)` call immediately after the relevant step
   - Pack all assertions into a single test flow (multiple assertions at critical points)
4. **Structure:**
   - **Setup:** Create test data, navigate, preconditions (from Phase 4 preconditions)
   - **Execution:** `test.step()` blocks following the numbered steps from Phase 4
   - **Assertions (multiple):** `await expect()` at each assertion point from Phase 4
5. **Apply ALL skill rules:**
   - Test structure (skill Section 8)
   - Locator-first selectors (skill Section 2)
   - Event-based waits (skill Section 4)
   - **Meaningful assertions at each step** (skill Section 6) — multiple per test
   - Test isolation (skill Section 5) — unique data per test
   - `test.step()` logging (skill Section 8) — one step per logical phase
6. **Test data reuse optimization (for stateful test suites):**
   - For test suites that modify shared state (e.g., SECTION 20 — Service Deletion & Total Updates), **reuse unpublished data** to reduce execution time and setup overhead
   - Reuse pattern: if a deal/proposal exists in an **unpublished, editable state** (not "closed" or "published"), reuse it rather than creating fresh
   - Document in preconditions: "Reuses unpublished proposal from previous test if available; creates fresh deal if none suitable"
   - Add a flag like `reuseUnpublished: true` to helper functions (`ensureContractStepperReady`, `ensureProposalCardReady`, etc.)
   - Only create fresh data if: deal is published, in closed state, or state is unrecoverable
   - **Benefit:** Significant time savings in test suites with 5+ sequential tests on the same deal (e.g., 10–15% faster execution)
7. Write to `@{{TEST_OUTPUT_FILE}}`.

---

## Phase 6.5: Test Data Reuse (Optional Optimization)

For test suites within a `test.describe.serial()` block that modify shared entity state:

**When to apply:**
- Tests in the same describe block operate on the same deal/proposal/entity
- Tests don't require clean state (happy path iterations, mutations, state transitions)
- Previous test leaves entity in an **editable, non-published state**

**Implementation:**
```javascript
// In preconditions or beforeEach:
const reuseUnpublished = true; // Allow reuse of unpublished proposals
await ensureContractStepperReady(cm, { reuseUnpublished, allowFreshDealRecovery: false });
```

**Guard rails:**
- If a deal is **published or closed**, always create fresh (cannot edit published contracts)
- If state is **unknown** after 3 recovery attempts, create fresh
- Document the assumption in test comments: "This test reuses the deal from TC-XXX if unpublished; creates fresh if needed"

**Example (Service Deletion suite):**
```javascript
test.describe.serial('Verify service deletion updates totals', () => {
  let sharedDealName = '';
  
  test.beforeAll(async () => {
    // Reuse unpublished proposal from prior tests, or create fresh
    await ensureContractTargetDeal({ reuseUnpublished: true });
  });
  
  test('TC-CONTRACT-DELETE-003 | First delete and total update', async () => {
    // Enters stepper on same deal; modifies services; no state reset
    await ensureContractStepperReady(cm, { reuseUnpublished: true });
    // ... delete service, assert total changed ...
  });
  
  test('TC-CONTRACT-DELETE-004 | Second delete on same deal', async () => {
    // Continues from previous test's state (second service exists)
    await ensureContractStepperReady(cm, { reuseUnpublished: true });
    // ... delete another service, assert total changed again ...
  });
});
```

**Report:**
```
[PHASE 6.5] TEST DATA REUSE
[STRATEGY] Reusing unpublished proposal for sequential service tests
[DEAL] Reusing deal X with {{N}} existing services
[FALLBACK] Will create fresh deal if published or unrecoverable
```

---

## Phase 7: Validate

### 7a. Syntax (ESLint)
```bash
npx eslint {{TEST_OUTPUT_FILE}}
```

Check for:
- Syntax errors
- Missing imports
- Undefined variables
- Debugger statements

### 7b. Standards Compliance (against skill)
Scan generated file for violations:
- [ ] No XPath selectors
- [ ] No `waitForTimeout()` calls
- [ ] No `networkidle` waits
- [ ] No double-waits (`waitFor` before `expect`)
- [ ] No `toBeDefined()` as sole assertion
- [ ] No hardcoded URLs/credentials
- [ ] All tests have `test.step()` sections
- [ ] All tests have at least one meaningful assertion

### 7c. Duplication Detection
- Identical `beforeEach` across tests
- Duplicate assertions
- Repeated logic

Flag but don't auto-refactor — suggest consolidation.

### Report:
```
[PHASE 7] VALIDATION
[SYNTAX] (PASS) No errors (ESLint passed)
[STANDARDS] (PASS) Passed / (FAIL) {{N}} violations (list)
[DUPLICATION] (WARN) {{M}} patterns flagged (recommendations above)
[READY] Test file ready for execution
```

---

## Phase 8: Execute Tests (Headless Mode — BEFORE DELIVERY)

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
   - If test fails → move to Phase 9 auto-fix (max 3 attempts)
   - Only deliver when test passes

4. **Capture:**
   - Per-test pass/fail status
   - Execution time per test
   - Error messages if any fail

### Report:
```
[PHASE 8] EXECUTION (HEADLESS MODE)
[RUN START] TC-{{TEST_CODE}} from {{TEST_OUTPUT_FILE}}
[PASS] TC-{{TEST_CODE}} ({{TIME}}s, {{N}} assertions passed)
[RUN COMPLETE] Test passed with all {{N}} assertions | Total: {{TIME}}s
[DELIVERY] ✓ Test passing — ready for delivery
```

**FAIL CHECK:** If test fails:
```
[DELIVERY BLOCKED] Test failing — running Phase 9 auto-fix (max 3 attempts)
```

---

## Phase 9: Auto-Fix Failing Tests (Max 3 Attempts)

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
[CONTEXT] {{ADDITIONAL_CONTEXT_OR_NONE}}

[PHASE 1] STEP DISCOVERY & PLANNING
═══════════════════════════════════════════════════════════════
[STEPS] {{N}} execution steps identified
[ASSERTIONS] {{M}} assertion points planned
[READY] Steps ready for doc write

[PHASE 2] CODEGEN (if run)
═══════════════════════════════════════════════════════════════
[CODEGEN] {{X}} selectors captured, {{Y}} interactions recorded (enriching Phase 1 steps)
  — OR —
[CODEGEN SKIPPED] Using Phase 1 steps as source

[PHASE 3] ANALYSIS & GENERALIZATION
═══════════════════════════════════════════════════════════════
[SELECTORS] XPath converted → locator-first
[POM] {{N}} methods mapped, {{M}} new methods identified
[WAITS] Replaced {{K}} flaky waits with event-based
[ASSERTIONS] {{J}} assertions confirmed

[PHASE 4] DOC WRITE
═══════════════════════════════════════════════════════════════
[DOC] Written {{N}} steps and {{M}} assertion points to {{DOC_PATH}}
[TC] {{TC_CODE}} documented (FINAL)

[PHASE 5] UPDATE POM
═══════════════════════════════════════════════════════════════
[POM] (PASS) {{M}} methods appended to {{POM_FILE}}

[PHASE 6] GENERATE TEST
═══════════════════════════════════════════════════════════════
[TEST] (PASS) {{TC_CODE}} generated with {{J}} assertions (from doc steps)

[PHASE 6.5] TEST DATA REUSE (if applicable)
═══════════════════════════════════════════════════════════════
[STRATEGY] {{REUSE_UNPUBLISHED / CREATE_FRESH}}
[DEAL] {{DEAL_NAME}} (reused / created)
[GUARD_RAILS] Published/closed state checks in place
  — OR —
[STRATEGY] Not applicable (single test / independent data)

[PHASE 7] VALIDATION
═══════════════════════════════════════════════════════════════
[SYNTAX] (PASS) ESLint passed
[STANDARDS] (PASS) All skill rules followed / (FAIL) {{N}} violations

[PHASE 8] EXECUTION
═══════════════════════════════════════════════════════════════
[RUN] {{TC_CODE}} passed with {{J}}/{{J}} assertions | {{TIME}}s

[PHASE 9] AUTO-FIX (if needed)
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

### Simple Single Test
```
User: /generate-test

> Requirement: "Create Proposal drawer opens with correct heading"
> Module: Contract
> Docs: docs/contract-module-test-steps.md
> Tests: tests/e2e/contract-module.spec.js
> Additional context: (none)

[Agent loads playwright-test-standards skill]
[Phase 0] Pre-flight checks
[Phase 1] Identifies steps (1. Navigate to deal, 2. Open Create Proposal drawer) + assertions
[Phase 2] Codegen (skipped)
[Phase 3] Analyzes POM methods
[Phase 4] Writes steps to doc file (FINAL)
[Phase 5] Updates POM with new drawer methods
[Phase 6] Generates test code directly from doc steps
[Phase 6.5] Not applicable (single independent test)
[Phase 7] Validates ESLint and standards
[Phase 8] Executes test in headless mode (PASS)
[Phase 9] Auto-fix (not needed)
```

### Stateful Test Suite with Data Reuse
```
User: /generate-test (for SECTION 20 service deletion tests)

> Requirement: "Verify that deleting a service card removes its price contribution from the footer total"
> Module: Contract
> Docs: docs/contract-module-test-steps.md
> Tests: tests/e2e/contract-module.spec.js
> Additional context: "Part of sequential service deletion suite; reuse unpublished proposal if available"

[Agent loads playwright-test-standards skill]
[Phase 0] Pre-flight checks
[Phase 1] Identifies steps (1. Navigate to stepper, 2. Configure 2 services, 3. Note total, 4. Delete service 1, 5. Verify total decreased)
[Phase 2] Codegen (optional)
[Phase 3] Analyzes POM methods; notes this is stateful (reuses deal from prior tests)
[Phase 4] Writes steps to doc file (FINAL); documents "Reuses unpublished proposal from TC-CONTRACT-E2E-012 if available; creates fresh if published"
[Phase 5] Updates POM with deleteFirstService(), getGrandTotal() methods
[Phase 6] Generates test code with reuseUnpublished: true flag
[Phase 6.5] TEST DATA REUSE strategy documented
  ✓ Reuses unpublished proposal from E2E suite if available
  ✓ Guard rail: creates fresh deal if contract is published
  ✓ Saves ~10-15% execution time vs. fresh data per test
[Phase 7] Validates ESLint and standards
[Phase 8] Executes test in headless mode (PASS)
[Phase 9] Auto-fix (not needed)
```

---

## Agent Constraints

- **Always load `playwright-test-standards` skill first.** Do not duplicate its rules inline.
- **Phase 1 is the source of truth** — identify test steps and assertions before touching any files.
- **Doc file is authoritative** — Phase 6 test code is a direct translation of Phase 4 documented steps.
- **Generate ONE test per requirement** — pack all assertions into a single test flow (map each doc step/assertion to code).
- **Add multiple assertions at critical points** — from Phase 1, after each major action verify state changed.
- **Do not generate 10–15 scenarios** — document ONE comprehensive scenario with assertion points in Phase 4.
- **Do not modify existing POM code** — append only (skill Section 7).
- **Do not bump timeouts to fix flakiness** — investigate root cause (skill Section 10).
- **Do not generate tests that already exist** — skip if test for this TC code exists.
- **Do not hardcode credentials or URLs** — `.env` only (skill Section 9).
- **Ask user before creating new POM files** — default is append to existing.
- **Report clearly at each phase** — use the templates above.
- **Codegen (Phase 2) is optional** — Phase 1 steps are sufficient as source material; codegen enriches but doesn't replace Phase 1 discovery.
- **Reuse unpublished state in sequential test suites** — For test.describe.serial blocks that modify the same entity, reuse unpublished/editable state from prior tests rather than creating fresh data each time. Only create fresh if entity is published, closed, or in unrecoverable state. Documents this strategy in test preconditions and helper flags (e.g., `reuseUnpublished: true`).

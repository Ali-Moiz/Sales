# Generate Test Plan for Sales CRM

Convert manual test case documentation into automated Playwright tests following strict standards.

---

## Inputs (4 Required)

Use `AskUserQuestion` tool with these options:

### Input 1: Requirement Description
- **Header:** "Requirement"
- **Question:** "What feature or functionality should be tested?"
- **Type:** Single select or free text
- **Example:** "Verify deleting a service updates totals and does not break remaining service forms"
- **Usage:** Section header in docs + test case title prefix

### Input 2: Module Name
- **Header:** "Module"
- **Question:** "Which module is being tested?"
- **Type:** Single select (list: Company, Deal, Property, Contact, Contract, etc.)
- **Example:** "Contract Module"
- **Usage:** Context for `test.describe()` label

### Input 3: Documentation File
- **Header:** "Documentation File"
- **Question:** "Where should test scenarios be documented?"
- **Type:** Single select (glob: `docs/*.md`)
- **Options:** Auto-populate from existing `docs/` files + "Create new file" option
- **Example:** `docs/contract-module-test-steps.md`
- **Usage:** File to create/update with manual test cases

### Input 4: Test Output File
- **Header:** "Test Output File"
- **Question:** "Where should automation tests be written?"
- **Type:** Single select (glob: `tests/e2e/*.spec.js`)
- **Options:** Auto-populate from existing `tests/e2e/` files + "Create new file" option
- **Example:** `tests/e2e/contract-module.spec.js`
- **Usage:** Spec file to generate/append tests into

---

## Workflow (8 Phases: Codegen + Claude Hybrid)

### Phase 0: Record Test Flow with Playwright Codegen (OPTIONAL)

**Purpose:** Capture actual DOM paths, real selectors, and interaction sequence from the live application.

1. **Start Codegen for the feature being tested:**
   ```bash
   HEADLESS=false npx playwright codegen https://uat.sales.teamsignal.com
   ```
   This opens a browser with codegen inspector tool running.

2. **Manually perform the test scenario:**
   - Navigate through the application
   - Click buttons, fill forms, check assertions
   - Follow the documented test case steps from `@{{DOC_PATH}}`
   - Codegen records every interaction in real-time

3. **Codegen generates raw test code:**
   ```javascript
   // Codegen output (example)
   await page.goto('https://uat.sales.teamsignal.com/app/sales/deals');
   await page.locator('text=Contract & Terms').click();
   await page.locator('button[aria-label="Create Proposal"]').click();
   await page.locator('input[placeholder="Service 1"]').fill('Security Service A');
   await page.locator('xpath=//button[contains(text(), "Save & Next")]').click();
   ```

4. **Copy generated code** → Save to a temp file (e.g., `codegen-output.js`)

**Codegen Benefits:**
- ✅ Real DOM selectors (not guessed)
- ✅ Accurate timing/waits (how long page actually takes)
- ✅ Exact interaction sequence (click order, field values)
- ✅ Identifies flaky timing issues in real browser

**Limitations of Codegen:**
- ❌ Uses XPath (needs conversion to ARIA/CSS)
- ❌ No page objects or helper methods
- ❌ Hardcoded waits and timing values
- ❌ No error handling or assertions
- ❌ No logging or comments

→ **Phase 1 uses Claude Agent to fix these limitations**

---

### Phase 1: Analyze & Generalize Codegen Output with Claude Agent

**Purpose:** Transform raw codegen output into production-ready test code.

**Input:** Codegen-generated raw test file (from Phase 0)

**Claude Agent performs these transformations:**

#### 1a. Analyze Codegen Output
```javascript
// Parse the codegen file and extract:
// - All selectors used (XPath, CSS, text)
// - Navigation sequence
// - Form inputs and values
// - Expected user actions
```

#### 1b. Extract Selectors & Generalize
```javascript
// BEFORE (Codegen — too specific, uses XPath)
await page.locator('xpath=//button[contains(text(), "Save & Next")]').click();
await page.locator('input[placeholder="Service 1"]').fill('Security Service A');

// AFTER (Claude — smart, reusable, ARIA-first)
await page.getByRole('button', { name: 'Save & Next' }).click();
await page.getByRole('textbox', { name: 'Service 1' }).fill('Security Service A');
```

#### 1c. Map to Page Objects
```javascript
// Identify which POM methods the codegen interaction maps to:
// XPath interaction → POM method name
// Example:
// "page.locator('button[aria-label="Delete"]').click()"
//   maps to → contractModule.deleteFirstService()
```

#### 1d. Add Smart Waits & Timing
```javascript
// BEFORE (Codegen — arbitrary or missing waits)
await page.goto('https://uat.sales.teamsignal.com/app/sales/deals');
await page.locator('text=Contract & Terms').click();

// AFTER (Claude — intelligent waits)
await page.goto(process.env.BASE_URL, { waitUntil: 'networkidle' });
await expect(contractTermsTab).toBeVisible({ timeout: 10_000 });
await contractTermsTab.click();
```

#### 1e. Add Assertions & Error Handling
```javascript
// BEFORE (Codegen — no assertions)
await page.locator('button').click();

// AFTER (Claude — proper assertions)
await expect(successToast).toBeVisible({ timeout: 5_000 });
await expect(serviceTotal).toHaveValue(/\$\d+\.\d{2}/);
```

#### 1f. Add Logging & Comments
```javascript
console.log('[STEP 1] Opening contract stepper...');
await page.goto(baseUrl, { waitUntil: 'networkidle' });

console.log('[STEP 2] Filling service details...');
await contractModule.fillServiceName('Security Service A');
```

#### 1g. Use Page Objects
```javascript
// BEFORE (Codegen — raw selectors everywhere)
await page.locator('input').first().fill('Name');
await page.locator('button').nth(2).click();

// AFTER (Claude — POM methods)
await contractModule.fillServiceName('Name');
await contractModule.clickSaveAndNext();
```

#### 1h. Output: Cleaned Test Code
```javascript
// codegen-cleaned.js — production-ready
// (This becomes the foundation for Phase 4 test generation)

const { test, expect } = require('@playwright/test');
const { ContractModule } = require('../../pages/contract-module.js');
require('dotenv').config();

test.describe('Contract Module — Service Deletion', () => {
  let page;
  let contractModule;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    contractModule = new ContractModule(page);

    const baseUrl = process.env.BASE_URL;
    console.log('[SETUP] Navigating to ' + baseUrl);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
  });

  test('TC-CONTRACT-DELETE-001 | Record actual flow', async () => {
    console.log('[STEP 1] Opening contract stepper...');
    await contractModule.openDealDetail('Test Deal');

    console.log('[STEP 2] Filling service details...');
    await contractModule.fillStep1Services({
      serviceName: 'Security Service A',
      officerCount: 1,
      hourlyRate: 15,
      jobDays: ['Mon'],
      startTime: { hours: '09', minutes: '00', meridiem: 'AM' },
      endTime: { hours: '05', minutes: '00', meridiem: 'PM' }
    });

    console.log('[ASSERT] Verify service exists...');
    await contractModule.assertServiceExists('Security Service A');

    console.log('[DONE] Flow recorded successfully');
  });
});
```

**Claude Agent Report (Phase 1 Output):**
```
[CODEGEN ANALYSIS] Processed codegen output
[SELECTORS FOUND] 12 XPath, 5 CSS, 3 text-based
[GENERALIZED] Converted 18 selectors to ARIA-first equivalents
[POM MAPPED] 8 interactions mapped to existing POM methods
[NEW METHODS NEEDED] 2 new POM methods identified (deleteFirstService, getGrandTotal)
[TIMING] Added smart waits (networkidle, visibility, explicit waits)
[ASSERTIONS] Added 6 new assertions based on expected results
[LOGGING] Added console logs at 9 major checkpoints
[OUTPUT] codegen-cleaned.js ready for Phase 2 documentation
```

---

### Phase 2: Update Documentation File

1. Open `@{{DOC_PATH}}`
2. Add a new section with `## {{REQUIREMENT_DESCRIPTION}}`
3. **Use cleaned codegen output (from Phase 1) as reference** for accurate steps and selectors
4. Document 10–15 test scenarios:
   - **Positive cases** (happy path, valid inputs)
   - **Negative cases** (invalid inputs, error states)
   - **Edge cases** (boundary values, stress, state transitions, role-based access)
4. For each scenario, specify:
   - **Scenario type:** Positive / Negative / Edge Case
   - **Preconditions:** Required state, data, login, URL
   - **Step-by-step execution:** Numbered, manual-friendly steps
   - **Expected result:** Final outcome mapped to POM methods
5. Save the doc as DRAFT — do not finalize until tests are generated

### Phase 2: Update Page Object (Append-Only)

**POM File Discovery Algorithm:**

1. Parse `{{REQUIREMENT_DESCRIPTION}}` to identify module type (e.g., "Contract", "Service")
2. Search `pages/` directory for matching file:
   - Look for pattern: `pages/{{MODULE}}-module.js` or `pages/{{module}}.page.js`
   - Example: "Contract Module" → search for `contract-module.js`
3. If found → Open and append new methods
4. If NOT found → Ask user: "POM file not found. Create `pages/{{suggested-name}}.js`? [Yes/No]"
5. **Append only** — never modify, rename, or delete existing code:
   - Add new selectors to constructor
   - Create new methods for user actions
6. Follow existing naming and selector strategy (ARIA > text > CSS)
7. Save POM file

### Phase 4: Generate Automation Tests

See **Steps 0–6** below for full test generation process.

1. **Use cleaned codegen output** (from Phase 1) as reference for test structure
2. **Leverage POM mappings** identified in Phase 1 analysis
3. **Generate DELTA tests** (skip already-implemented test names)
4. **Apply best practices:** logging, smart waits, error handling

### Phase 5: Validate Syntax & Detect Code Duplication

Before running tests, validate the generated code:

#### 5a. Syntax Validation (Using ESLint)
- Run ESLint on generated `.spec.js` file: `npx eslint {{TEST_OUTPUT_FILE}}`
- Check for:
  - Syntax errors (missing braces, invalid JS)
  - Missing imports/requires
  - Undefined variables
  - Console/debugger statements left in code
- Report format:
  ```
  [SYNTAX] ✅ No syntax errors found
  — OR —
  [SYNTAX] ❌ 2 errors found:
    Line 45: Missing import for 'ContractModule'
    Line 102: Undefined variable 'serviceTotal'
  ```

#### 5b. Code Duplication Detection
- **Algorithm:** Compare test case logic line-by-line
- **Check for:**
  - Identical `beforeEach` setup code across multiple tests
  - Duplicate assertions (same `expect()` statements)
  - Repeated helper logic (e.g., login, navigation)
- **Action:** Flag duplication but do NOT refactor (recommend consolidation)
- **Report format:**
  ```
  [DUPLICATION] ⚠️ Found 2 issues:
    1. Tests TC-001 and TC-003 share identical beforeEach setup (lines 45–55)
       → Suggest: Create shared helper method
    2. Tests TC-002 and TC-004 both assert same service total format
       → Suggest: Extract to helper assertion
  ```

#### 5c. Quality Checks
- Verify all tests have console logging (`[STEP]`, `[ASSERT]`, `[DONE]`)
- Check that timeouts are in reasonable range (5s–20s)
- Warn if tests exceed 1500 lines of code
- Verify no hardcoded credentials, BASE_URL, or email addresses

**Report:**
```
[SYNTAX] ✅ No syntax errors found
[DUPLICATION] ⚠️ Found 2 duplicate patterns (recommendations above)
[QUALITY] ✅ All tests properly logged, timed, and safe
[READY] Test file is ready for execution
```

### Phase 6: Run Tests with Browser Validation

Execute the generated tests in headed mode (visible browser):

1. **Set Environment:**
   - Load `.env.uat` (default; use `ENV_NAME=prod` to override)
   - Set `HEADLESS=false` to show browser
   - Set `DEBUG=pw:api` for Playwright logs

2. **Execute Tests:**
   ```bash
   HEADLESS=false ENV_NAME=uat npx playwright test {{TEST_OUTPUT_FILE}} --project=chromium
   ```

3. **Capture Results:**
   - Per-test pass/fail status
   - Error messages and stack traces
   - Screenshots on failure (auto-saved to `screenshots/`)
   - Test execution time per case
   - Total suite execution time

4. **Report Format:**
   ```
   [RUN START] Executing {{N}} tests from {{TEST_OUTPUT_FILE}}
   [PASS] TC-CONTRACT-DELETE-001 ✅ (2.3s)
   [PASS] TC-CONTRACT-DELETE-002 ✅ (1.8s)
   [FAIL] TC-CONTRACT-DELETE-003 ❌ (timeout at step 5)
   [SKIP] TC-CONTRACT-DELETE-004 ⊘ (already implemented)
   [RUN COMPLETE] 2 passed, 1 failed, 1 skipped | Total: 6.1s
   ```

### Phase 7: Auto-Fix Failing Tests (Max 3 Attempts)

When a test fails, attempt automatic fixes in this priority order:

#### 7a. Fix Priority Order (Attempt 1–3)

**Attempt 1: Selector Fixes**
- Analyze failed selector: `[data-testid="..."]`, `.class-name`, etc.
- Try alternatives: ARIA role → visible text → CSS
- Use MCP to inspect live DOM for element
- Update selector in test code
- Re-run the specific failing test

**Attempt 2: Timeout Adjustments**
- Increase assertion timeout from 5s to 10s
- Add explicit waits: `waitForLoadState('networkidle')`
- Add element visibility waits before interaction
- Example fix:
  ```javascript
  // BEFORE
  await expect(serviceTotal).toHaveValue('$100.00');

  // AFTER
  await expect(serviceTotal).toBeVisible({ timeout: 10_000 });
  await serviceTotal.waitFor({ state: 'visible', timeout: 10_000 });
  await expect(serviceTotal).toHaveValue('$100.00', { timeout: 8_000 });
  ```

**Attempt 3: Logic & Import Fixes**
- Add missing imports: `const { ContractModule } = require(...)`
- Declare missing variables
- Fix typos in method/variable names
- Correct async/await missing keywords

#### 7b. Execution Flow
```
Test fails
    ↓
[FIX ATTEMPT 1/3] Try selector alternatives
    ├─ Passes? → [PASS] ✅ Test fixed, continue
    └─ Fails? → Try next fix
    ↓
[FIX ATTEMPT 2/3] Increase timeouts + add waits
    ├─ Passes? → [PASS] ✅ Test fixed, continue
    └─ Fails? → Try next fix
    ↓
[FIX ATTEMPT 3/3] Logic & import fixes
    ├─ Passes? → [PASS] ✅ Test fixed, continue
    └─ Fails? → Mark as test.fail() + TODO + REPORT
```

#### 7c. Report Format

**If Auto-Fix Succeeds:**
```
[FIX ATTEMPT 1/3] TC-CONTRACT-DELETE-003 — selector not found
[CHANGE] Replaced '.service-delete' with button { name: 'Delete' }
[RETRY] Re-running TC-CONTRACT-DELETE-003...
[PASS] ✅ Test now passes after fixes
```

**If All Attempts Fail:**
```
[FIX ATTEMPT 1/3] Selector alternatives — FAILED
[FIX ATTEMPT 2/3] Timeout + waits — FAILED
[FIX ATTEMPT 3/3] Logic fixes — FAILED
[MANUAL FIX NEEDED] TC-CONTRACT-DELETE-005
  Issue: Element '[data-testid="service-delete"]' not found in DOM
  Root cause: Selector may have conditional render or dynamic ID
  Action: Run in headed mode to inspect live DOM
  Command: HEADLESS=false npx playwright test {{FILE}} --grep "TC-CONTRACT-DELETE-005" --debug
```

---

## Step 0 — Pre-Flight Checks

Before writing ANY code:

1. **Parse the documentation** (`@{{DOC_PATH}}`):
   - Extract the test case names/IDs (e.g., `TC-CONTRACT-DELETE-001`)
   - Count total test scenarios to generate
2. **Check if output file exists** (`@{{TEST_OUTPUT_FILE}}`):
   - If it does NOT exist → prepare to create it fresh with all tests
   - If it DOES exist:
     - Read the file and extract all existing test names
     - Compare against the doc test names
     - Identify which tests are already implemented (SKIP these)
     - Identify which tests are new (GENERATE only these = DELTA)
3. **Load environment**:
   - Read `@.env.uat` for `BASE_URL` and credentials (never hardcode)
4. **Report findings**:
   - Log: `[PRE-FLIGHT] Found {{N}} test cases in doc; {{M}} already implemented; generating {{DELTA}} new tests`

---

## Step 1 — Selector Strategy (NO XPATH)

When resolving selectors, **use this priority order**:

### Priority 1: ARIA Roles with Accessible Names
```javascript
page.getByRole('button', { name: 'Save' })
page.getByRole('textbox', { name: 'Email' })
page.getByRole('tab', { name: 'Contract & Terms' })
```

### Priority 2: Visible Text or Labels
```javascript
page.getByText('Save', { exact: true })
page.getByLabel('First Name')
```

### Priority 3: CSS Selectors
```javascript
page.locator('.class-name')
page.locator('[data-testid="element-id"]')
page.locator('input[type="email"]')
```

### Priority 4: NEVER USE XPATH
```javascript
// ❌ ABSOLUTELY FORBIDDEN
page.locator('xpath=//button[contains(text(), "Save")]')
```

---

## Step 2 — POM Usage

1. **Import existing Page Object classes:**
   ```javascript
   const { ContractModule } = require('../../pages/contract-module.js');
   ```

2. **Use existing methods whenever possible:**
   ```javascript
   // ✅ GOOD — method exists in POM
   await contractModule.fillServiceName('Security Service A');
   ```

3. **If a required action has NO POM method:**
   - Implement it inline in the test
   - Add a TODO comment for Phase 2 to add to POM
   ```javascript
   // TODO: consider moving to POM — no existing method found
   await page.locator('[data-testid="new-action"]').click();
   ```

4. **ABSOLUTELY DO NOT:**
   - Modify existing POM methods
   - Create new POM files during test generation
   - Refactor or delete POM selectors

---

## Step 3 — Test Structure

Organize each spec file as follows:

```javascript
const { test, expect } = require('@playwright/test');
const { ContractModule } = require('../../pages/contract-module.js');
require('dotenv').config();

test.describe('{{MODULE_NAME}} — {{REQUIREMENT_DESCRIPTION}}', () => {
  let page;
  let contractModule;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    contractModule = new ContractModule(page);

    const baseUrl = process.env.BASE_URL || 'https://uat.sales.teamsignal.com';
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    console.log('[SETUP] Navigated to ' + baseUrl);

    // TODO: implement login based on your auth flow
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      const screenshotPath = `screenshots/${testInfo.title.replace(/\s+/g, '_')}_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`[FAILURE] Screenshot saved: ${screenshotPath}`);
    }
  });

  test('exact name from documentation', async () => {
    console.log('[TEST START] Running: exact name from documentation');
    // test body
    console.log('[DONE] Test completed successfully');
  });

});
```

---

## Step 4 — Console Logging

Add a `console.log()` at every meaningful checkpoint:

```javascript
console.log('[STEP 1] Navigating to property listing page...');
console.log('[STEP 2] Clicking Add Property button...');
console.log('[ASSERT] Verifying success toast is visible...');
console.log('[DONE] Test completed: <test name>');
```

---

## Step 5 — Waits & Timing

**BEST PRACTICES:**

```javascript
// After navigation
await page.waitForLoadState('networkidle', { timeout: 20_000 });

// Before interaction
await expect(locator).toBeVisible({ timeout: 8_000 });

// For dynamic content
await page.waitForSelector('[data-testid="modal"]', { timeout: 10_000 });

// For API responses
await page.waitForResponse(response => response.url().includes('/api/service'));
```

| Scenario | Timeout |
|---|---|
| Navigation + load | 20,000 ms |
| Element visibility | 8,000–10,000 ms |
| API response | 10,000 ms |
| Assertion | 5,000 ms |
| Arbitrary pause (rare) | ≤ 500 ms |

---

## Step 6 — Retry & Failure Handling

Playwright auto-retries failed tests based on `playwright.config.js` retry settings. You do NOT need to implement manual retry logic.

For unresolvable steps, use `test.fail()` + TODO:
```javascript
test('TC-EXAMPLE-001 | Unresolvable feature', async () => {
  test.fail();
  // TODO: Selector not found — needs manual DOM inspection
  // Expected element: [data-testid="feature-x"]
  // Recommendation: Run in headed mode to verify selector
});
```

---

## Hard Constraints

| Constraint | Detail | Consequence |
|---|---|---|
| **NO XPATH** | Zero tolerance. Use ARIA, text, or CSS only. | Unresolvable → test.fail() + TODO |
| **DELTA ONLY** | Skip test cases already in output file | Only generate missing tests |
| **ENV SAFETY** | All credentials/URLs from `.env` only | No hardcoded values |
| **SYNTAX VALIDATION** | Use ESLint before executing tests | Fail fast on syntax errors |
| **DUPLICATION DETECTION** | Compare test logic; flag identical patterns | Recommend consolidation |
| **RUN IN HEADED MODE** | Execute with `HEADLESS=false` | Browser visible for debugging |
| **AUTO-FIX MAX 3 ATTEMPTS** | Try selector → timeout → logic fixes | Report manually if all fail |
| **VALIDATE TIMEOUTS** | Keep waits in 5s–20s range | Warn if outside bounds |

---

## Summary: Full Test Lifecycle Checklist

- [ ] **Phase 0:** Record actual test flow with Playwright Codegen (optional but recommended)
- [ ] **Phase 1:** Analyze & generalize codegen output with Claude Agent
- [ ] **Phase 2:** Update/create documentation with 10–15 test scenarios
- [ ] **Phase 3:** Discover/update POM file with new methods (append-only)
- [ ] **Phase 4:** Generate DELTA tests into output file
- [ ] **Phase 5:** Validate syntax (ESLint), duplication, quality
- [ ] **Phase 6:** Run tests in headed browser mode
- [ ] **Phase 7:** Auto-fix failing tests (max 3 attempts); report results
- [ ] **Final Report:** Pass/fail count, execution time, any manual fixes needed

---

## Final Report Template

```
[PHASE 0] CODEGEN RECORDING
═════════════════════════════════════════════════════════════
[CODEGEN] Recording completed successfully
[SELECTORS CAPTURED] {{N}} DOM paths, real-world interactions
[TIMING DATA] Actual performance metrics collected

[PHASE 1] CLAUDE ANALYSIS & GENERALIZATION
═════════════════════════════════════════════════════════════
[CODEGEN ANALYSIS] Processed raw codegen output
[GENERALIZED] Converted XPath/CSS to ARIA-first selectors
[POM MAPPED] {{N}} interactions mapped to existing POM methods
[NEW METHODS] {{N}} new POM methods identified
[OUTPUT] Cleaned test code ready for next phases

[PHASE 2-4] DOCUMENTATION, POM, & TEST GENERATION
═════════════════════════════════════════════════════════════
[DOCS UPDATED] Added {{N}} test scenarios to {{DOC_PATH}}
[POM UPDATED] {{N}} new methods appended to {{POM_FILE}}
[TESTS GENERATED] Generated {{DELTA}} tests; skipped {{M}} existing

[PHASE 5] VALIDATION
═════════════════════════════════════════════════════════════
[SYNTAX] ✅ No syntax errors (ESLint passed)
[DUPLICATION] ⚠️ {{N}} duplicate patterns identified (recommendations above)
[QUALITY] ✅ All tests properly logged, timed, and safe

[PHASE 6] TEST EXECUTION
═════════════════════════════════════════════════════════════
[RUN START] Executing {{TOTAL}} tests in headed browser mode
[RUN SUMMARY] {{PASS}} passed, {{FAIL}} failed, {{SKIP}} skipped | {{TOTAL_TIME}}s
[SCREENSHOTS] Failure screenshots saved to: screenshots/

[PHASE 7] AUTO-FIX RESULTS
═════════════════════════════════════════════════════════════
[AUTO-FIX] Attempted fixes on {{FAIL_COUNT}} failing tests
[FIXED] {{FIXED_COUNT}} tests fixed and now passing
[STILL FAILING] {{REMAINING_FAIL}} tests require manual debugging

[FINAL RESULT]
═════════════════════════════════════════════════════════════
✅ ALL TESTS PASSING
  — OR —
⚠️ MANUAL FIXES NEEDED
  Run in headed mode: HEADLESS=false npx playwright test {{FILE}} --debug
```

---

## Example: Full Codegen + Claude Hybrid Workflow

```bash
# User runs command with inputs
/generate-test-plan

> Requirement: "Verify deleting a service updates totals"
> Module: "Contract Module"
> Docs: "docs/contract-module-test-steps.md"
> Tests: "tests/e2e/contract-module.spec.js"

# PHASE 0 — RECORD WITH CODEGEN (Optional)
═══════════════════════════════════════════════════════════════
[CODEGEN START] Opening browser with codegen inspector...
$ HEADLESS=false npx playwright codegen https://uat.sales.teamsignal.com

User manually performs test scenario:
  1. Navigate to Deals list
  2. Open contract stepper
  3. Create 2 services
  4. Delete first service
  5. Verify totals updated

[CODEGEN OUTPUT] Raw test code generated:
  - 12 selectors (8 XPath, 4 CSS)
  - Exact timing data
  - Interaction sequence
[CODEGEN SAVED] → codegen-output.js

# PHASE 1 — CLAUDE ANALYZES & GENERALIZES
═══════════════════════════════════════════════════════════════
[CODEGEN ANALYSIS] Claude Agent processing raw output...
[SELECTORS FOUND] 12 selectors (8 XPath, 4 CSS)
[GENERALIZED]
  ✅ 7 ARIA-role selectors
  ✅ 3 text-based selectors
  ✅ 2 CSS selectors
[POM MAPPED] 8 interactions to POM methods
[NEW METHODS IDENTIFIED] 2:
  1. getGrandTotal()
  2. deleteFirstService()
[OUTPUT] codegen-cleaned.js — production-ready

# PHASES 2-4 — DOCUMENTATION, POM, TESTS
═══════════════════════════════════════════════════════════════
[PHASE 2] ✅ 10 test scenarios documented
[PHASE 3] ✅ 2 POM methods added
[PHASE 4] ✅ 10 tests generated (0 skipped)

# PHASE 5 — VALIDATION
═══════════════════════════════════════════════════════════════
[SYNTAX] ✅ No errors (ESLint passed)
[DUPLICATION] ⚠️ 1 pattern (suggestion provided)
[QUALITY] ✅ All tests logged, timed, safe

# PHASE 6 — EXECUTION
═══════════════════════════════════════════════════════════════
[RUN START] 10 tests in headed browser
[PASS] TC-CONTRACT-DELETE-001 ✅ (2.3s)
[PASS] TC-CONTRACT-DELETE-002 ✅ (1.8s)
[PASS] TC-CONTRACT-DELETE-003 ✅ (2.1s)
[FAIL] TC-CONTRACT-DELETE-004 ❌ (timeout)
[PASS] TC-CONTRACT-DELETE-005 ✅ (2.0s)
[PASS] TC-CONTRACT-DELETE-006 ✅ (3.2s)
[PASS] TC-CONTRACT-DELETE-007 ✅ (1.9s)
[PASS] TC-CONTRACT-DELETE-008 ✅ (1.7s)
[PASS] TC-CONTRACT-DELETE-009 ✅ (2.4s)
[PASS] TC-CONTRACT-DELETE-010 ✅ (1.5s)
[RUN COMPLETE] 9 passed, 1 failed | 20.9s

# PHASE 7 — AUTO-FIX
═══════════════════════════════════════════════════════════════
[FIX ATTEMPT 1/3] Selector alternatives
[CHANGE] page.getByRole('spinbutton', { name: /Officer|Guard/ })
[RETRY] TC-CONTRACT-DELETE-004...
[PASS] ✅ Test fixed!

═══════════════════════════════════════════════════════════════
✅ SUCCESS — ALL 10 TESTS PASSING
═══════════════════════════════════════════════════════════════
```

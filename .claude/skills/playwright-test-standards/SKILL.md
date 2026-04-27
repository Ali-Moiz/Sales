---
name: playwright-test-standards
description: Authoritative standards for writing fast, reliable Playwright tests for the Sales CRM. Use whenever generating new Playwright tests (.spec.js), creating or appending Page Object Models (pages/*.js), or fixing a failing/flaky test. Covers selector strategy, timeouts, wait patterns, assertion rules, POM conventions, test structure for multi-requirement describe blocks, codegen handoff via Playwright MCP, and bounded auto-fix methodology. Do NOT use for Cypress, Jest, Selenium, or unit tests.
---

# Playwright Test Standards — Sales CRM

Single source of truth for Playwright test rules. Every rule here prevents a specific, observed failure mode. If the `generate-playwright-tests` agent or any command appears to contradict this file, **this file wins**.

---

## 0. Core Philosophy

**Tests should fail fast, not wait forever.** A 30s timeout is a ceiling, not a target. If tests are slow, the fix is *smarter waits*, not *longer timeouts*.

**The single biggest cause of slow Playwright suites is AI-generated tests that stack redundant waits and bump timeouts to mask flakiness.** Do not do this.

**Multiple user requirements → ONE shared `test.describe()` block → one test per requirement, grouped by `test.step()` when they share a flow.** See Section 1 and Section 8 for the exact structure.

---

## 1. The Unit of Testing

### 1.1 Single requirement → one describe, one happy-path test

One user requirement maps to **one `test.describe()` block** containing **one happy-path test + 0–N edge-case tests**.

- **Happy-path test** (always required): walks the flow, asserts at every critical point (Section 6.1).
- **Edge-case tests** (only if the requirement explicitly covers them): one small test per distinct edge case.

### 1.2 Multiple requirements in one run → ONE shared describe block

When the user passes multiple comma-separated requirements in one invocation:

- **ALL requirements share ONE `test.describe()` block.**
- The describe title joins the requirements (e.g., `"Verify X | Verify Y | Verify Z"` or the user's exact comma-separated string).
- Inside the describe block, use `test.step()` to group assertions by requirement **when they share a flow** (e.g., "create service" and "delete service updates totals" are one flow).
- Use **separate `test()` blocks** when requirements are independent flows (e.g., "create proposal" and "reject negative quantity" can't be one test).

**Decision rule:**

```
Do the requirements share setup and a continuous UI flow?
  YES → one test() with test.step() per requirement
  NO  → separate test() blocks inside the same describe()
```

### 1.3 Rule of thumb

| Requirement phrasing | Expected output |
|---|---|
| "Verify user can create a proposal" | 1 describe, 1 test (happy path) |
| "Verify deleting a service updates totals" | 1 describe, 1 test with 3–5 assertions |
| "Verify quantity cannot go below 0 and cannot accept non-numeric input" | 1 describe, 3 tests (happy + 2 edges) |
| "Verify X, Verify Y" (comma-separated, shared flow) | 1 describe, 1 test with 2 `test.step()` groups |
| "Verify X, Verify Y" (comma-separated, independent flows) | 1 describe, 2 tests |

**Do not generate 10+ tests per requirement.** Pack assertions into tests, not tests into describe blocks.

---

## 2. Selector Strategy (NO XPATH)

Use `page.locator()` as the primary approach. Fall back to `getByRole()` / `getByLabel()` only when `page.locator()` is awkward.

### Priority 1: `page.locator()` — Default

```javascript
// Test IDs (preferred when available)
page.locator('[data-testid="save-btn"]')

// Text-based
page.locator('text=Action')
page.locator('text="Feature Name"')      // Exact match
page.locator('text=/action/i')            // Regex

// CSS
page.locator('.row-item')
page.locator('input[name="field"]')

// Chained (narrowing scope)
page.locator('.service-row').locator('text=Delete')

// Filters
page.locator('.row').filter({ hasText: 'Expected Name' })
page.locator('button').filter({ has: page.locator('svg.icon-action') })
```

### Priority 2: `getByRole()` / `getByLabel()` — Accessibility Fallback

```javascript
page.getByLabel('Email')
page.getByRole('button', { name: 'Save Changes' })
page.getByRole('dialog', { name: 'Confirm Delete' })
```

### Priority 3: NEVER USE XPATH

```javascript
// FORBIDDEN
page.locator('xpath=//button[contains(text(), "Save")]')
page.locator('//div[@class="service"]')
```

If codegen produces XPath, convert it. If no equivalent exists, mark with `test.fail()` and a TODO — do not keep the XPath.

### Decision Flow

```
Need to select an element?
  ├─ Has data-testid?       → page.locator('[data-testid="..."]')
  ├─ Has stable CSS/class?  → page.locator('.class-name')
  ├─ Matched by text?       → page.locator('text=...')
  ├─ Form input with label? → page.getByLabel('...')
  ├─ Button/tab/dialog?     → page.getByRole('...', { name: '...' })
  └─ None of the above?     → test.fail() + TODO
```

---

## 2.5 Selector Discovery via Playwright MCP (REQUIRED)

The agent uses the **Playwright MCP server** for all browser automation: selector discovery, DOM inspection, and test execution. If Playwright MCP is not connected, the agent halts at Phase 0.

### What MCP provides

- Live browser session Claude can drive directly (navigate, click, fill, snapshot DOM)
- DOM/accessibility tree inspection without leaving the chat
- Headless test execution with structured results
- Ability to iterate on selectors against the real app in real time

### How to use it during discovery (Phase 1)

1. Launch browser via MCP against `process.env.BASE_URL`.
2. Navigate to the feature under test.
3. Snapshot the DOM / accessibility tree.
4. Identify selectors using Section 2 priority order.
5. Record selectors + interaction steps for use in Phase 4 (POM) and Phase 5 (tests).

### How to use it during execution (Phase 7)

1. Run tests in headless mode via MCP.
2. Capture structured pass/fail results per test.
3. On failure, MCP provides stack trace + failed selector + DOM snapshot for root-cause analysis in Phase 8.

### What the agent must NOT do

- Must not fabricate selectors from memory. Every selector must be verified via MCP DOM inspection or user-provided codegen paste.
- Must not skip MCP execution in Phase 7. Tests that have not been verified passing in a real browser session cannot be delivered.

---

## 3. Timeout Standards

### Config defaults (`playwright.config.js`)

```javascript
export default {
  timeout: 30_000,              // Overall test timeout
  expect: { timeout: 5_000 },   // Assertion timeout
  use: {
    navigationTimeout: 10_000,
    actionTimeout: 5_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
};
```

### Per-scenario ceilings

| Scenario | Timeout | Notes |
|----------|---------|-------|
| Navigation | 10,000 ms | |
| Element visibility | 5,000 ms | Default `expect` timeout |
| API response | 10,000 ms | Use `waitForResponse`, not arbitrary waits |
| Assertion | 5,000 ms | Web-first assertions auto-wait |
| Arbitrary pause | **Banned** | Use event-based waits instead |

### The Timeout Rule

> **Never increase a timeout to "fix" a flaky test.** Investigate why it's slow. Raising the ceiling hides bugs and multiplies suite runtime.

**Acceptable**: a genuinely long backend operation (file upload, report generation) where you've **measured** the duration. Target the specific assertion, not the test-level timeout.

**Unacceptable**: "it passes when I bump it to 15s" — the test races a condition you haven't made explicit. Find the real condition.

---

## 4. Wait Strategy

### Avoid `networkidle`

`networkidle` waits for 500ms of zero network activity. On modern apps with analytics/polling/websockets this rarely happens.

```javascript
// AVOID
await page.goto(url, { waitUntil: 'networkidle' });

// PREFER
await page.goto(url, { waitUntil: 'domcontentloaded' });
```

### Use event-based waits

```javascript
// Wait for API response
await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/services') && r.status() === 200),
  page.locator('[data-testid="save-btn"]').click(),
]);

// Wait for element (web-first assertion auto-waits)
await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

// Wait for navigation
await Promise.all([
  page.waitForURL(/\/deals\/\d+/),
  page.locator('[data-testid="create-btn"]').click(),
]);

// Wait for spinner to disappear
await expect(page.locator('[data-testid="spinner"]')).toBeHidden();
```

### Do NOT double-wait

```javascript
// REDUNDANT — up to 10s + 5s = 15s
await locator.waitFor({ state: 'visible', timeout: 10_000 });
await expect(locator).toBeVisible({ timeout: 5_000 });

// CLEAN — expect auto-waits
await expect(locator).toBeVisible();
```

### Never use `page.waitForTimeout()`

If you think you need it, you've missed the real wait condition.

### Animation-aware patterns (MUI, drawers, modals)

For animated components, wait for settled state, not just existence:

```javascript
// Drawer animates in → wait for it to be fully open before interacting
const drawer = page.locator('[role="dialog"]');
await expect(drawer).toBeVisible();
await expect(drawer).toHaveAttribute('aria-hidden', 'false');

// MUI input — wait for the input inside, not the wrapper
const input = page.locator('.MuiInputBase-root').locator('input').first();
await expect(input).toBeEnabled();
await input.fill('value');
```

---

## 5. Test Isolation

For `fullyParallel: true` to work:

- Each test creates its own test data.
- No shared state between tests.
- Each test cleans up after itself (or uses unique IDs).
- Tests pass in any order.

### Unique data pattern

```javascript
test('create item', async ({ page }) => {
  const itemName = `Item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await featureModule.fillInput(itemName);
  await expect(page.locator(`text=${itemName}`)).toBeVisible();
});
```

### API-based cleanup (preferred over UI cleanup)

```javascript
test.afterEach(async ({ request }) => {
  if (createdId) {
    await request.delete(`/api/items/${createdId}`);
  }
});
```

Avoid UI-based cleanup (clicking Delete → Confirm) — it's slow, flaky, and doubles the surface area of each test.

---

## 6. Assertion Rules

Every test MUST have meaningful assertions. Existence checks alone are not assertions.

### Insufficient

```javascript
expect(total).toBeDefined();  // Passes even if total is the string "undefined"
```

### Sufficient

```javascript
expect(total).toMatch(/\$[\d,]+\.\d{2}/);
expect(Number(total.replace(/[$,]/g, ''))).toBeGreaterThan(0);
```

### Prefer web-first assertions

```javascript
await expect(page.locator('[data-testid="toast"]')).toHaveText(/saved successfully/i);
await expect(page.locator('[data-testid="total"]')).toHaveValue('$150.00');
await expect(page.locator('[data-testid="next-btn"]')).toBeEnabled();
await expect(page.locator('.service-row')).toHaveCount(3);
```

### 6.1 Definition: "Critical Assertion Point"

A step deserves an assertion **if and only if** one of the following is true:

| # | Condition | Assertion type |
|---|---|---|
| 1 | Server state is expected to change | `waitForResponse` + UI reflection via `toHaveText` / `toHaveCount` |
| 2 | URL changes | `await expect(page).toHaveURL(...)` |
| 3 | A calculated/derived value updates | `toHaveText` / `toHaveValue` with **exact expected value** |
| 4 | A modal/dialog/drawer opens or closes | `toBeVisible` / `toBeHidden` on the container |
| 5 | A form validation triggers | `toHaveText` on the error message (exact text or regex) |
| 6 | An element's enabled/disabled state changes | `toBeEnabled` / `toBeDisabled` |

**If a step matches none of these, do not add an assertion for it.** Don't assert that a button is visible immediately after clicking it — that's noise.

### Target: 3–6 assertions per happy-path test

Fewer than 3 → you're probably missing critical points. More than 6 → you're asserting noise or the test is doing too much.

For multi-requirement tests using `test.step()` groups, target **2–4 assertions per `test.step()` group**.

---

## 7. Page Object Model (POM) Rules

### File discovery

- Pattern: `pages/{{module}}-module.js` (e.g., `pages/contract-module.js`)
- Module is inferred from the test output file path (e.g., `tests/e2e/contract-module.spec.js` → `contract` → `pages/contract-module.js`).
- If missing, the agent MUST ask the user before creating.

### Append-only

- Never modify existing POM methods.
- Never rename existing selectors.
- Never delete existing code.
- Only ADD new selectors and methods.

### POM structure

```javascript
class FeatureModule {
  constructor(page) {
    this.page = page;
    // Locators defined once, reused across methods
    this.saveButton = page.locator('[data-testid="save-btn"]');
    this.primaryInput = page.locator('[data-testid="primary-input"]');
    this.featureTab = page.getByRole('tab', { name: 'Feature' });
    this.confirmDialog = page.getByRole('dialog', { name: 'Confirm Action' });
  }

  async fillInput(value) {
    await this.primaryInput.fill(value);
  }

  async clickSave() {
    await this.saveButton.click();
  }

  // Waits belong in the POM, not in tests — encapsulate the wait condition
  async saveAndWaitForConfirmation() {
    await Promise.all([
      this.page.waitForResponse(r => r.url().includes('/api/save') && r.status() === 200),
      this.saveButton.click(),
    ]);
  }
}

module.exports = { FeatureModule };
```

---

## 8. Test Structure (Canonical Templates)

### 8.1 Single requirement

```javascript
const { test, expect } = require('@playwright/test');
const { FeatureModule } = require('../../pages/feature-module.js');
require('dotenv').config();

// Describe title = user requirement verbatim. No prefix, no paraphrasing.
test.describe('Verify deleting a service updates totals correctly', () => {
  let featureModule;

  test.beforeEach(async ({ page }) => {
    featureModule = new FeatureModule(page);
    await page.goto('/feature-path', { waitUntil: 'domcontentloaded' });
  });

  test('TC-CONTRACT-001 | Delete service updates grand total @smoke', async ({ page }) => {
    await test.step('Setup: create contract with two services', async () => { /* ... */ });
    await test.step('Delete one service', async () => { /* ... */ });
    await test.step('Verify total recalculated', async () => {
      await expect(page.locator('[data-testid="grand-total"]')).toHaveText('$150.00');
    });
  });
});
```

### 8.2 Multiple requirements — shared describe, shared flow → one test with `test.step()` groups

```javascript
// User input: "Verify deleting a service updates totals, Verify remaining service forms work after deletion"
// Shared flow → ONE test, grouped by test.step()

test.describe('Verify deleting a service updates totals, Verify remaining service forms work after deletion', () => {
  let featureModule;

  test.beforeEach(async ({ page }) => {
    featureModule = new FeatureModule(page);
    await page.goto('/contract/new', { waitUntil: 'domcontentloaded' });
  });

  test('TC-CONTRACT-001 | Delete service flow — totals update and remaining forms stay functional @smoke', async ({ page }) => {
    // Shared setup
    await test.step('Setup: create contract with three services', async () => {
      await featureModule.addService('Service A', 100);
      await featureModule.addService('Service B', 50);
      await featureModule.addService('Service C', 25);
    });

    // Requirement 1: totals update
    await test.step('Requirement 1: Verify deleting a service updates totals correctly', async () => {
      await featureModule.deleteService('Service B');
      await expect(page.locator('[data-testid="grand-total"]')).toHaveText('$125.00');
      await expect(page.locator('.service-row')).toHaveCount(2);
    });

    // Requirement 2: remaining forms work
    await test.step('Requirement 2: Verify remaining service forms work after deletion', async () => {
      await featureModule.editServiceName('Service A', 'Service A Updated');
      await expect(page.locator('text=Service A Updated')).toBeVisible();
      await expect(page.locator('[data-testid="save-btn"]')).toBeEnabled();
    });
  });
});
```

### 8.3 Multiple requirements — independent flows → separate tests in same describe

```javascript
// User input: "Verify creating a proposal, Verify rejecting negative quantity"
// Independent flows (different entry points, different setup) → SEPARATE tests, same describe

test.describe('Verify creating a proposal, Verify rejecting negative quantity', () => {
  let featureModule;

  test.beforeEach(async ({ page }) => {
    featureModule = new FeatureModule(page);
  });

  test('TC-CONTRACT-001 | Create proposal with valid inputs @smoke', async ({ page }) => {
    await page.goto('/proposals/new', { waitUntil: 'domcontentloaded' });
    /* ... */
  });

  test('TC-CONTRACT-002 | Reject negative quantity on device form @regression', async ({ page }) => {
    await page.goto('/devices', { waitUntil: 'domcontentloaded' });
    /* ... */
  });
});
```

### 8.4 Describe title rule — EXACT user input

The `test.describe()` title MUST be the user's requirement string verbatim.

- **Single requirement:** describe title = the requirement exactly.
- **Multiple requirements (comma-separated):** describe title = the comma-separated string exactly as passed, OR the requirements joined with ` | ` if the agent deems that more readable. **Ask the user in Phase 3 if unsure.**

```javascript
// User input: "Verify creating a proposal, Verify rejecting negative quantity"

// CORRECT
test.describe('Verify creating a proposal, Verify rejecting negative quantity', () => { });

// ALSO ACCEPTABLE (if confirmed with user)
test.describe('Verify creating a proposal | Verify rejecting negative quantity', () => { });

// INCORRECT
test.describe('Contract Module — Proposals', () => { });
test.describe('Verify proposal tests', () => { });
```

### 8.5 TC code naming

TC codes must be written into `docs/{{module}}-test-steps.md` **before** test generation (Phase 3). After the doc-review pause, the agent re-reads the doc and uses the TC codes found there.

- Never invent TC codes at test-write time.
- If the user edits TC codes during the doc-review pause, the agent uses the edited codes.

### 8.6 Key patterns

- Use `{ page }` from test context — don't create `browser.newContext()` manually.
- Use `test.step()` for logical sections — shows in trace viewer and groups multi-requirement assertions.
- Screenshots/traces go in `playwright.config.js`, not in `afterEach`:
  ```javascript
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  }
  ```

### 8.7 Test tagging

Tags enable suite slicing:

```javascript
test('TC-CONTRACT-001 | Create contract @smoke @critical', async ({ page }) => { });
test('TC-CONTRACT-005 | Reject negative quantity @regression', async ({ page }) => { });
```

- `@smoke` — the happy path for each flow
- `@regression` — edge cases and validations
- `@critical` — blocking business flows

Run only smoke: `npx playwright test --grep @smoke`

---

## 9. Environment Safety

- All URLs and secrets come from `.env` (loaded via `dotenv`).
- Never hardcode `BASE_URL`, usernames, passwords, API keys.
- Validate env vars at test setup:
  ```javascript
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) throw new Error('BASE_URL missing from .env');
  ```

---

## 10. Test Data: env vars vs local constants

Static test-fixture values (names, labels, search strings) must **never** come from `process.env.*`. They are test data, not configuration. This section defines the boundary.

### 10.1 The rule in one sentence

> `process.env.*` is for **runtime configuration**. Named constants at the top of the file are for **static test fixture data**. Dynamically created records use a `PAT {timestamp}` value pattern so they are identifiable as test-generated.

### 10.2 What belongs in `process.env.*`

Three categories only:

| Category | Examples | How to access |
|---|---|---|
| **Secrets / credentials** | passwords, API tokens, auth keys | Via `utils/env.js` — never raw `process.env` |
| **CI / runtime toggles** | `CI`, `HEADLESS`, `DEBUG`, retry-count overrides | `process.env.CI`, `process.env.HEADLESS` |
| **Cross-suite handoff state** | `CREATED_PROPERTY_NAME` passed between suites | Prefer `utils/shared-run-state.js` helpers over direct writes |

Everything else — user names, franchise labels, contact names, search strings, assignee labels, numeric limits — lives in named constants at the top of the file.

### 10.3 Static fixture constants — naming and placement

- **Placement:** top of the Page Object file, before the class declaration, in a clearly commented block.
- **Naming pattern:** `<DOMAIN>_<FIELD>_<ENV>` where `<ENV>` is `PROD` or `NONPROD` (omit if env-invariant).
- **Default numeric fallbacks** (retry limits, attempt counts) are also named constants — no magic numbers in expressions like `|| 8`.

### 10.4 Dynamic test data — the `PAT {timestamp}` value pattern

When a test **creates** a new record (property, deal, contact, etc.), the value itself should carry a `PAT` prefix so the record is clearly identifiable as test-generated and easy to clean up:

```javascript
// Value contains "PAT" + timestamp — the constant name has no special prefix
const propertyName = `PAT ${Date.now()}`;
const dealName     = `PAT ${Date.now()}`;
```

The `PAT` is in the **value**, not the variable name. This makes test-created records greppable in the database and distinguishable from real data.

### 10.5 Before / after example

```javascript
// ── BEFORE (avoid) ──────────────────────────────────────────────────────────
// Buried literals, impossible to grep, misleading if a header says "no hardcoded names"
const franchiseLabel = env.envName === 'prod' ? 'Tkxel Test Franchise' : '216 - Omaha, NE';
for (let i = 0; i < (process.env.MAX_ATTEMPTS || 8); i++) { ... }

// ── AFTER (preferred) ────────────────────────────────────────────────────────
// At top of file:
const FRANCHISE_PROD    = 'Tkxel Test Franchise';
const FRANCHISE_NONPROD = '216 - Omaha, NE';
const MAX_SEARCH_ATTEMPTS = 8;

// In method body:
const franchiseLabel = env.envName === 'prod' ? FRANCHISE_PROD : FRANCHISE_NONPROD;
for (let i = 0; i < MAX_SEARCH_ATTEMPTS; i++) { ... }

// For records created during the test:
const propertyName = `PAT ${Date.now()}`;
```

The `env.envName` switch is fine; only the string literals move into named constants.

### 10.6 Header comment accuracy

If a file header says **"Fully dynamic — no hardcoded names"** but the file contains hardcoded prod/non-prod name literals, fix one or the other:

- Move the literals into named constants and update the header to reflect that, **or**
- Remove the misleading claim from the header.

Prefer accurate comments over aspirational ones.

### 10.7 Applying these rules when editing

- **New page objects / spec files:** apply from the start — no exceptions.
- **Existing files (editing or reviewing):** flag every violation found **within the scope of your current task**. Before refactoring code outside the immediate task, ask the user first.

---

## 11. Auto-Fix Methodology

When a test fails in Phase 7, the agent enters Phase 8 auto-fix. **Hard cap: 3 attempts total per failing test.**

### The escalation flow

```
Test fails in Phase 7
  ↓
Attempt 1 — Selector investigation (skill Section 2)
  ↓ still failing?
Attempt 2 — Wait root-cause investigation (NOT timeout bumps)
  ↓ still failing?
[PAUSE] — Agent stops and asks user what to do next
  ↓ user picks:
    [a] Try attempt 3 (logic/import/typo check)
    [b] Mark test.fail() with TODO and continue
    [c] Stop workflow for manual debugging
  ↓
If [a] and attempt 3 fails → auto-mark test.fail() (no further asking)
```

### Attempt 1: Selector investigation

- Is the element in the DOM when the selector runs?
- Try alternatives in order: `[data-testid]` → CSS → `text=` → `getByLabel` → `getByRole`
- Use Playwright MCP to snapshot DOM at failure point.

### Attempt 2: Wait root-cause investigation

**No timeout bumps.** Investigate:

- Missing `waitForResponse` for an API call?
- Loading spinner being ignored?
- Modal/drawer animation not awaited?
- Form validation race (button enables async)?

Timeout increase only if investigation reveals a **measured** slow backend op. Target the specific assertion, never the test-level timeout.

### PAUSE — Agent asks user

After attempt 2 fails, the agent STOPS and presents rich context:

```
[AUTO-FIX PAUSED] TC-CONTRACT-002 still failing after 2 attempts.

Attempt 1 (selector investigation):
  Tried: [data-testid="service-row"], .service-row, getByRole('row')
  Result: Element not found after dialog opens
  DOM snapshot at failure: <captured via MCP>

Attempt 2 (wait investigation):
  Added: waitForResponse for /api/services
  Result: API returns 200 but UI still shows loading state

Error: TimeoutError: locator.click: Timeout 5000ms exceeded
Failed at: await featureModule.clickServiceRow('Test Service')

Hypothesis: The list renders after a second, client-side state transition
that isn't tied to a network response.

What should I do?
  [a] Try attempt 3 — logic/import/typo check
  [b] Mark this test as test.fail() with TODO and continue
  [c] Stop workflow for manual debugging
```

The agent waits for the user's answer before doing anything else.

### Attempt 3 (only if user picks [a])

Logic-level fixes:
- Missing imports
- Undeclared variables
- Missing `await` keywords
- Typos in method/variable names
- Wrong module/POM reference

If attempt 3 fails, auto-mark `test.fail()` with TODO. **Do NOT ask again.**

```javascript
test('TC-CONTRACT-002 | ...', async () => {
  test.fail();
  // TODO: Unresolved after 3 auto-fix attempts
  // Attempt 1: Selector alternatives — element not found
  // Attempt 2: Wait investigation — UI state not tied to API response
  // Attempt 3: Logic check — no import/typo issues found
  // Hypothesis: Client-side state transition not captured
  // Recommendation: HEADLESS=false npx playwright test <file> --debug
});
```

---

## 11. Hard Constraints Summary

| Constraint | Detail | Consequence |
|---|---|---|
| **NO XPATH** | Use `page.locator()` or `getByRole`/`getByLabel`. | Unresolvable → `test.fail()` + TODO |
| **NO `waitForTimeout`** | Arbitrary pauses banned. | Refactor required |
| **NO `networkidle`** | Use `domcontentloaded` + explicit waits. | Refactor required |
| **NO DOUBLE-WAITS** | `waitFor()` + `expect()` is redundant. | Remove the `waitFor()` |
| **NO TIMEOUT BUMPS** | Don't raise timeouts to fix flakiness. | Investigate root cause |
| **NO HARDCODED ENV** | All URLs/credentials from `.env`. | Test fails with clear error |
| **NO SHARED STATE** | Tests pass in any order. | Breaks `fullyParallel` |
| **NO INVENTED TC CODES** | TC codes come from docs. | Tests not in docs are skipped |
| **NO FABRICATED SELECTORS** | Must verify via Playwright MCP or user paste. | Selectors must be verifiable |
| **ASSERTIONS REQUIRED** | Match one of the 6 critical-point conditions. | `toBeDefined()` alone insufficient |
| **DESCRIBE = REQUIREMENT VERBATIM** | Single: exact. Multiple: comma-separated string. | Agent MUST enforce |
| **POM APPEND-ONLY** | Never modify existing POM. | Only add new methods |
| **SHARED DESCRIBE FOR MULTI-REQ** | All comma-separated requirements → one describe. | No multiple describes per run |
| **2 ATTEMPTS → PAUSE** | Auto-fix pauses after 2 attempts, asks user. | Cap at 3 total; no further asks after 3 |
| **NO `process.env` FOR TEST DATA** | Names, labels, search strings → named constants at top of file. | Flag and refactor before merging |
| **STATIC FIXTURE CONSTANTS** | Inline string literals buried in expressions → named `DOMAIN_FIELD_ENV` const block. | Unnamed literals are a review blocker |
| **NO MAGIC NUMERIC FALLBACKS** | `\|\| 8` style defaults → named constant (e.g. `MAX_SEARCH_ATTEMPTS`). | Makes limits greppable and reviewable |
| **`PAT {timestamp}` FOR CREATED RECORDS** | Plain names for test-created records → `\`PAT ${Date.now()}\``. | Identifies test-generated data in DB |
| **ACCURATE HEADER COMMENTS** | Header must not claim "no hardcoded names" if static literals exist. | Fix comment or extract constants |

---

## 13. Quick Reference — Patterns

| Situation | Avoid | Prefer |
|-----------|-------|--------|
| Page load | `waitUntil: 'networkidle'` | `waitUntil: 'domcontentloaded'` |
| Wait for element | `waitForTimeout(3000)` | `await expect(el).toBeVisible()` |
| Wait for API | `waitForTimeout(2000)` | `waitForResponse(r => r.url().includes('/api/'))` |
| Select button | `xpath=//button[text()="Save"]` | `page.locator('[data-testid="save"]')` |
| Select by label | `page.locator('input').nth(3)` | `page.getByLabel('Email')` |
| Assert existence | `expect(val).toBeDefined()` | `expect(val).toMatch(/regex/)` |
| Before each test | Create `browser.newContext()` | Use `{ page }` from test args |
| Flaky test | Bump timeout to 15s | Investigate missed wait condition |
| Test data cleanup | Navigate → click → confirm | `request.delete('/api/...')` in `afterEach` |
| Test naming | Invent TC codes | Document TC codes first in `docs/*.md` |
| Describe block | `'Module — Feature'` | User's exact requirement string |
| Multi-requirement run | Multiple describe blocks | ONE describe with `test.step()` groups or separate tests |
| Selector source | Memory/guessing | Playwright MCP DOM snapshot or user codegen paste |
| Static fixture string | `env.envName === 'prod' ? 'Name A' : 'Name B'` | Named const at top: `const FRANCHISE_PROD = 'Name A'` |
| Dynamically created record name | `'My Test Property'` | `` `PAT ${Date.now()}` `` |
| Numeric retry/attempt limit | `\|\| 8` inline | `const MAX_SEARCH_ATTEMPTS = 8` at top of file |

# Playwright E2E Test Authoring — Cursor Rules

> **Purpose:** This is the single source of truth for writing, reviewing, and
> maintaining Playwright end-to-end tests in this project. Apply every rule here
> before opening a PR. Rules are ordered from most-critical to least-critical.
> Language: JavaScript (CommonJS). Test runner: `@playwright/test`.

---

## Table of Contents

1. [Repository Layout](#1-repository-layout)
2. [File Headers](#2-file-headers)
3. [Test Naming & ID Convention](#3-test-naming--id-convention)
4. [Test Structure Template](#4-test-structure-template)
5. [Timeout Rules](#5-timeout-rules)
6. [Locator Rules](#6-locator-rules)
7. [Fill & Interaction Rules](#7-fill--interaction-rules)
8. [Assertion Rules](#8-assertion-rules)
9. [Waiting & Polling Rules](#9-waiting--polling-rules)
10. [Page Object Model Rules](#10-page-object-model-rules)
11. [Shared State & Run State](#11-shared-state--run-state)
12. [Isolation & Recovery Patterns](#12-isolation--recovery-patterns)
13. [Logging Rules](#13-logging-rules)
14. [Test Data Rules](#14-test-data-rules)
15. [Environment Variables](#15-environment-variables)
16. [Shared Helper Rules](#16-shared-helper-rules)
17. [Serial Suite Rules](#17-serial-suite-rules)
18. [Forbidden Patterns](#18-forbidden-patterns)
19. [New Test Checklist](#19-new-test-checklist)
20. [New Page Object Checklist](#20-new-page-object-checklist)

---

## 1. Repository Layout

```
tests/
  e2e/
    <module>-module.spec.js     ← one spec file per product module
    helpers/
      with-timeout.js           ← global async timeout wrapper
pages/
  <module>-module.js            ← Page Object Model per module
utils/
  auth/
    login-action.js             ← shared login helper
  dynamic_address.js            ← address generation utilities
  shared-run-state.js           ← cross-suite state persistence (read/write)
  <module>-test-data.js         ← test data constants & env-var overrides
  <module>-test-helpers.js      ← extracted inline helpers (no DOM logic here)
data/
  test-data.json                ← static fallback values
```

**Rules:**

- One spec file per product module. Do not mix modules in a single spec file.
- One Page Object file per module. Never write `page.locator(...)` directly inside a spec file.
- All reusable non-DOM logic (parsers, formatters, string builders) goes in `utils/<module>-test-helpers.js`.
- All DOM-interacting reusable logic goes in the Page Object as methods.
- Test data constants and environment variable resolution go in `utils/<module>-test-data.js` only.

---

## 2. File Headers

Every `.js` file in `tests/`, `pages/`, and `utils/` must start with:

```js
// @ts-check
// <relative path from project root>
//
// <One-line description of what this file contains>
//
// <Any critical preconditions, environment notes, or usage warnings>
// Use ⚠️ for warnings that affect test correctness.
```

**Example:**

```js
// @ts-check
// tests/e2e/deal-module.spec.js
//
// Smoke Test Suite — Deal Module — Signal CRM
//
// ⚠️  Tests TC-DEAL-004 onward require the target company to exist in UAT.
//     In a full pipeline run the company created by company-module.spec.js is used.
```

---

## 3. Test Naming & ID Convention

### ID Format

```
TC-<MODULE>-<NNN>           — standard smoke / regression test (three-digit, zero-padded)
TC-<MODULE>-E2E-<NNN>       — full end-to-end flow test
TC-<MODULE>-EDIT-<NNN>      — edit-specific test
TC-<MODULE>-DEVICE-<NNN>    — hardware / device step test (if applicable)
```

**Rules:**

- `<MODULE>` is the UPPER-CASE module name: `CONTRACT`, `DEAL`, `PROPERTY`, `COMPANY`, etc.
- Always pick the **next available number** by scanning existing test titles. Never reuse or skip an ID.
- IDs are permanent. If a test is deleted, its ID is retired — never reassigned.
- For manual test mapping, append the manual ID in parentheses at the end of the title string.

### Title Format

```
TC-<MODULE>-<NNN> | <Plain English description of what is verified>
```

With manual mapping:

```
TC-<MODULE>-<NNN> | <Description>. (M-<MODULE>-<AREA>-<NNN>)
```

### Examples

```js
test("TC-DEAL-012 | Deal Name field rejects blank value and shows required validation", async () => {});
test("TC-PROPERTY-007 | Address autocomplete suggests results after 3 characters. (M-PROPERTY-ADDR-002)", async () => {});
```

---

## 4. Test Structure Template

Copy this template for every new test. Fill in every section.

```js
/**
 * TC-<MODULE>-<NNN> | <Short title — must match the test() string exactly>
 *
 * Preconditions : <What must be true in the system before this test runs>
 * Steps         :
 *   1. <User action>
 *   2. <User action>
 *   3. <User action>
 * Expected      : <Observable, verifiable outcome>
 * Priority      : P0 — Critical | P1 — High | P2 — Medium | P3 — Low
 */
test("TC-<MODULE>-<NNN> | <Title>", async () => {
  test.setTimeout(MED_TIMEOUT);           // always explicit — never rely on suite default

  const TC = "TC-<MODULE>-<NNN>";
  console.log(`[${TC}] Starting`);

  // ── Setup ──────────────────────────────────────────────────────────
  // Navigate to the correct page and establish precondition state.
  // Use page object methods only — never raw page.goto() inside a test.

  // ── Steps ──────────────────────────────────────────────────────────
  console.log(`[${TC}] Step 1: <description>`);
  // actions...

  console.log(`[${TC}] Step 2: <description>`);
  // actions...

  // ── Assertions ─────────────────────────────────────────────────────
  // All expect() calls must have an explicit timeout argument.

  console.log(`[${TC}] Complete`);
});
```

---

## 5. Timeout Rules

### Named Constants

Define these at the **top of every `test.describe` block**, never use raw numbers anywhere else in the file.

```js
const SHORT_TIMEOUT    = 5_000;    // quick visibility / attribute checks
const MED_TIMEOUT      = 10_000;   // standard DOM assertions
const LONG_TIMEOUT     = 20_000;   // navigation, modal open, page load
const NETWORK_TIMEOUT  = 15_000;   // waitForLoadState('networkidle')
const STEPPER_TIMEOUT  = 30_000;   // multi-step form submission
const SUITE_TIMEOUT    = 600_000;  // beforeAll only
```

### Rules

- Every `test()` must call `test.setTimeout(...)` as its **first line** using one of the constants above.
- `beforeAll` always uses `test.setTimeout(SUITE_TIMEOUT)`.
- `beforeEach` always uses `test.setTimeout(MED_TIMEOUT)` unless overridden by individual tests.
- All `expect(locator).toBeVisible(...)`, `expect(locator).toBeEnabled(...)`, and `expect(locator).toHaveValue(...)` must pass an explicit `{ timeout: CONSTANT }` — never rely on the global Playwright default.
- `test.setTimeout` inside a test overrides `beforeEach` for that test only — use this for long-running E2E flows.

---

## 6. Locator Rules

### Locator Priority (use the highest available)

| Priority | Strategy | Example |
|---|---|---|
| 1 | `data-testid` attribute | `page.locator('[data-testid="submit-btn"]')` |
| 2 | ARIA role + name | `page.getByRole('button', { name: 'Save' })` |
| 3 | ARIA label | `page.getByLabel('Email address')` |
| 4 | Accessible text | `page.getByText('Create Proposal', { exact: true })` |
| 5 | Placeholder | `page.getByPlaceholder('Enter name')` |
| 6 | CSS selector (stable, non-generated) | `page.locator('input[name="email"]')` |
| ❌ | Generated CSS class (e.g. `jss441`) | **NEVER** |
| ❌ | XPath ancestor traversal | **NEVER** in Page Objects |
| ❌ | `nth()` without a comment explaining why | **AVOID** |

### Rules

- **All locators live in the Page Object constructor.** Never write `page.getByRole(...)` directly in a spec file. The spec calls a POM method; the POM owns all locators.
- **Never chain more than one `.or()`** on a locator. If you need an `.or()` fallback, the locator is unstable — fix the app or request a `data-testid`.
- When `nth(index)` is required (e.g. for repeated components), add a comment explaining the ordering assumption: `// Order: NFC Tags (0), Beacons (1), QR Tags (2) — matches page render order`
- Mark unstable locators with `// HIGH-FRAGILITY: relies on [reason] — request data-testid`.
- When a locator references a `label[for="..."] + div` pattern (custom dropdown trigger), the `for` attribute value must be documented in a comment.

### Locator Scoping

Prefer **scoped** locators over global page locators when operating inside a known container:

```js
// ✅ Good — scoped to the modal
const modal = page.getByRole('dialog', { name: 'Close Deal' });
await modal.getByRole('button', { name: 'Save' }).click();

// ❌ Bad — might match the wrong Save button elsewhere on the page
await page.getByRole('button', { name: 'Save' }).click();
```

---

## 7. Fill & Interaction Rules

### Standard Fill Pattern

Use this exact sequence for every text input fill. Do not invent alternatives.

```js
async fillField(locator, value, fieldName) {
  await locator.waitFor({ state: 'visible', timeout: MED_TIMEOUT });
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.click({ clickCount: 3, force: true });   // select all
  await locator.fill(String(value));                      // replace
  await locator.press('Tab');                             // trigger blur/validation
  await this.page.waitForTimeout(200);                    // allow React reconcile

  const actual = await locator.inputValue().catch(() => '');
  if (actual.trim() !== String(value).trim()) {
    throw new Error(`[${fieldName}] Expected "${value}" but got "${actual}"`);
  }
}
```

**Rules:**

- Always `String(value)` — never pass raw numbers to `fill()`.
- Always `press('Tab')` after fill to trigger validation and blur events.
- Always verify the value after fill — never assume it was accepted.
- Never use `.type()` with a `delay` option in production tests (only for debugging locally).
- Never use `.evaluate()` DOM manipulation to set input values — if fill doesn't work, fix the locator or request a `data-testid`.
- Never use `page.keyboard.type(...)` for form inputs — use `fill()`.

### Click Rules

```js
// ✅ Standard click
await locator.click();

// ✅ When an overlay intercepts pointer events (e.g. MUI innerScrollBar)
await locator.evaluate((el) => el.click());

// ✅ Force click only when element is covered by a known overlay
await locator.click({ force: true });

// ❌ Never use force: true as a default — it hides real issues
```

### Custom Dropdown Pattern

For custom heading-level-6 dropdowns (not native `<select>`):

```js
async selectFromCustomDropdown(triggerLocator, optionText, fieldName) {
  await triggerLocator.waitFor({ state: 'visible', timeout: MED_TIMEOUT });
  await triggerLocator.scrollIntoViewIfNeeded().catch(() => {});
  await triggerLocator.evaluate((el) => el.click());   // bypass overlay

  const popper = this.page.locator('#simple-popper').last();
  const popperVisible = await popper
    .waitFor({ state: 'visible', timeout: MED_TIMEOUT })
    .then(() => true)
    .catch(() => false);

  if (!popperVisible) {
    throw new Error(`[${fieldName}] Dropdown popper did not open after click.`);
  }

  await popper.getByText(optionText, { exact: true }).click();
  await this.page.waitForTimeout(300);
}
```

---

## 8. Assertion Rules

### Always Use Explicit Timeouts

```js
// ✅ Good
await expect(locator).toBeVisible({ timeout: MED_TIMEOUT });
await expect(locator).toBeEnabled({ timeout: SHORT_TIMEOUT });
await expect(locator).toHaveValue('expected', { timeout: SHORT_TIMEOUT });
await expect(locator).toHaveAttribute('aria-selected', 'true', { timeout: SHORT_TIMEOUT });

// ❌ Bad — relies on global Playwright default (may differ per environment)
await expect(locator).toBeVisible();
```

### Soft vs Hard Assertions

- Use hard assertions (`expect`) for **required** outcomes — failure stops the test immediately.
- Use `expect.soft` only for **observational** checks where you want to log a failure but continue (e.g. checking an optional badge that may or may not appear depending on server state).
- Always add a descriptive failure message as the second argument when the assertion intent is not obvious:

```js
expect(
  hasRequiredText || isAriaInvalid,
  "Proposal Name must show a required validation indicator after blank submit."
).toBeTruthy();
```

### Negative Assertions

```js
// ✅ Always pair with explicit timeout
await expect(locator).not.toBeVisible({ timeout: SHORT_TIMEOUT });

// ✅ For URL checks after navigation
await expect(page).not.toHaveURL(/\/contract\/\d+/, { timeout: MED_TIMEOUT });
```

### URL Assertions

```js
// ✅ After navigation
await expect(page).toHaveURL(/\/app\/sales\/deals\/deal\/\d+/, { timeout: LONG_TIMEOUT });

// ✅ Checking we did NOT navigate (submission was blocked)
await expect(page).not.toHaveURL(/\/contract\/\d+/, { timeout: SHORT_TIMEOUT });
```

---

## 9. Waiting & Polling Rules

### Use the Right Waiter for the Right Purpose

| Situation | Correct Waiter |
|---|---|
| Wait for element to appear | `expect(locator).toBeVisible({ timeout })` |
| Wait for element to disappear | `expect(locator).not.toBeVisible({ timeout })` |
| Wait for navigation | `page.waitForURL(pattern, { timeout })` |
| Wait for network to settle after action | `page.waitForLoadState('networkidle', { timeout: NETWORK_TIMEOUT }).catch(() => {})` |
| Wait for a value to eventually become correct | `expect.poll(async () => ..., { timeout, intervals: [500] })` |
| Intentional visual pause (debug only) | `page.waitForTimeout(ms)` gated by `process.env.VISUAL_PAUSE_MS > 0` |

### Rules

- **Never use `page.waitForTimeout(ms)` where `ms >= 1000` to wait for DOM state.** This is a polling anti-pattern. Use `expect.poll` instead.
- `page.waitForTimeout(200)` to `page.waitForTimeout(600)` after `.click()` are acceptable micro-delays for React re-render settling — annotate with `// allow React reconcile`.
- Always `.catch(() => {})` on `waitForLoadState('networkidle')` — network-idle can time out on pages with long-polling and should never fail a test by itself.
- `expect.poll` must always specify `intervals` and `timeout`:

```js
await expect.poll(
  async () => (await locator.textContent()) ?? '',
  { intervals: [500], timeout: MED_TIMEOUT, message: 'Expected total to update after adding device.' }
).not.toBe(previousText);
```

---

## 10. Page Object Model Rules

### Constructor Rules

- Every locator must be assigned in the constructor. No locators defined inside methods.
- Group locators into labeled sections with comment blocks. Sections must appear in logical UI order (top-to-bottom, left-to-right).
- Sort locators alphabetically within each section.
- No business logic in the constructor — only locator assignments.
- The constructor accepts only `page` as its argument.

### Method Rules

- Every public method must have a JSDoc comment with `@param` and `@returns` (if non-void).
- Method names follow the pattern: `verb + Noun` — e.g. `fillProposalName`, `assertEmptyStateVisible`, `selectTimeZone`, `clickSaveAndNext`.
- `assert*` methods contain only `expect()` calls — no navigation or state mutation.
- `fill*` methods contain only input interactions — no assertions beyond value verification.
- `click*` methods contain only click interactions and immediate wait for the resulting state change.
- `select*` methods contain only dropdown/radio/checkbox selection logic.
- `goto*` methods handle navigation only.
- `detect*` methods return a state string — never throw, return `'unknown'` on failure.
- Helper methods that are not part of the public API must be prefixed with `_`.

### No Raw Spec Logic in POM

```js
// ❌ Bad — test logic inside POM
async assertAndFillProposalName(dealName) {
  await expect(this.proposalNameInput).toHaveValue(dealName);  // assertion
  await this.proposalNameInput.fill('New Name');               // mutation
  // mixing assertion + mutation violates single responsibility
}

// ✅ Good — separate methods
async assertProposalNamePrefilledWithDealName(dealName) {
  await expect(this.proposalNameInput).toHaveValue(dealName, { timeout: SHORT_TIMEOUT });
}

async fillProposalName(name) {
  // ... standard fill pattern
}
```

---

## 11. Shared State & Run State

All cross-suite state (values created in one suite that are consumed by another) must go through `utils/shared-run-state.js`:

```js
// Writing state (after creation)
writeCreatedDealName(resolvedDealName);
writeCreatedCompanyName(resolvedCompanyName);

// Reading state (at suite startup)
const sharedDealName = readCreatedDealName();
```

**Rules:**

- Never use `process.env` to pass values between test suites directly. Always go through shared-run-state helpers.
- Always provide a fallback chain: `env var → shared-run-state → hardcoded UAT default`.
- Hardcoded UAT fallback values must be defined as named constants at the top of the describe block:

```js
const DEFAULT_DEAL_NAME     = 'Regression Phase 2';
const DEFAULT_COMPANY_NAME  = 'Regression Phase 2';
const DEFAULT_PROPERTY_NAME = 'Regression Location Phase 2';
```

---

## 12. Isolation & Recovery Patterns

### withIsolatedEntity Pattern

When a test needs a **fresh entity with no prior state**, use the isolation wrapper pattern. Never mutate `resolvedXxxName` without a `try/finally` restore:

```js
async function withIsolatedDeal(fn) {
  const previousName = resolvedDealName;
  resolvedDealName = '';
  try {
    await ensureTargetDeal();
    const isolatedName = resolvedDealName;
    await fn(isolatedName);
  } finally {
    resolvedDealName = previousName || resolvedDealName;
  }
}
```

**Rules:**

- Every mutation of a `resolved*` variable must be inside a `try/finally` that restores the previous value.
- Isolation helpers must be defined once in the `test.describe` scope — never inline in individual tests.
- Always `console.log` the isolated entity name so failures are traceable:

```js
console.log(`[TC-XXX-001] Using isolated deal: "${isolatedName}"`);
```

### State-Based Recovery

When a precondition helper (`ensure*`) must navigate to a known state, it must:

1. Detect current state first (never assume).
2. Take the shortest path to the required state.
3. Have a maximum retry/iteration count (never infinite loop).
4. Throw a descriptive error if the required state cannot be reached.

```js
// ✅ Good — bounded, descriptive
for (let attempt = 0; attempt < 3; attempt += 1) {
  const state = await module.detectState();
  if (state === 'target') return;
  await transitionTo(state, 'target');
}
throw new Error(`Could not reach "target" state after 3 attempts. Last state: ${state}`);

// ❌ Bad — unbounded
while (true) {
  if (await module.isReady()) break;
  await module.navigate();
}
```

---

## 13. Logging Rules

Every test must follow this logging convention:

```js
const TC = "TC-<MODULE>-<NNN>";

console.log(`[${TC}] Starting`);
console.log(`[${TC}] Step 1: <what is happening>`);
console.log(`[${TC}] Step 2: <what is happening>`);
console.log(`[${TC}] <observation>: someValue=${value}`);   // for dynamic values
console.log(`[${TC}] Complete`);
```

**Rules:**

- The `TC` constant must always be defined as the first line of the test body.
- `[${TC}] Starting` must be the first `console.log`.
- `[${TC}] Complete` must be the last `console.log` (inside the test body, not in afterAll).
- Every `test.step` sub-block must start with a `console.log` describing what it does.
- Dynamic observation values (booleans, counts, text) must always be logged before the assertion:

```js
const isVisible = await locator.isVisible().catch(() => false);
console.log(`[${TC}] Validation indicator visible: ${isVisible}`);
expect(isVisible).toBeTruthy();
```

- POM methods may use `console.log` for debugging but must prefix with `[MethodName]`:

```js
console.log(`[fillServiceName] service ${serviceIndex}: filling with "${name}"`);
```

---

## 14. Test Data Rules

### Data Location

All test data constants live in `utils/<module>-test-data.js`. No hardcoded data in spec files except UAT fallback entity names (defined as named constants at the top of the describe block).

### Data Structure

```js
// utils/deal-test-data.js

// Override any value via environment variable.
// Fall back to data/test-data.json, then to the hardcoded default below.
const raw = (() => { try { return require('../data/test-data.json'); } catch { return {}; } })();

const DEAL_DATA = {
  dealName:    process.env.DEAL_NAME    || raw?.deal?.name    || 'Automation Deal',
  companyName: process.env.COMPANY_NAME || raw?.deal?.company || 'Regression Phase 2',
};

module.exports = { DEAL_DATA };
```

### Rules

- Never hardcode test data (names, emails, phone numbers, dates) inside spec files or POM files.
- Dynamic unique values (e.g. names that must not collide) must use a generator:

```js
generateUniqueDealName() {
  return `AutoDeal-${Date.now()}`;
}
```

- Date values used in tests must be computed relative to `new Date()` — never hardcode calendar dates.
- Phone numbers, email addresses, and addresses used in tests must be obviously fake (e.g. `test+${Date.now()}@example.com`, `+15550000001`).

---

## 15. Environment Variables

### Naming Convention

```
<MODULE>_TEST_<FIELD>       — input data for a test
CREATED_<ENTITY>_NAME       — output from a creation step (passed downstream)
<MODULE>_VISUAL_PAUSE_MS    — debug-only visual pause duration
BASE_URL                    — base URL of the application under test
```

### Resolution Pattern

Always follow this priority chain when resolving a value:

```js
const targetDealName =
  process.env.DEAL_TEST_DEAL ||         // explicit override
  process.env.CREATED_DEAL_NAME ||      // from upstream suite
  readCreatedDealName() ||              // from shared-run-state file
  DEFAULT_DEAL_NAME;                    // UAT fallback constant
```

**Rules:**

- Never throw if an env var is missing — always fall back gracefully.
- Never read `process.env` inside a Page Object. Env vars belong in spec files and test data files only.
- Document every env var used by a spec file in a comment block at the top of the file.

---

## 16. Shared Helper Rules

Helpers in `utils/<module>-test-helpers.js`:

- Must be pure functions (no DOM access, no `page` reference for non-DOM helpers).
- DOM-interacting helpers that are reused across tests must accept `page` as first argument.
- Must have a JSDoc with `@param` and `@returns`.
- Must be exported as named exports (no default export).
- Must not import from spec files. They may import from other utils files.

```js
// ✅ Good — pure utility
/**
 * Parse a currency string into a number.
 * @param {string|null} valueText
 * @returns {number|null}
 */
function parseMoneyValue(valueText) {
  if (!valueText) return null;
  const normalized = String(valueText).replace(/[^0-9.-]/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

module.exports = { parseMoneyValue };
```

---

## 17. Serial Suite Rules

All test suites use `test.describe.serial` with a single shared browser context.

### Lifecycle Rules

```js
test.describe.serial("Module Name", () => {
  // ── Named constants (timeouts, defaults) ────────────────────────────
  const SHORT_TIMEOUT = 5_000;
  // ...
  const DEFAULT_NAME = 'Regression Phase 2';

  // ── Shared mutable state ─────────────────────────────────────────────
  // Declare all describe-scoped variables here.
  let resolvedEntityName = '';
  let context, page, moduleInstance;

  // ── beforeAll — login + ensure dependencies ──────────────────────────
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(SUITE_TIMEOUT);
    context = await browser.newContext();
    page = await context.newPage();
    moduleInstance = new ModuleClass(page);
    await withTimeout(performLogin(page), 120_000, 'performLogin(beforeAll)');
    await ensureTargetEntity();
  });

  // ── afterAll — cleanup ───────────────────────────────────────────────
  test.afterAll(async () => {
    console.log('[ModuleName] afterAll: closing context');
    await context?.close();
    console.log('[ModuleName] afterAll: context closed');
  });

  // ── beforeEach — navigate to neutral state ───────────────────────────
  test.beforeEach(async ({}, testInfo) => {
    test.setTimeout(MED_TIMEOUT);
    // Skip navigation for E2E tests that manage their own state
    if (testInfo.title.includes('TC-MODULE-E2E-')) return;
    await moduleInstance.gotoListPage();
  });

  // ── Tests ────────────────────────────────────────────────────────────
});
```

**Rules:**

- `beforeAll` handles: browser context creation, login, dependency resolution.
- `beforeEach` handles: navigation to a neutral starting page. Skip for tests that manage their own navigation (use a `testInfo.title.includes(...)` guard).
- `afterAll` must close the shared context. Always log before and after.
- No `afterEach` for cleanup — serial suites rely on `beforeEach` navigation to reset state.
- Never create a new browser context inside a test — use the shared `context` from `beforeAll`.

---

## 18. Forbidden Patterns

These patterns are **never** permitted. A PR containing any of them must be rejected.

### Locators

```js
// ❌ Generated CSS class
page.locator('.jss441')
page.locator('[class*="makeStyles"]')

// ❌ Fragile XPath
page.locator('xpath=//div[3]/span[2]/input')
page.locator('xpath=ancestor::div[@class[contains(., "wrapper")]][3]')

// ❌ Positional without comment
page.locator('button').nth(4)

// ❌ Chained .or() for stability workaround
locator.or(fallback1).or(fallback2).or(fallback3)
```

### Waiting

```js
// ❌ Hard sleep for DOM state
await page.waitForTimeout(3000);  // waiting for modal to appear

// ❌ Unbounded polling loop
while (true) { ... }

// ❌ Ignoring networkidle failures non-gracefully
await page.waitForLoadState('networkidle');  // throws on long-polling pages
```

### Interactions

```js
// ❌ DOM manipulation to set values
await input.evaluate((el, v) => { el.value = v; }, value);

// ❌ type() with delay in committed code
await input.type('hello', { delay: 100 });

// ❌ Unconditional force: true
await button.click({ force: true });  // without a comment explaining why
```

### Test Logic

```js
// ❌ Raw locators in spec files
await page.getByRole('button', { name: 'Save' }).click();

// ❌ Magic number timeouts
await expect(locator).toBeVisible({ timeout: 8000 });

// ❌ Missing TC constant and logging
test("TC-DEAL-005 | ...", async () => {
  // no TC const, no console.log('[TC-DEAL-005] Starting')
});

// ❌ Missing test.setTimeout
test("TC-DEAL-006 | ...", async () => {
  // no test.setTimeout call
  await someAction();
});

// ❌ Mutating resolvedXxxName without try/finally
resolvedDealName = '';
await ensureTargetDeal();            // if this throws, resolvedDealName stays ''
resolvedDealName = previousName;     // never reached on throw
```

### Data

```js
// ❌ Hardcoded dates
await fillStartDate('03/24/2026');

// ❌ Hardcoded emails
await fillEmail('test@company.com');

// ❌ Test data inline in spec
const PAYMENT_DATA = { annualRate: '3', billingType: 'Pre Bill' };  // belongs in utils/
```

---

## 19. New Test Checklist

Before marking a new test as ready for review, confirm every item:

```
NAMING & STRUCTURE
[ ] TC ID is unique and follows TC-<MODULE>-<NNN> format
[ ] JSDoc block is complete: Preconditions, Steps, Expected, Priority
[ ] test.setTimeout() is the first line of the test body
[ ] TC constant is defined: const TC = "TC-<MODULE>-<NNN>"
[ ] console.log(`[${TC}] Starting`) is present
[ ] console.log(`[${TC}] Complete`) is present
[ ] Every major step has a console.log

LOCATORS
[ ] No raw page.getByRole/page.locator calls in spec file
[ ] All new locators added to Page Object constructor only
[ ] No generated CSS class names used
[ ] No XPath traversal used
[ ] nth() usage is commented with ordering assumption

INTERACTIONS
[ ] All fills use the standard triple-click → fill → Tab → verify pattern
[ ] No .type() with delay
[ ] No .evaluate() DOM manipulation for setting values
[ ] force: true clicks have a comment explaining the overlay

ASSERTIONS
[ ] All expect() calls have explicit timeout: CONSTANT
[ ] Descriptive failure messages on non-obvious assertions
[ ] Negative assertions use not.toBeVisible / not.toHaveURL correctly

WAITING
[ ] No waitForTimeout >= 1000 for DOM state waiting
[ ] waitForLoadState('networkidle') has .catch(() => {})
[ ] expect.poll used for eventually-consistent state checks

DATA & ISOLATION
[ ] No hardcoded dates, emails, names inline in spec
[ ] Test data sourced from utils/<module>-test-data.js
[ ] Dynamic unique values use a generator (Date.now())
[ ] Isolated entity mutations wrapped in try/finally
[ ] withIsolatedEntity pattern used where fresh state is needed

TIMEOUTS
[ ] Named timeout constants used throughout (no magic numbers)
[ ] test.setTimeout value is appropriate for test complexity
```

---

## 20. New Page Object Checklist

Before adding methods or locators to a Page Object:

```
CONSTRUCTOR
[ ] New locator added in the correct labeled section
[ ] Locator uses the highest-priority strategy available
[ ] Locator sorted alphabetically within its section
[ ] Fragile locators marked // HIGH-FRAGILITY with reason
[ ] No business logic or conditionals in constructor

METHODS
[ ] JSDoc with @param and @returns (if non-void)
[ ] Method name follows verb + Noun convention
[ ] assert* methods contain only expect() calls
[ ] fill* methods contain only input interactions
[ ] click* methods contain only click + immediate state wait
[ ] No env var reads inside POM methods
[ ] No test data hardcoded inside POM methods
[ ] Private helpers prefixed with _
[ ] console.log prefix uses [MethodName] format

GENERAL
[ ] No locators defined inside methods (must be in constructor)
[ ] No raw page.goto() inside methods (use gotoXxx() methods only)
[ ] Method is tested by at least one test case
[ ] No copy-pasted logic from spec files — extract to shared helper if reused
```

---

*Last updated: auto-generated from project audit. Update this file whenever a new pattern is established or an existing pattern is deprecated.*

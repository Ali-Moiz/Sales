---
name: playwright-test-standards
description: Standards, rules, and patterns for writing fast, reliable Playwright tests for the Sales CRM. Use this skill whenever generating, refactoring, or fixing Playwright tests (.spec.js files), Page Object Models (pages/*.js), or resolving test flakiness and timeout issues. Covers selector strategy, timeout configuration, wait patterns, assertion rules, POM conventions, test isolation, and auto-fix methodology. Do NOT use this skill for non-Playwright testing frameworks (Cypress, Jest, Selenium) or for unit tests.
---

# Playwright Test Standards — Sales CRM

Reference document for writing fast, reliable Playwright tests. Every rule here exists to prevent a specific failure mode we've hit in production test runs.

---

## 1. Core Philosophy

**Tests should fail fast, not wait forever.** Every timeout is a ceiling, not a target. A 30-second timeout does NOT mean tests take 30 seconds — it means tests fail at 30 seconds if something is wrong. If tests are slow, the fix is **smarter waits**, not **longer timeouts**.

**The single biggest cause of slow Playwright suites is AI-generated tests that stack redundant waits and bump timeouts to mask flakiness.** Do not do this.

---

## 2. Selector Strategy (NO XPATH)

**Discovering selectors?** Use the `/codegen-workflow` skill to launch Playwright's codegen inspector and record actual DOM interactions.

Use `page.locator()` as the primary approach. Fall back to `getByRole()` / `getByLabel()` only when `page.locator()` doesn't fit cleanly.

### Priority 1: `page.locator()` — Default for Everything

Use for CSS, testids, text selectors, and attribute selectors.

```javascript
// Test IDs (preferred when available)
page.locator('[data-testid="save-btn"]')
page.locator('[data-testid="service-name-input"]')

// Text-based
page.locator('text=Action')
page.locator('text="Feature Name"')      // Exact match
page.locator('text=/action/i')                 // Regex

// CSS
page.locator('.row-item')
page.locator('input[name="field"]')
page.locator('button.primary')

// Chained locators (narrowing scope)
page.locator('.service-row').locator('text=Delete')
page.locator('[data-testid="modal"]').locator('button:has-text("Confirm")')

// Filter patterns
page.locator('.row').filter({ hasText: 'Expected Name' })
page.locator('button').filter({ has: page.locator('svg.icon-action') })

// Nth element
page.locator('.service-row').first()
page.locator('.service-row').nth(2)
```

### Priority 2: `getByRole()` / `getByLabel()` — Fallback

Use when `page.locator()` would be awkward or when accessibility-based selection is clearer.

```javascript
// When form labels are stable but inputs lack testids
page.getByLabel('Input Label')
page.getByLabel('Form Field')

// When role+name is more readable than a CSS chain
page.getByRole('button', { name: 'Action Button' })
page.getByRole('tab', { name: 'Feature Tab' })
page.getByRole('dialog', { name: 'Confirmation Dialog' })
```

### Priority 3: NEVER USE XPATH

```javascript
// (FORBIDDEN) ABSOLUTELY FORBIDDEN
page.locator('xpath=//button[contains(text(), "Save")]')
page.locator('//div[@class="service"]')
```

If codegen produces XPath, convert it to one of the approved patterns. If no equivalent exists, mark with `test.fail()` and leave a TODO — do not keep the XPath.

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

## 3. Timeout Standards

### Config-level defaults (in `playwright.config.js`)

```javascript
export default {
  timeout: 30_000,              // Overall test timeout
  expect: {
    timeout: 5_000,             // Assertion timeout
  },
  use: {
    navigationTimeout: 10_000,  // Page navigation (NOT 20s)
    actionTimeout: 5_000,       // Click, fill, etc.
  },
  fullyParallel: true,          // Run tests in parallel
  retries: process.env.CI ? 2 : 0,
};
```

### Per-scenario timeout ceilings

| Scenario | Timeout | Notes |
|----------|---------|-------|
| Navigation | 10,000 ms | Reduced from legacy 20s |
| Element visibility | 5,000 ms | Default `expect` timeout |
| API response | 10,000 ms | Use `waitForResponse`, not arbitrary waits |
| Assertion | 5,000 ms | Web-first assertions auto-wait |
| Arbitrary pause (`waitForTimeout`) | **Banned** | Use event-based waits instead |

### The Timeout Rule

> **Never increase a timeout to "fix" a flaky test.** If a test times out, investigate *why*. Raising the ceiling hides bugs and multiplies suite runtime.

Acceptable reason to exceed defaults: a genuinely long-running backend operation (file upload, report generation) where you've **measured** the actual duration.

Unacceptable reason: "the test passes when I bump it to 15s" — that means the test is racing a condition you haven't made explicit. Find the real condition and wait for it.

---

## 4. Wait Strategy (The Biggest Speed Win)

### (AVOID) Avoid `networkidle`

`networkidle` waits for 500ms of no network activity. On modern apps with analytics, polling, or websockets, this rarely happens — so it waits the full timeout. The Playwright team officially discourages it.

```javascript
// (AVOID) SLOW AND FLAKY
await page.goto(url, { waitUntil: 'networkidle' });

// (PREFERRED) FAST AND RELIABLE
await page.goto(url, { waitUntil: 'domcontentloaded' });
```

### (RECOMMENDED) Use event-based waits for specific conditions

```javascript
// Waiting for an API response (BEST for API-driven UIs)
await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/services') && r.status() === 200),
  page.locator('[data-testid="save-btn"]').click(),
]);

// Waiting for an element (web-first assertion auto-waits)
await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();

// Waiting for navigation
await Promise.all([
  page.waitForURL(/\/deals\/\d+/),
  page.locator('[data-testid="create-btn"]').click(),
]);

// Waiting for a loading spinner to disappear
await expect(page.locator('[data-testid="spinner"]')).toBeHidden();
```

### (AVOID) Do NOT double-wait

Web-first assertions already retry until the timeout. Adding `waitFor()` before `expect()` doubles the wait.

```javascript
// (AVOID) REDUNDANT — waits up to 10s + 5s = 15s
await locator.waitFor({ state: 'visible', timeout: 10_000 });
await expect(locator).toBeVisible({ timeout: 5_000 });

// (PREFERRED) CLEAN — expect auto-waits up to 5s
await expect(locator).toBeVisible();
```

### (AVOID) Never use `page.waitForTimeout()`

```javascript
// (BANNED) arbitrary pause, always waits full duration
await page.waitForTimeout(3000);

// (PREFERRED) Use a condition-based wait instead
await expect(page.locator('text=Loaded')).toBeVisible();
```

Exception: **never**. If you think you need it, you've missed the real wait condition.

---

## 5. Test Isolation (Enables Parallel Execution)

For `fullyParallel: true` to work safely, every test must be independent.

### Rules

- **Each test creates its own test data.** Don't rely on data created by a previous test.
- **No shared state between tests.** Module-level variables that mutate across tests = parallelization bug.
- **Each test cleans up after itself** (or uses unique identifiers so cleanup is unnecessary).
- **Tests must pass in any order.** If test B depends on test A running first, they should be one test.

### Unique test data pattern

```javascript
test('create item', async ({ page }) => {
  const itemName = `Item-${Date.now()}`;  // Unique per run
  await featureModule.fillInput(itemName);
  await expect(page.locator(`text=${itemName}`)).toBeVisible();
});
```

---

## 6. Assertion Rules

Every test MUST have meaningful assertions. Existence checks alone are not assertions.

### (INSUFFICIENT)

```javascript
const total = await cm.getGrandTotal();
expect(total).toBeDefined();  // Passes even if total is "undefined" string
```

### (SUFFICIENT)

```javascript
const total = await cm.getGrandTotal();
expect(total).toMatch(/\$[\d,]+\.\d{2}/);                    // Validates format
expect(Number(total.replace(/[$,]/g, ''))).toBeGreaterThan(0);  // Validates value
```

### Preferred: Web-First Assertions

```javascript
await expect(page.locator('[data-testid="toast"]')).toHaveText(/saved successfully/i);
await expect(page.locator('[data-testid="total"]')).toHaveValue('$150.00');
await expect(page.locator('[data-testid="next-btn"]')).toBeEnabled();
await expect(page.locator('.service-row')).toHaveCount(3);
```

### Assertion Checklist

Every test should validate at least one of:
- A value changed to the expected value (`toHaveText`, `toHaveValue`)
- A state changed (`toBeEnabled`, `toBeChecked`, `toBeVisible`)
- A count changed (`toHaveCount`)
- A URL changed (`toHaveURL`)

---

## 7. POM (Page Object Model) Rules

### File discovery

- Pattern: `pages/{{module}}-module.js` (e.g., `pages/contract-module.js`)
- If missing, ask user before creating

### Append-only

- Never modify existing POM methods
- Never rename existing selectors
- Never delete existing code
- Only ADD new selectors and methods

### Selector definition in POM

```javascript
class FeatureModule {
  constructor(page) {
    this.page = page;
    // Locator-first, defined once, reused across methods
    this.saveButton = page.locator('[data-testid="save-btn"]');
    this.primaryInput = page.locator('[data-testid="primary-input"]');
    this.featureTab = page.getByRole('tab', { name: 'Feature' });
    // Fallback to getByRole when locator is awkward
    this.confirmDialog = page.getByRole('dialog', { name: 'Confirm Action' });
  }

  async fillInput(value) {
    await this.primaryInput.fill(value);
  }

  async clickSave() {
    await this.saveButton.click();
  }
}
```

---

## 8. Test Structure

```javascript
const { test, expect } = require('@playwright/test');
const { FeatureModule } = require('../../pages/feature-module.js');
require('dotenv').config();

test.describe('{{MODULE_NAME}} — {{REQUIREMENT_DESCRIPTION}}', () => {
  let featureModule;

  test.beforeEach(async ({ page }) => {
    featureModule = new FeatureModule(page);
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) throw new Error('BASE_URL missing from .env');

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    // TODO: implement login based on your auth flow
  });

  test('TC-{{PREFIX}}-001 | exact name from documentation', async ({ page }) => {
    await test.step('Navigate to feature', async () => {
      // Navigate to the feature under test
      await page.goto(`${baseUrl}/{{feature-path}}`);
    });

    await test.step('Perform feature action', async () => {
      // Execute the feature action
      await page.locator('[data-testid="action-btn"]').click();
    });

    await test.step('Verify expected result', async () => {
      await expect(page.locator('[data-testid="result"]')).toBeVisible();
    });
  });
});
```

### Test Naming Rule

(CRITICAL) Test names (TC codes) must be defined in documentation FIRST, never invented during test generation.

```javascript
// (INCORRECT) — TC code invented without documentation
test('TC-{{PREFIX}}-006 | some feature', async () => { /* ... */ });

// (CORRECT) — TC code comes from documentation
// After documenting: "TC-{{PREFIX}}-006 | Verify feature updates correctly..."
test('TC-{{PREFIX}}-006 | Verify feature updates correctly', async () => { /* ... */ });
```

**Workflow:**
1. Document test cases in `docs/{{module}}-test-steps.md` with TC codes
2. Document expected steps and assertions
3. Generate automation tests using the documented TC codes only
4. Skip any tests not in documentation

**Rationale:** Documentation drives test generation, not the reverse. TC codes are identifiers for documented behavior.

### (CRITICAL) Test Describe Block Title — EXACT User Requirement Match

When generating tests from a user requirement, the `test.describe()` block title **MUST be exactly the user's requirement description**, with no variations or modifications.

```javascript
// User requirement: "Verify devices quantity cannot go below 0 and cannot accept non-numeric input"

// (CORRECT) — Exactly matches user requirement
test.describe('Verify feature behavior with edge cases and validation', () => {
  test('TC-{{PREFIX}}-001 | ...', async () => { /* ... */ });
  test('TC-{{PREFIX}}-002 | ...', async () => { /* ... */ });
});

// (INCORRECT) — Does NOT match user requirement
test.describe('Validation Tests', () => { /* ... */ });
test.describe('Module — Feature', () => { /* ... */ });
test.describe('Verify feature works correctly', () => { /* ... */ });
```

**Why:** The describe block title serves as the explicit contract between user intent and test implementation. It appears in test reports and must faithfully represent what the user asked for, making test reports self-documenting.

### (CRITICAL) Mandatory Headless Mode Verification Before Delivery

All generated tests **MUST** pass in headless mode before delivery. This is a verification requirement, not optional.

**Verification checklist:**
- [ ] Tests run successfully in headless mode (default CI/CD environment)
- [ ] No tests fail or time out
- [ ] All generated tests pass ({{N}} total)
- [ ] Exit code = 0 (success)

```bash
# Mandatory verification before delivery
npm run test:uat:{{module}} -- --grep "TC-{{PREFIX}}" --reporter=list

# Must output: "X passed" with exit code 0
```

**If any test fails in headless mode:**
1. Do NOT deliver
2. Run Phase 8 auto-fix (max 3 attempts per failing test)
3. Re-verify in headless mode
4. Only then deliver

### Key patterns

- **Use `{ page }` from test context** — don't create `browser.newContext()` manually; Playwright handles isolation
- **Use `test.step()` for logical sections** — better than `console.log`, shows in trace viewer
- **Screenshots and traces belong in `playwright.config.js`**, not in `afterEach`:
  ```javascript
  // playwright.config.js
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  }
  ```

---

## 9. Environment Safety

- All credentials, URLs, and secrets come from `.env` (loaded via `dotenv`)
- Never hardcode `BASE_URL`, usernames, passwords, API keys
- Validate env vars at test setup:
  ```javascript
  const baseUrl = process.env.BASE_URL;
  if (!baseUrl) throw new Error('BASE_URL missing from .env');
  ```

---

## 10. Auto-Fix Methodology

When a test fails, **investigate before mutating**. The fix priority has changed from the legacy approach.

### Attempt 1: Selector Investigation

- Is the element actually in the DOM when the selector runs?
- Try alternatives in order: `[data-testid]` → CSS → `text=` → `getByLabel` → `getByRole`
- Inspect live DOM via headed mode if MCP available

### Attempt 2: Root-Cause Wait Investigation (NOT timeout bumps)

Before touching timeouts, check:
- Is there an API response the test should wait for? → Add `page.waitForResponse()`
- Is there a loading spinner the test ignores? → Wait for it to disappear
- Is the element inside a modal/drawer that animates in? → Wait for the container first
- Is there a race condition with form validation? → Wait for the button to be enabled

**Only if investigation reveals a genuinely slow backend operation** (measured, not guessed) may timeouts be increased — and even then, target the specific assertion, not the test-level timeout.

### Attempt 3: Logic & Import Fixes

- Missing imports
- Undeclared variables
- Missing `await` keywords
- Typos in method/variable names

### Attempt 4 (only if 1–3 fail): Mark as Unresolvable

```javascript
test('TC-{{PREFIX}}-005 | feature description', async () => {
  test.fail();
  // TODO: Selector [data-testid="element"] not found in DOM
  // Expected behavior: element appears after precondition
  // Tried: testid, text=, getByRole
  // Recommendation: Run in headed mode to inspect live DOM
});
```

---

## 11. Hard Constraints Summary

| Constraint | Detail | Consequence |
|---|---|---|
| **NO XPATH** | Zero tolerance. Use `page.locator()` or `getByRole`/`getByLabel`. | Unresolvable → `test.fail()` + TODO |
| **NO `waitForTimeout`** | Arbitrary pauses banned. Use event-based waits. | Refactor required |
| **NO `networkidle`** | Use `domcontentloaded` + explicit waits. | Refactor required |
| **NO DOUBLE-WAITS** | `waitFor()` + `expect()` is redundant. | Remove the `waitFor()` |
| **NO TIMEOUT BUMPS** | Don't raise timeouts to fix flakiness. | Must investigate root cause |
| **NO HARDCODED ENV** | All URLs/credentials from `.env`. | Test fails with clear error |
| **NO SHARED STATE** | Tests must pass in any order, run in parallel. | Breaks `fullyParallel` |
| **ASSERTIONS REQUIRED** | `toBeDefined()` alone is insufficient. | Pair with value/format checks |
| **POM APPEND-ONLY** | Never modify existing POM code. | Only add new methods |
| **TEST NAMES FROM DOCS** | TC codes must exist in `docs/*.md` before automation. Never invent TC codes. | Tests not in docs are skipped |

---

## 12. Quick Reference — Good vs Bad Patterns

| Situation | (Avoid) | (Preferred) |
|-----------|---------|-------|
| Page load | `waitUntil: 'networkidle'` | `waitUntil: 'domcontentloaded'` |
| Wait for element | `waitForTimeout(3000)` | `await expect(el).toBeVisible()` |
| Wait for API | `waitForTimeout(2000)` | `waitForResponse(r => r.url().includes('/api/'))` |
| Select button | `xpath=//button[text()="Save"]` | `page.locator('[data-testid="save"]')` |
| Select by label | `page.locator('input').nth(3)` | `page.getByLabel('Email')` |
| Assert existence | `expect(val).toBeDefined()` | `expect(val).toMatch(/regex/)` |
| Before each test | Create `browser.newContext()` manually | Use `{ page }` from test args |
| Flaky test | Bump timeout to 15s | Investigate the missed wait condition |
| Test naming | Invent TC codes during generation | Document TC codes first in docs/*.md |

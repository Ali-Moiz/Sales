---
name: playwright-test-standards
description: Authoritative standards for writing fast, reliable Playwright tests for the Sales CRM. Use whenever generating new Playwright tests (.spec.js), creating or appending Page Object Models (pages/*.js), or fixing a failing/flaky test. Covers selector strategy, timeouts, wait patterns, assertion rules, POM conventions, test structure for multi-requirement describe blocks, codegen handoff via Playwright MCP, and bounded auto-fix methodology. Do NOT use for Cypress, Jest, Selenium, or unit tests.
---

# Playwright Test Standards — Sales CRM

Single source of truth. If the `tests-generator` agent contradicts this file, **this file wins**.

---

## 1. Core Philosophy

- **Fail fast, not wait forever.** 30s timeout is a ceiling, not a target.
- **No redundant waits or timeout bumps to mask flakiness.**
- **Multiple requirements → ONE `test.describe()` → describe title = short summary → each requirement string in `test()`/`test.step()` title or `//` comment.**

---

## 2. Selector Strategy

Priority order — **NO XPATH ever** (convert or `test.fail()` + TODO):

| Priority | Method                   | Example                                                                  |
| -------- | ------------------------ | ------------------------------------------------------------------------ |
| 1        | `[data-testid]`          | `page.locator('[data-testid="save-btn"]')`                               |
| 2        | CSS/class                | `page.locator('.row-item')`, `page.locator('input[name="field"]')`       |
| 3        | Text                     | `page.locator('text=Action')`, `page.locator('text="Exact"')`            |
| 4        | Chained/filtered         | `page.locator('.row').filter({ hasText: 'Name' })`                       |
| 5        | `getByLabel`/`getByRole` | `page.getByLabel('Email')`, `page.getByRole('button', { name: 'Save' })` |

Every selector must be verified via Playwright MCP DOM inspection or user codegen paste — never fabricated from memory.

**Named tabpanels over positional `.first()`/`.nth()`:** When scoping locators to a tabpanel, always use `getByRole('tabpanel', { name: /Activities/i })` (or the appropriate tab name) instead of `getByRole('tabpanel').first()`. Symptom: locator times out because `.first()` resolves to a different tabpanel (e.g., "Contract & Terms") that does not contain the target element. Root cause: DOM order of tabpanels is not guaranteed to match the visually active tab. The existing `activityCardCount()` in property-module.js (line 4531) demonstrates the correct pattern.

**MUI Popper/Tooltip elements:** Use `#simple-popper` (id only) — never `#simple-popper[role="tooltip"]`. The `role="tooltip"` attribute is not reliably present on MUI Popper elements and causes locator timeouts. The working pattern in `getCreateIndustryOptions()` confirms `#simple-popper` alone is sufficient.

**MUI custom dropdowns (no native `<select>`):** `force: true` click on the container div does NOT trigger React synthetic event handlers -- the DOM click bypasses React's event system. Use `openCreateIndustryDropdown()` which walks the React fiber tree to find and invoke the `onClick` handler programmatically. Never add new direct `.click({ force: true })` calls to open MUI custom dropdowns; always use the POM's dedicated opener method.

**Drawer/modal close icons (`<a href="#">`):** Never use `force: true` on close/dismiss icon clicks. When an input field is focused, `force: true` bypasses the normal focus/blur sequencing and prevents the React `onClick` handler from firing -- the drawer stays open. Symptom: `expect(heading).not.toBeVisible()` times out after clicking the close icon. Root cause: `force: true` dispatches the click without triggering the blur on the focused input, which the MUI drawer's React handler depends on. Fix: use a normal `.click()` (no `force` flag). Also remove `.catch(() => {})` on the subsequent `waitFor({ state: "hidden" })` so failures surface immediately.

**Filter trigger locators with dynamic text:** When a custom dropdown filter (h6 trigger) changes its displayed text to the active filter value (e.g., "Type" becomes "Email"), the locator must match ALL possible values, not just the default label. Symptom: `locator('h6').filter({ hasText: /^Type$/ })` times out after a filter is applied. Root cause: the h6 text reflects the selected value, not the original label. Fix: use a regex alternation matching the default label plus all option values — e.g., `/^(Type|All|To-do|Email|Call|LinkedIn)$/`.

---

## 3. Timeouts

| Scenario                       | Limit      | Notes                          |
| ------------------------------ | ---------- | ------------------------------ |
| Navigation                     | 10s        |                                |
| Element visibility / assertion | 5s         | Web-first assertions auto-wait |
| API response                   | 10s        | Use `waitForResponse`          |
| Arbitrary pause                | **Banned** | Find the real wait condition   |

**Never increase a timeout to fix flakiness.** Only acceptable for measured slow backend ops, targeted to the specific assertion.

---

## 4. Wait Strategy

**Use `domcontentloaded`** not `networkidle`. Use event-based waits:

```javascript
// API wait — Promise.all with click
await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/x") && r.status() === 200),
  saveButton.click(),
]);
// Element wait — web-first assertion (auto-waits)
await expect(locator).toBeVisible();
// Navigation wait
await Promise.all([page.waitForURL(/\/deals\/\d+/), createBtn.click()]);
```

**Banned patterns:**

- `page.waitForTimeout()` — always wrong
- `networkidle` — unreliable with analytics/polling
- Double-wait: `waitFor()` + `expect()` is redundant — use only `expect()`
- `.count()` without prior web-first assertion (resolves immediately, doesn't wait)
- `.isVisible()` for assertion logic (resolves immediately, doesn't wait) — use `await expect(locator).toBeVisible()` or `locator.or(other).toBeVisible()` instead. Symptom: `isVisible()` returns `false` even though the element appears moments later. Root cause: `isVisible()` is a snapshot check, not a web-first assertion.

**Unlabelled inputs:** scope to nearest named ancestor, then select by position. Don't guess accessible names.

**Scrollable drawers:** always `scrollIntoViewIfNeeded()` before clicking elements below the fold — `toBeVisible()` doesn't mean "in viewport".

**Animation-aware:** for MUI drawers/modals, wait for settled state (`toBeVisible()` + `toHaveAttribute('aria-hidden', 'false')` if needed).

**Table data readiness:** Before reading cell text from a data grid, wait for pagination to show a non-zero total (e.g., `waitForTableData()`). Symptom: `getFirstRowCellText()` returns empty string. Root cause: table DOM skeleton renders before the API response arrives, so rows are "attached" but contain no text. Rule: always call `await module.waitForTableData()` before `getFirstRowCellText()` or similar cell-reading methods.

**Search-then-find race condition:** When polling for a search term in a table, do not accept "term is visible" as proof the search completed — the term may already be visible in the unfiltered table. Symptom: `waitFor` on filtered row times out even though the row was visible moments earlier. Root cause: poll returns early on pre-search content, then the search API response re-renders the table and the row disappears during reload. Rule: require pagination text to have changed (confirming API response) before accepting a text-match as search completion.

---

## 5. Test Isolation & Data

- Each test creates its own data, cleans up after itself, passes in any order.
- Unique data: `` `Item-${Date.now()}-${Math.random().toString(36).slice(2,7)}` ``
- Prefer API cleanup (`request.delete()`) over UI cleanup.
- **Created records use `PAT {timestamp}` pattern:** `` `PAT ${Date.now()}` ``

---

## 6. Test Data Rules

`process.env.*` is for **secrets, CI toggles, cross-suite handoff** only. Everything else → named constants at file top.

| Belongs in `process.env`                      | Belongs in constants                   |
| --------------------------------------------- | -------------------------------------- |
| Passwords, API tokens                         | User names, franchise labels           |
| `CI`, `HEADLESS`                              | Search strings, assignee labels        |
| Cross-suite state (via `shared-run-state.js`) | Numeric limits (`MAX_SEARCH_ATTEMPTS`) |

**Cross-suite handoff:** use `readCreated*()` / `writeCreated*()` from `utils/shared-run-state.js` — never `process.env` writes or hardcoded paths/IDs.

**Dates:** compute at runtime from `new Date()` — never hardcode calendar dates.

**Constants naming:** `DOMAIN_FIELD_ENV` pattern (e.g., `FRANCHISE_PROD`). No magic numbers.

---

## 7. Assertion Rules

Every test MUST have meaningful assertions. `toBeDefined()` alone is insufficient.

**Critical assertion points** (assert only when one of these is true):

| Condition                 | Assertion type                                 |
| ------------------------- | ---------------------------------------------- |
| Server state changes      | `waitForResponse` + `toHaveText`/`toHaveCount` |
| URL changes               | `toHaveURL(...)`                               |
| Calculated value updates  | `toHaveText`/`toHaveValue` with exact value    |
| Modal/drawer opens/closes | `toBeVisible`/`toBeHidden`                     |
| Form validation triggers  | `toHaveText` on error message                  |
| Enabled/disabled changes  | `toBeEnabled`/`toBeDisabled`                   |

**Targets:** 3-6 assertions per test, 2-4 per `test.step()` group. If a step matches none of the above, don't assert it.

**Grid filter assertions — sibling-row tolerance:** When asserting that a grid filter (e.g., city) returns only matching rows, the backend may include sibling rows (same parent entity, different field value in the same state/category). Use a majority-match assertion (`matchCount / total >= 0.8`) plus `toContain(expected)` instead of strict `toBe` on every row. Symptom: `expect(val).toBe("Omaha")` fails with `"Kearney"` — both Nebraska cities from the same company. Root cause: backend returns all rows for a matching company, not just the matching city row.

---

## 8. POM Rules

- File pattern: `pages/{{module}}-module.js` (inferred from spec path).
- If missing, ask user before creating.
- **Append-only:** never modify/rename/delete existing code. Only ADD new selectors and methods.
- Exception: if Phase 8 auto-fix finds a stale selector, add a new method alongside (e.g., `clickSaveV2`) with `// TODO: deprecated` on the old one.
- Selectors in constructor, waits encapsulated in methods.

---

## 9. Test Structure

### 9.1 Single Session Pattern (MANDATORY)

All tests in a spec file MUST run in a single browser window and single session. Never create separate browser contexts per sub-describe.

**Main `test.describe` must contain:**

- `let sharedPage; let companyModule;` (or equivalent module variable)
- `test.beforeAll` — creates ONE context, ONE page, logs in ONCE, instantiates the Page Object
- `test.beforeEach` — navigates to the module's listing page (state reset before every test)
- `test.afterAll` — closes the context

**Sub-describes must NOT:**

- Declare their own `let sharedPage` / `let companyModule`
- Create new browser contexts (`browser.newContext()`)
- Duplicate login or page creation
- Have their own `afterAll` to close context

**Sub-describes that need extra setup** (e.g., open a detail page, switch to a tab) use their own `beforeEach` for ONLY the additional navigation — the parent `beforeEach` handles the base navigation.

```javascript
test.describe("Module E2E Tests", () => {
  let sharedPage;
  let module;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    await performLogin(sharedPage);
    module = new MyModule(sharedPage);
  });

  test.beforeEach(async () => {
    await sharedPage.goto(`${env.baseUrl}/app/sales/module`, {
      waitUntil: "domcontentloaded",
    });
    await module.assertPageOpened();
  });

  test.afterAll(async () => {
    await sharedPage.context().close();
  });

  // Sub-describe with no extra hooks — inherits parent beforeEach
  test.describe("Listing Tests", () => {
    test("TC-001 | ...", async () => {
      /* starts on listing page */
    });
  });

  // Sub-describe with extra setup
  test.describe("Detail Page Tests", () => {
    test.beforeEach(async () => {
      // Parent beforeEach already navigated to listing — just open detail
      await module.openFirstItemFromList();
      await module.assertDetailOpened();
    });

    test("TC-050 | ...", async () => {
      /* starts on detail page */
    });
  });
});
```

**Exception:** Access-control tests that require a DIFFERENT user role may create a separate context within the test body, but must close it before the test ends.

### 9.2 Multi-requirement decision

```
Do requirements share setup and continuous UI flow?
  YES → one test() with test.step() per requirement
  NO  → separate test() blocks inside same describe()
```

### 9.3 Describe title rule

**Always a short summary** — never requirement strings. Include TC range if known.

```javascript
// CORRECT
test.describe("Contract Service Management — TC-001, TC-002", () => {});
// INCORRECT
test.describe("Verify deleting a service updates totals", () => {});
```

### 9.4 TC code naming

- TC codes written to `docs/{{module}}-test-steps.md` in Phase 3, before test generation.
- Never invent TC codes at test-write time.
- **TC names (part after `|`) = user's EXACT requirement text** — never shortened or paraphrased.
- User edits during doc-review pause are source of truth.

### 9.5 Tags

- `@smoke` — happy path
- `@regression` — edge cases
- `@critical` — blocking business flows

### 9.6 Key patterns

- Use `test.step()` for logical sections.
- Screenshots/traces in `playwright.config.js`, not `afterEach`.
- Do NOT add per-test `goto` to the module listing page — the parent `beforeEach` handles it.

---

## 10. Environment Safety

All URLs/secrets from `.env` via `utils/env.js`. Never hardcode `BASE_URL`, credentials, or API keys.

---

## 11. Playwright MCP (REQUIRED)

The agent uses Playwright MCP for selector discovery (Phase 0), DOM inspection, and headless execution (Phase 7). If not connected, halt at Phase 0.

**Must NOT:** fabricate selectors from memory, skip MCP execution in Phase 7.

---

## 12. Auto-Fix Methodology

Hard cap: **2 attempts per failing test.** Prioritize CLI error output over MCP exploration.

### Execution rule

Always run tests via **CLI** (`npx playwright test --grep "TC-CODE"` via Bash tool). Never use MCP browser to execute tests — CLI output is compact and token-efficient.

### Escalation

```
Attempt 1 — Read CLI error output. Fix based on error message alone (selector typo, missing await, wrong locator, assertion mismatch).
  Re-run via CLI.
  ↓ still failing?
Attempt 2 — Use MCP DOM snapshot ONLY on the specific failing element/area (not full page). Fix selector or wait.
  Re-run via CLI.
  ↓ still failing?
Auto-mark test.fail() with TODO. No further attempts.
```

### MCP budget

- **Phase 0 (discovery):** MCP snapshots allowed freely — this is where selectors are found.
- **Phase 7 (execution):** CLI only. No MCP.
- **Phase 8 (auto-fix):** MCP allowed only in attempt 2, scoped to the failing element's container — never full-page snapshots.

**test.fail() TODO format:**

```javascript
test("TC-X-002 | ...", async () => {
  test.fail();
  // TODO: Unresolved after 2 auto-fix attempts
  // Attempt 1: ...
  // Attempt 2: ...
  // Hypothesis: ...
  // Recommendation: HEADLESS=false npx playwright test <file> --debug
});
```

**Never bump timeouts to fix flakiness.** Investigate root cause.

---

## 13. Hard Constraints

| Constraint                                | Detail                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| **NO XPATH**                              | `page.locator()` or `getByRole`/`getByLabel`. Unresolvable → `test.fail()` |
| **NO `waitForTimeout`**                   | Use event-based waits                                                      |
| **NO `networkidle`**                      | Use `domcontentloaded` + explicit waits                                    |
| **NO DOUBLE-WAITS**                       | `expect()` auto-waits; remove redundant `waitFor()`                        |
| **NO TIMEOUT BUMPS**                      | Investigate root cause                                                     |
| **NO HARDCODED ENV**                      | URLs/credentials from `.env` only                                          |
| **NO SHARED STATE**                       | Tests pass in any order                                                    |
| **NO INVENTED TC CODES**                  | From docs only                                                             |
| **NO FABRICATED SELECTORS**               | Verify via MCP or codegen paste                                            |
| **ASSERTIONS REQUIRED**                   | Match critical-point conditions (§7)                                       |
| **DESCRIBE = SHORT SUMMARY**              | Never requirement strings                                                  |
| **TC NAMES = EXACT TEXT**                 | User's exact requirement string, never paraphrased                         |
| **POM APPEND-ONLY**                       | Only add new methods                                                       |
| **ONE DESCRIBE PER RUN**                  | All requirements share one describe                                        |
| **2 ATTEMPTS → test.fail()**              | Cap at 2 total, no user pause                                              |
| **CLI FOR EXECUTION**                     | `npx playwright test` via Bash, never MCP browser                          |
| **MCP = DISCOVERY ONLY**                  | Snapshots in Phase 0 + attempt 2 fix only                                  |
| **NO `process.env` FOR TEST DATA**        | Named constants at file top                                                |
| **NO HARDCODED DATES**                    | Compute from `new Date()`                                                  |
| **`PAT {timestamp}` FOR RECORDS**         | Test-created records identifiable                                          |
| **CROSS-SUITE VIA `shared-run-state.js`** | Never hardcoded paths/IDs                                                  |

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

**MUI Switch toggles (hidden input vs. visible wrapper):** Never click `input[name="..."]` with `force: true` on MUI Switch components -- the hidden `<input>` does not reliably update its `checked` property because `force: true` bypasses React's synthetic event system. Symptom: `expect(locator).toBeChecked()` fails with "unchecked" even though the switch visually toggled on. Root cause: MUI Switch renders a hidden `<input type="checkbox">` (role=checkbox) inside a visible `<span>` wrapper with `cursor:pointer`; clicking the `<input>` directly (even without `force`) dispatches a native DOM event that React ignores — only clicking the parent `<span>` triggers the React synthetic event and updates state. Fix: store the hidden input as `switchLocator` (for `isChecked()` / `toBeChecked()` assertions) but **click its parent**: `await switchLocator.locator('..').click()`. In the `toggleMuiSwitchOn()` POM helper, the click line must be `await switchLocator.locator('..').click()`, not `await switchLocator.click()`. Use `toggleMuiSwitchOn()` for idempotent toggling — it reads `isChecked()` on the input, then fires the click on the parent span.

**`page.evaluate()` clicks bypass React — never use for UI interactions:** Using `page.evaluate(() => el.click())` dispatches a native DOM click that React's synthetic event system does not register. Symptom: the React component that should render after a click (e.g., "Service 2" form) never appears — the DOM click fires but React state never updates. Root cause: React attaches synthetic event listeners at the root, not on individual DOM nodes; a raw `el.click()` in `evaluate()` triggers native DOM bubbling but not the React synthetic event path. Rule: always use Playwright's `locator.click()` for any interaction that must update React state. Never use `page.evaluate()` to click buttons or links. **Locating the target:** when the clickable element has no unique accessible name (e.g., an icon-only MuiButton), scope from a nearby labelled element using `locator('..')` to reach the direct parent, then `.locator('button').first()`. Example: `this.addAnotherServiceHeading.locator('..').locator('button').first()` — live-verified 2026-05-07 to resolve to exactly the one "+" button in the "Add another service" card. Avoid `div.filter({ has: heading }).locator('button')` when the heading has many ancestor divs — it resolves to unrelated buttons higher in the DOM tree.

**Duplicate DOM IDs in repeating forms — scope by container, not by accessible name:** When a multi-service (or any repeating) form renders multiple instances of the same field, the app may assign the same `id=` to each instance. The browser's `<label for="id">` association only binds to the *first* element with that ID, so all later instances have no accessible name. Symptom: `getByRole('spinbutton', { name: /Officer|Guard/ }).nth(1)` times out — Playwright finds zero matches for nth(1) because the second spinbutton's accessible name is empty. Root cause: duplicate `id="reqOfficers"` — the label resolves only to the first input. Rule: scope spinbutton (and all field) locators to the per-instance container, not globally by accessible name. Use a named anchor element that is unique to each instance (e.g., `label[for='officerType'] + div` which the existing code already scopes via `.nth(serviceIndex)`), walk up to the shared container via chained `.locator('..')` calls (verify depth via MCP DOM inspection), then locate the field by `name=` attribute. Example in `_serviceContainer(serviceIndex)`: `page.locator("label[for='officerType'] + div").nth(serviceIndex).locator('..').locator('..').locator('..').locator('..').locator('..')` — live-verified 2026-05-07 to resolve to one `input[name="reqOfficers"]` per service. Never assume `getByRole` accessible-name matching works in repeating forms with shared IDs.

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
- `.isEnabled()` as a gate before navigation (resolves immediately, doesn't wait) — use `await expect(locator).toBeEnabled()` instead. Symptom: `isEnabled()` returns `false` because React state hasn't updated yet after a prior interaction (e.g., adding device quantity), causing fallback logic to execute and fail silently. Root cause: same as `.isVisible()` — snapshot check, not a web-first assertion.

**Unlabelled inputs:** scope to nearest named ancestor, then select by position. Don't guess accessible names.

**Scrollable drawers:** always `scrollIntoViewIfNeeded()` before clicking elements below the fold — `toBeVisible()` doesn't mean "in viewport".

**Table cell click below viewport fold:** When clicking a deal/row cell in a long table, the target cell may be below the viewport even though `expect(dealRow).toBeVisible()` passes (the row's top edge is in view). Symptom: `locator.click: Element is not visible` with `force: true` on `td.nth(1)`. Root cause: `toBeVisible()` confirms the element is attached and has non-zero size, not that it is within the scrollable viewport — and `force: true` does not scroll the element into view if it is outside the clip rect. The prior `isVisible()` snapshot check (banned per §4) also returns `true` immediately without waiting, masking the real state. Rule: after `expect(dealRow).toBeVisible()`, call `await dealNameCell.scrollIntoViewIfNeeded()` then `await dealNameCell.click()` (no `force`). Never combine `isVisible().catch(() => false)` with `click({ force: true })` as a click strategy — use `scrollIntoViewIfNeeded()` instead.

**Animation-aware:** for MUI drawers/modals, wait for settled state (`toBeVisible()` + `toHaveAttribute('aria-hidden', 'false')` if needed).

**Table data readiness:** Before reading cell text from a data grid, wait for pagination to show a non-zero total (e.g., `waitForTableData()`). Symptom: `getFirstRowCellText()` returns empty string. Root cause: table DOM skeleton renders before the API response arrives, so rows are "attached" but contain no text. Rule: always call `await module.waitForTableData()` before `getFirstRowCellText()` or similar cell-reading methods.

**Drawer survival after blocked submit:** Never assume a form drawer survives a submit click just because `expect(heading).toBeVisible()` passes immediately after the click — the drawer may still be visible while the server processes the request and then closes. Symptom: `TimeoutError: page.waitForURL` in the step after "re-fill and resubmit", because the drawer closed mid-flow (server accepted the invalid data silently, or rejected server-side and dismissed the drawer). Root cause: `expect(heading).toBeVisible()` confirms the drawer was visible at that instant but does not confirm submission was blocked. Rule: after clicking submit with potentially-invalid data, first use `page.waitForURL(/target/, { timeout: 6_000 }).then(() => true).catch(() => false)` to detect whether the app navigated to the success URL; if it did, the app has no client-side validation — handle that branch separately. Only then use `waitFor({ state: 'visible' })` (not `.isVisible()` snapshot) to check whether the drawer remained open. Example: `const navigated = await page.waitForURL(/\/contract\/\d+/, { timeout: 6_000 }).then(() => true).catch(() => false); if (navigated) { /* silently accepted */ return; } const drawerOpen = await drawer.waitFor({ state: 'visible', timeout: 4_000 }).then(() => true).catch(() => false);`

**Search-then-find race condition:** When polling for a search term in a table, do not accept "term is visible" as proof the search completed — the term may already be visible in the unfiltered table. Symptom: `waitFor` on filtered row times out even though the row was visible moments earlier. Root cause: poll returns early on pre-search content, then the search API response re-renders the table and the row disappears during reload. Rule: require pagination text to have changed (confirming API response) before accepting a text-match as search completion.

**`waitForLoadState('domcontentloaded')` is a no-op on SPA navigation:** After a React Router client-side navigation (pushState), `waitForLoadState('domcontentloaded')` resolves in ~2ms because the page is already loaded — it does NOT wait for the URL to change. Symptom: `expect(page).toHaveURL(/\/deals\/deal\/\d+/)` fails with the old deals-list URL, even though the click completed without error. Root cause: `waitForLoadState` is event-based on page lifecycle events; SPA navigation emits no `domcontentloaded` event. Rule: for any click that triggers a React Router URL change, use `Promise.all([page.waitForURL(/pattern/), locator.click()])` instead. Never follow a navigation-triggering click with `waitForLoadState('domcontentloaded')` alone when the app is a SPA. Example: `await Promise.all([page.waitForURL(/\/deals\/deal\/\d+/, { timeout: 20_000 }), dealNameCell.click()]);`

---

## 5. Test Isolation & Data

- Each test creates its own data, cleans up after itself, passes in any order.
- Unique data: `` `Item-${Date.now()}-${Math.random().toString(36).slice(2,7)}` ``
- Prefer API cleanup (`request.delete()`) over UI cleanup.
- **Created records use `PAT {timestamp}` pattern:** `` `PAT ${Date.now()}` ``
- **Shared-deal state guard (Contract & Terms):** Any test that opens the shared deal and either calls `openCreateProposalDrawer()` OR asserts empty state (e.g., `assertEmptyStateVisible()`) MUST first call `detectContractState()` and delete any existing proposal before proceeding. Symptom: `expect(locator).toBeVisible()` on `getByRole('heading', { name: 'Create a Proposal', level: 2 })` times out — the empty-state heading never renders because a prior run left a proposal card on the shared deal. Root cause: `ensureContractTargetDeal()` only guarantees an empty deal at suite startup; a previous run that created (but did not fully clean up) a proposal on the shared deal puts it in a non-empty state for the next run. Fix: `const state = await contractModule.detectContractState(MED_TIMEOUT); if (state === "proposal") { await contractModule.deleteExistingProposal(); }` before any empty-state assertion or `openCreateProposalDrawer()`. Tests that use `withIsolatedDeal()` or `openIsolatedCreateProposalDrawer()` are already safe — the guard is only needed for tests that open the shared deal directly.
- **Proposal card actions use `aria-label`, not text nodes:** The Edit, Clone, Preview PDF, and Delete action icons on a proposal card are `<div aria-label="...">` elements with SVG children and empty text content. Symptom: `detectContractState()` always returns `"unknown"` even when a card is present; `deleteExistingProposal()` times out waiting for a `getByText('Delete')` locator that never matches. Root cause: `getByText('Delete', { exact: true })` matches DOM text nodes only — it does not match `aria-label` attributes. Fix: use CSS attribute selectors (`locator('[aria-label="Delete"]')`, `locator('[aria-label="Edit"]')` etc.) scoped to `contractTermsTabpanel`. These are the `*ByAriaLabel` locators added to `ContractModule` on 2026-05-07. Never use `getByText` on icon-only action buttons — always inspect DOM to confirm whether the accessible name comes from a text node or an attribute.

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

**Avoid spaces in dynamic form input data:** Some MUI controlled inputs (e.g., the contract Line Item `#title` field) drop everything typed after a space when filled via `pressSequentially`. Symptom: post-save assertion times out because the saved value is truncated (e.g., test typed `PAT 1778144327694`, card rendered `PAT`). Root cause: pressSequentially issues real key events; the form's React handler treats the space as a commit/blur trigger and rejects subsequent keystrokes. Rule: for dynamic test data fed into pressSequentially-driven inputs, use no-space identifiers — `LineItem${Date.now()}` or `PAT-${Date.now()}`, not `PAT ${Date.now()}`. Helpers that wrap `pressSequentially` on text inputs must verify `inputValue()` matches the expected text **before** clicking Save and throw a descriptive error if not — fail fast beats a vague "card not visible" timeout.

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

---

## 14. Sub-Describe Navigation Reset

- **Symptom:** `element(s) not found` on a stepper/wizard element in the second or later test of a `test.describe.serial` block — even though the first test passed after calling `ensureOnStepper()` or `goToStep()`.
- **Root cause:** The parent `test.beforeEach` navigates to the listing page before every test (including those inside the sub-describe). Subsequent tests in the sub-describe that do NOT call `ensureOnStepper()` or `goToStep()` run against the listing page, where the wizard elements don't exist.
- **Rule:** Every sub-describe that requires a specific page (e.g., a wizard stepper) MUST declare its own `test.beforeEach` that navigates to that page — not rely on the first test in the block having done so. The first test's navigation does not persist to later tests because the parent `beforeEach` resets state between each one.

```javascript
// CORRECT — sub-describe owns its navigation
test.describe.serial("Step 1 — Services", () => {
  test.beforeEach(async () => {
    await ensureOnStepper(); // re-lands on stepper after parent beforeEach reset
    currentWizardStep = 1;
  });
  test("TC-012 | ...", async () => { /* wizard is open */ });
  test("TC-013 | ...", async () => { /* wizard is open */ });
});

// WRONG — only TC-012 calls ensureOnStepper(); TC-013 runs on the listing page
test.describe.serial("Step 1 — Services", () => {
  test("TC-012 | ...", async () => { await ensureOnStepper(); /* ... */ });
  test("TC-013 | ...", async () => { /* radio not found — on listing page! */ });
});
```

**Variant — freestanding tests after a sub-describe block close:** The same reset applies to `test()` blocks placed directly inside a parent `test.describe.serial` after a child sub-describe ends. These freestanding tests have no sub-describe `beforeEach` to re-navigate, so the parent `beforeEach` (which goes to the listing page) is the only hook that fires — leaving the test on the wrong page. Symptom: `element(s) not found` on a detail-page element (e.g., `Publish Contract` button) even though the immediately preceding sub-describe test (TC-CONTRACT-071) landed on the correct page after `clickFinish()`. Root cause: the parent `beforeEach` fires between TC-CONTRACT-071 and TC-CONTRACT-072 and navigates to `/deals`, wiping the post-wizard deal-detail URL. Rule: wrap freestanding post-phase tests in their own `test.describe.serial` with a `beforeEach` that navigates to the required page. Derive the deal detail URL from `wizardStepperUrl` by stripping the `/contract/:id` suffix:

```javascript
// CORRECT — post-wizard tests wrapped in their own sub-describe with beforeEach
test.describe.serial("Post-Wizard — Proposal Card", () => {
  test.beforeEach(async () => {
    const dealDetailUrl = wizardStepperUrl.replace(/\/contract\/\d+.*$/, "");
    await page.goto(dealDetailUrl, { waitUntil: "domcontentloaded" });
    await contractModule.assertOnDealDetailPage();
  });
  test("TC-072 | ...", async () => { /* on deal detail page */ });
  test("TC-073 | ...", async () => { /* on deal detail page */ });
});

// WRONG — freestanding tests after Step 6 sub-describe; parent beforeEach resets to list
test("TC-072 | ...", async () => {
  await contractModule.assertProposalCardVisible(); // fails — on /deals list, not detail
});
```

---

## 15. Verify State in the Correct UI Context

- **Symptom:** `isVisible()` or `toBeVisible()` on a locator returns false even though the data was saved successfully.
- **Root cause:** The element being asserted only exists in a specific UI context (e.g., proposal editor sidebar) but the test checks for it on a different page (e.g., deal detail summary).
- **Rule:** Before asserting persisted form state, navigate to the UI surface where the element actually renders. For proposal fields (Auto Renewal checkbox, date fields, etc.) that live in the editor sidebar, reopen the proposal editor via `openExistingProposalEditor()` and assert inside that context. Never assert editor-only fields on a summary/detail page where they do not appear.

---

## 16. React Re-render Field Clearing in Multi-Field Forms

- **Symptom:** A text input filled early in a sequence (e.g., service name) appears empty at form submission time — even though it was filled successfully. The `Save & Next` button stays disabled with a "field is required" error on that input. The test log ends mid-sequence (after a dropdown or chip interaction) with no further field-fill logs.
- **Root cause:** Selecting a value in a custom MUI dropdown (or clicking a chip) triggers a React re-render that resets controlled input components earlier in the form. The text field loses its value silently because the component re-mounts with its initial (empty) state.
- **Rule:** In any multi-field POM fill method where a custom dropdown or chip interaction follows a text input fill, move the text input fill to run **last** — after all dropdowns, chips, and time pickers. This ensures no subsequent re-render can wipe the value. Example in `fillStep1Services()`: `selectFirstAvailableLineItem` → `fillOfficerCount` → `fillHourlyRate` → `clickJobDay` (all days) → `selectStartTime` → `selectEndTime` → `fillServiceName` (last). The recovery block at the end of the fill method must also re-run the time selectors before re-filling the text input, since the same re-render may have reset them too.

---

## 17. afterAll Context Cleanup in Multi-Describe Suites

- **Symptom:** `locator.click: Target page, context or browser has been closed` in a `beforeEach` hook of a later sub-describe, even though all prior tests passed.
- **Root cause:** The outer `test.describe` has an `afterAll` that calls `context?.close()`. In Playwright 1.58+, `afterAll` fires between sibling child describes (e.g., between "Create Proposal" and "Contract Wizard", or between Step 2 and Step 3 sub-describes). Closing the context prematurely kills the shared browser session for all downstream tests.
- **Rule:** Never close the shared browser context in `afterAll` when the parent describe contains multiple child describes or sub-describes. Playwright automatically cleans up all contexts when the test run finishes. If explicit cleanup is needed, guard with a check that no more tests will run — or simply let Playwright handle it.

---

## 18. Stepper Footer Initial Zero State

- **Symptom:** `expect(footerAmount).toBeGreaterThan(0)` fails even though the stepper is open and shows a valid service. The footer text is `"USD 0.00 Weekly"`.
- **Root cause:** When reopening a saved contract stepper via `openExistingProposalEditor()`, React renders the stepper shell (including footer heading) with initial defaults (`0.00`) before the saved service data loads and triggers a recalculation. Reading `textContent()` immediately captures the pre-calculation state.
- **Rule:** When reading a calculated total from a React component that loads asynchronously, wait for a non-zero value using a web-first assertion: `await expect(locator).toHaveText(/[1-9][\d,]*\.\d{2}/, { timeout: 15_000 })`. Do not use `/\d+\.\d{2}/` as it matches `0.00`. Only then read `textContent()` for comparison.

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

- **Named tabpanels over positional `.first()`:** Use `getByRole('tabpanel', { name: /Activities/i })` — DOM order of tabpanels is not guaranteed to match the visually active tab.
- **MUI Popper/Tooltip:** Use `#simple-popper` (id only) — never `#simple-popper[role="tooltip"]` (attribute not reliably present).
- **MUI custom dropdowns:** Never `click({ force: true })` on container divs — use the POM's dedicated opener method which walks the React fiber tree to invoke `onClick`.
- **Drawer/modal close icons (`<a href="#">`):** Never `force: true` — use normal `.click()` to preserve React blur sequencing.
- **Filter trigger locators with dynamic text:** Match ALL possible values with regex alternation, e.g. `/^(Type|All|Email|Call)$/` — not just the default label.
- **MUI Switch toggles:** Click the parent `<span>` wrapper, not the hidden `<input>`. `force: true` on the input bypasses React synthetic events. Use `switchLocator.locator('..').click()`.
- **MUI Dialog headings:** Use `getByRole('heading', { name: '...' })` — never `//h6` XPath. MUI renders `Typography variant="h6"` as `<div role="heading">` inside dialogs.
- **`page.evaluate()` clicks bypass React — never use for UI interactions.** Use Playwright's `locator.click()` for any interaction that must update React state. When the clickable element has no unique name, scope from a nearby labelled element: `this.heading.locator('..').locator('button').first()`.
- **Google Maps region varies by module — verify before asserting.** In Create Property drawer, map only renders after an address is geocoded, not on combobox focus.
- **Duplicate DOM IDs in repeating forms:** Scope spinbutton/field locators to per-instance container, not globally by accessible name.
- **MUI ListItemButton in `evaluate()` — use `[role="button"]`:** `querySelectorAll('button')` misses `<div role="button">` MUI ListItemButton components.
- **MUI Dropdown Trigger (jss containers):** Use real Playwright `.click()` — never `page.evaluate()` fiber invocation to open Popper dropdowns. Fiber invocation leaves the Popper unanchored at `top:0,left:0` (`offsetParent === null` → `toBeVisible()` times out).

---

## 3. Timeouts

**BASE_TIMEOUT is the only timeout source of truth.** All values derive from `TIMEOUTS.BASE` (from `utils/playwright-timeouts.js`):

- Never use raw millisecond literals: no `timeout: 5000`, `timeoutMs = 10000`, etc.
- Use `TIMEOUTS.BASE * n`. Example: `10_000` → `TIMEOUTS.BASE * 20`.
- Do not use `test.setTimeout(...)` or `test.describe.configure({ timeout: ... })`.
- Do not introduce `PLAYWRIGHT_TIMEOUT_MULTIPLIER`.

| Scenario                       | Limit      | Notes                          |
| ------------------------------ | ---------- | ------------------------------ |
| Navigation                     | 10s        |                                |
| Element visibility / assertion | 5s         | Web-first assertions auto-wait |
| API response                   | 10s        | Use `waitForResponse`          |
| Arbitrary pause                | **Banned** | Find the real wait condition   |

**Never increase a timeout to fix flakiness.** Only acceptable for measured slow backend ops.

---

## 4. Wait Strategy

Use `domcontentloaded` (not `networkidle`). Use event-based waits:

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
- `.count()` without prior web-first assertion (resolves immediately)
- `.isVisible()` for assertion logic — use `await expect(locator).toBeVisible()`
- `.isEnabled()` as a gate — use `await expect(locator).toBeEnabled()`

**Key wait rules:**
- **Unlabelled inputs:** scope to nearest named ancestor, then select by position.
- **Scrollable drawers:** `scrollIntoViewIfNeeded()` before clicking elements below the fold — `toBeVisible()` doesn't mean "in viewport".
- **Table cell click below fold:** after `expect(row).toBeVisible()`, call `scrollIntoViewIfNeeded()` then click (no `force`).
- **Animation-aware:** for MUI drawers/modals, wait for settled state via `toBeVisible()`.
- **Confirmation modals may have required fields:** fill all required inputs inside the modal before clicking Submit.
- **Table data readiness:** call `waitForTableData()` before reading cell text — skeleton rows are attached but empty. When no `waitForTableData()` helper exists, guard the click target directly: `await expect(titleCell).not.toBeEmpty()` before `titleCell.click()`. A row being `toBeVisible()` does not mean its cells have content; clicking an empty skeleton cell can trigger navigation to an unintended linked entity (e.g., clicking td.nth(2) instead of td.nth(1) if React shifts the DOM).
- **Filter API calls cause skeleton rows — guard before `rows.count()`:** after applying a filter (Type, Priority, Status, etc.) the table briefly shows skeleton rows with empty cells. Never call `rows.count()` immediately and then iterate/assert cell content — `.count()` resolves instantly and returns the skeleton row count. Guard on the relevant column cell with `not.toBeEmpty()` before `count()`, using `{ timeout: TIMEOUTS.BASE * 60 }` since filter API calls can take >10s: `await expect(rows.first().locator('td:nth-child(N)')).not.toBeEmpty({ timeout: TIMEOUTS.BASE * 60 }); const rowCount = await rows.count();`.
- **Pagination skeleton reads `0`:** wait for `/\d+–\d+ of [1-9]/` (regex rejecting `0`) before reading the pagination total. `waitForTableData()` alone is insufficient.
- **SPA navigation — `waitForLoadState('domcontentloaded')` is a no-op:** use `Promise.all([page.waitForURL(/pattern/), locator.click()])` for React Router navigation.
- **New tab SPA — React not hydrated at `domcontentloaded`:** when a helper (e.g. `openFromSetPage`) opens a new tab and returns after `waitForLoadState('domcontentloaded')`, the first method called on the new tab MUST start with `await expect(firstLocator).toBeVisible({ timeout: TIMEOUTS.BASE * 60 })` — `domcontentloaded` fires before React has rendered the component tree, so any immediate `.click()` will timeout even though the element exists when tested manually.
- **Intercepting modals after action clicks:** use `.or()` to race between expected heading and blocking modal, then branch on `isVisible()`.
- **`.isVisible()` as classification gate — forbidden for shared state:** wait for one anchor to settle (`locator.or(other).waitFor()`) before reading both states.
- **Search-then-find race condition:** require pagination text to have changed before accepting a text-match as search completion.
- **Drawer survival after blocked submit:** use `waitForURL` with short timeout to detect silent server acceptance before checking if drawer remained open.
- **MUI Accordion expand detection:** wait for `aria-expanded="true"` on `.MuiAccordionSummary-root` (scoped to the tabpanel) — `[role="region"]` is always in the DOM even when collapsed.
- **`.isVisible()` as render-gate before critical interaction — forbidden:** never use `const visible = await locator.isVisible().catch(() => false); if (visible) { /* interact */ }` to guard a POM interaction whose absence would silently leave the page in a broken state (e.g., `Save & Next` permanently disabled). Use `await expect(locator).toBeVisible({ timeout: ... }).then(() => true).catch(() => false)` so slow renders don't silently skip the interaction. The immediate `.isVisible()` returns `false` the instant it's called if the element hasn't rendered yet — it does not wait.
- **MUI Popper option click — skip `waitFor` + `scrollIntoViewIfNeeded`:** never use `await option.waitFor({ state: 'visible' }); await option.scrollIntoViewIfNeeded(); await option.click()` for Popper/tooltip option nodes. The Popper can re-render between `waitFor()` resolving and `scrollIntoViewIfNeeded()` executing, detaching the original DOM node. Use `await option.click()` directly — it auto-waits for visibility and retries with a fresh DOM lookup on each attempt.

---

## 5. Test Isolation & Data

- Each test creates its own data, cleans up after itself, passes in any order.
- Unique data: `` `Item-${Date.now()}-${Math.random().toString(36).slice(2,7)}` ``
- Prefer API cleanup (`request.delete()`) over UI cleanup.
- **Created records use `PAT {timestamp}` pattern:** `` `PAT ${Date.now()}` ``
- **Shared-deal state guard (Contract & Terms):** call `detectContractState()` and delete any existing proposal before `openCreateProposalDrawer()` or `assertEmptyStateVisible()`.
- **Proposal card actions use `aria-label` attributes, not text nodes:** use `locator('[aria-label="Delete"]')`, never `getByText('Delete')` — icon-only buttons have no text content.

---

## 6. Test Data Rules

`process.env.*` is for **secrets, CI toggles, cross-suite handoff** only.

| Belongs in `process.env` / `.env` file        | Belongs in `utils/env-data.js`          | Belongs in file-top constants           |
| --------------------------------------------- | --------------------------------------- | --------------------------------------- |
| Passwords, API tokens                         | User display names, assignee labels     | Env-agnostic values (regex, ZIP codes)  |
| `BASE_URL`, `CI`, `HEADLESS`                  | Franchise names, contact search terms   | Numeric limits (`MAX_SEARCH_ATTEMPTS`)  |
| Cross-suite state (via `shared-run-state.js`) | Any string that differs per environment | Timestamps, flags                       |

- **Environment-specific test data → `utils/env-data.js`.** Never hardcode or use `_PROD`/`_NONPROD` constant pairs.
- **Never access `process.env.*` directly in test specs or page objects** — route through `utils/env.js` or `utils/env-data.js`.
- **Every `process.env.*` key used in code must exist in `.env.uat`** (except standard flags: `CI`, `HEADLESS`, `ENV_NAME`, `NODE_OPTIONS`, `PW_RUNNER_DEBUG`, `EDGE_BASE_URL`).
- **Cross-suite handoff:** use `readCreated*()`/`writeCreated*()` from `utils/shared-run-state.js`.
- **Dates:** compute at runtime from `new Date()` — never hardcode.
- **Constants naming:** `SCREAMING_SNAKE_CASE`. No `_PROD`/`_NONPROD` suffix pairs.
- **No spaces in dynamic form input data for `pressSequentially`-driven inputs** (e.g., `PAT-${Date.now()}` not `PAT ${Date.now()}`). Verify `inputValue()` matches before clicking Save.

---

## 7. Assertion Rules

Every test MUST have meaningful assertions. `toBeDefined()` alone is insufficient.

| Condition                 | Assertion type                                 |
| ------------------------- | ---------------------------------------------- |
| Server state changes      | `waitForResponse` + `toHaveText`/`toHaveCount` |
| URL changes               | `toHaveURL(...)`                               |
| Calculated value updates  | `toHaveText`/`toHaveValue` with exact value    |
| Modal/drawer opens/closes | `toBeVisible`/`toBeHidden`                     |
| Form validation triggers  | `toHaveText` on error message                  |
| Enabled/disabled changes  | `toBeEnabled`/`toBeDisabled`                   |

**Targets:** 3-6 assertions per test, 2-4 per `test.step()`. Only assert at critical-point conditions above.

**Grid filter assertions:** use majority-match (`matchCount / total >= 0.8`) + `toContain` — backend may include sibling rows from the same parent entity.

**Trivially-true type assertions are banned:** `expect(typeof value).toBe('boolean')` always passes and masks real intent. Use the concrete assertion the test actually needs:
- Button enabled/disabled: `await expect(locator).toBeEnabled()` / `await expect(locator).toBeDisabled()`
- Access control (button hidden): `expect(isVisible).toBe(false)`; if the button IS visible, use `test.fail(true, '...')` to mark as known failure instead of silently passing
- Duplicate/error detection: distinguish outcomes explicitly (`if (result === 'error-toast') { expect(result).toBe('error-toast') } else if (...) { test.fail(true, '...') }`) — `expect([...]).toContain(result)` always passes

**Post-submit modal state — use `waitFor` not `waitForTimeout`:** after clicking Submit to trigger validation, wait for the real condition (`heading.waitFor({ state: 'hidden', timeout: TIMEOUTS.BASE * 10 }).catch(() => {})`) instead of `waitForTimeout(N)`. Modal staying open = validation fired; modal closing = domain accepted.

---

## 8. POM Rules

- File pattern: `pages/{{module}}-module.js`.
- If missing, ask user before creating.
- **Append-only:** never modify/rename/delete existing code — only ADD new selectors and methods.
- Selectors in constructor, waits encapsulated in methods.

---

## 9. Test Structure

### 9.1 Single Session Pattern (MANDATORY)

All tests in a spec file MUST run in a single browser window and single session.

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

  // Sub-describe with extra setup — only adds to parent beforeEach
  test.describe("Detail Page Tests", () => {
    test.beforeEach(async () => {
      await module.openFirstItemFromList();
      await module.assertDetailOpened();
    });
    test("TC-050 | ...", async () => { /* starts on detail page */ });
  });
});
```

**Rules:**
- Sub-describes must NOT declare their own `sharedPage`, create new contexts, or duplicate login.
- Never close shared context in `afterAll` when parent has multiple child describes — Playwright cleans up at run end.
- **Exception:** Access-control tests requiring a different user role may create a separate context within the test body, closed before the test ends.

### 9.2 Multi-requirement decision

```
Do requirements share setup and continuous UI flow?
  YES → one test() with test.step() per requirement
  NO  → separate test() blocks inside same describe()
```

### 9.3 Describe title rule

Always a short summary — never requirement strings. Include TC range if known:
```javascript
test.describe("Contract Service Management — TC-001, TC-002", () => {});
```

### 9.4 TC code naming

- TC codes written to `docs/{{module}}-test-steps.md` before test generation.
- Never invent TC codes at test-write time.
- **TC names (part after `|`) = user's EXACT requirement text** — never shortened or paraphrased.

### 9.5 Tags

- `@smoke` — happy path, `@regression` — edge cases, `@critical` — blocking business flows

### 9.6 Key patterns

- Use `test.step()` for logical sections.
- Do NOT add per-test `goto` to the listing page — the parent `beforeEach` handles it.

---

## 10. Environment Safety

- **Secrets and config** → `.env.*` via `utils/env.js`. Never hardcode.
- **Env-specific test data** → `utils/env-data.js`. Never hardcode inline or use `_PROD`/`_NONPROD` pairs.
- **Never access `process.env.*` directly** in specs or page objects:
  - ✅ `env.baseUrl` — via `utils/env.js`
  - ✅ `envData.franchise` — via `utils/env-data.js`
  - ❌ `process.env.BASE_URL` — direct access forbidden in specs/pages
- **Every `process.env.*` key used in code must exist in `.env.uat`** (except: `CI`, `HEADLESS`, `ENV_NAME`, `NODE_OPTIONS`, `PW_RUNNER_DEBUG`, `EDGE_BASE_URL`).

---

## 11. Playwright MCP (REQUIRED)

Agent uses Playwright MCP for selector discovery (Phase 0), DOM inspection, and headless execution (Phase 7). If not connected, halt at Phase 0. **Must NOT** fabricate selectors from memory or skip MCP execution in Phase 7.

---

## 12. Auto-Fix Methodology

Hard cap: **2 attempts per failing test.** Prioritize CLI error output over MCP exploration.

**Always run tests via CLI** (`npx playwright test --grep "TC-CODE"` via Bash). Never use MCP browser to execute tests — CLI output is compact and token-efficient.

### Escalation

```
Attempt 1 — Read CLI error. Fix based on error message alone (selector typo, missing await, wrong locator).
  Re-run via CLI.
  ↓ still failing?
Attempt 2 — MCP DOM snapshot ONLY on the failing element's container (not full page). Fix selector or wait.
  Re-run via CLI.
  ↓ still failing?
Auto-mark test.fail() with TODO. No further attempts.
```

**MCP budget:** Phase 0 (discovery): snapshots freely. Phase 7 (execution): CLI only. Phase 8 (fix): MCP only in attempt 2, scoped to failing element.

```javascript
test("TC-X-002 | ...", async () => {
  test.fail();
  // TODO: Unresolved after 2 auto-fix attempts
  // Attempt 1: ...  Attempt 2: ...  Hypothesis: ...
  // Recommendation: HEADLESS=false npx playwright test <file> --debug
});
```

**Never bump timeouts to fix flakiness.** Investigate root cause.

---

## 13. Hard Constraints

| Constraint                                | Detail                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| **NO XPATH**                              | `page.locator()` or `getByRole`/`getByLabel`. Unresolvable → `test.fail()`                  |
| **NO `waitForTimeout`**                   | Use event-based waits                                                                        |
| **NO `networkidle`**                      | Use `domcontentloaded` + explicit waits                                                      |
| **NO DOUBLE-WAITS**                       | `expect()` auto-waits; remove redundant `waitFor()`                                          |
| **NO TIMEOUT BUMPS**                      | Investigate root cause                                                                       |
| **NO HARDCODED ENV**                      | URLs/credentials from `.env` via `utils/env.js`; env-specific test data from `utils/env-data.js` |
| **NO SHARED STATE**                       | Tests pass in any order                                                                      |
| **NO INVENTED TC CODES**                  | From docs only                                                                               |
| **NO FABRICATED SELECTORS**               | Verify via MCP or codegen paste                                                              |
| **ASSERTIONS REQUIRED**                   | Match critical-point conditions (§7)                                                         |
| **DESCRIBE = SHORT SUMMARY**              | Never requirement strings                                                                    |
| **TC NAMES = EXACT TEXT**                 | User's exact requirement string, never paraphrased                                           |
| **POM APPEND-ONLY**                       | Only add new methods                                                                         |
| **ONE DESCRIBE PER RUN**                  | All requirements share one describe                                                          |
| **2 ATTEMPTS → test.fail()**              | Cap at 2 total, no user pause                                                                |
| **CLI FOR EXECUTION**                     | `npx playwright test` via Bash, never MCP browser                                            |
| **MCP = DISCOVERY ONLY**                  | Snapshots in Phase 0 + attempt 2 fix only                                                    |
| **NO `process.env` FOR TEST DATA**        | Named constants at file top                                                                  |
| **NO HARDCODED DATES**                    | Compute from `new Date()`                                                                    |
| **`PAT {timestamp}` FOR RECORDS**         | Test-created records identifiable                                                            |
| **CROSS-SUITE VIA `shared-run-state.js`** | Never hardcoded paths/IDs                                                                    |

---

## 14. Sub-Describe Navigation Reset

Every sub-describe that requires a specific page (e.g., wizard stepper) MUST declare its own `beforeEach` — the first test's navigation does not persist because the parent `beforeEach` resets state between each test. Wrap freestanding post-phase tests in their own `test.describe.serial` with a `beforeEach`.

```javascript
// CORRECT — sub-describe owns its navigation
test.describe.serial("Step 1 — Services", () => {
  test.beforeEach(async () => { await ensureOnStepper(); });
  test("TC-012 | ...", async () => { /* wizard is open */ });
  test("TC-013 | ...", async () => { /* wizard is open */ });
});
```

For freestanding post-wizard tests, derive the deal detail URL from `wizardStepperUrl` by stripping `/contract/:id`:
```javascript
test.describe.serial("Post-Wizard — Proposal Card", () => {
  test.beforeEach(async () => {
    const dealDetailUrl = wizardStepperUrl.replace(/\/contract\/\d+.*$/, "");
    await page.goto(dealDetailUrl, { waitUntil: "domcontentloaded" });
  });
  test("TC-072 | ...", async () => { /* on deal detail page */ });
});
```

---

## 15. Verify State in the Correct UI Context

Before asserting persisted form state, navigate to the UI surface where the element actually renders. Editor-only fields (e.g., proposal sidebar) don't appear on summary/detail pages — reopen the editor via `openExistingProposalEditor()` before asserting.

---

## 16. React Re-render Field Clearing in Multi-Field Forms

In any multi-field POM fill method where a custom dropdown or chip interaction follows a text input fill, move the text input fill to run **last** — dropdown/chip interactions trigger React re-renders that reset controlled inputs. The recovery block must also re-run time selectors before re-filling the text input.

---

## 17. `afterAll` Context Cleanup in Multi-Describe Suites

Never close the shared browser context in `afterAll` when the parent describe contains multiple child describes — Playwright cleans up contexts at run end. Every child `test.describe` that calls `openSharedDealDrawer()` or `openContractDealDetail()` MUST have its own `beforeAll` that checks page liveness and re-runs `ensureContractTargetDeal()`.

```javascript
// CORRECT — child describe owns its beforeAll; page revival + deal resolution
test.describe.serial("My Feature — TC-CONTRACT-NNN", () => {
  test.beforeAll(async ({ browser }) => {
    test.setTimeout(600_000);
    const pageAlive = await page?.evaluate(() => true).catch(() => false);
    if (!pageAlive) {
      context = await browser.newContext();
      page = await context.newPage();
      contractModule = new ContractModule(page);
      await withTimeout(performLogin(page), 180_000, "performLogin");
    }
    await ensureContractTargetDeal().catch((err) => {
      resolvedContractDealName = ""; // §20 reset
    });
  });
});
```

---

## 18. Stepper Footer Initial Zero State

When reading a calculated total from a React component that loads asynchronously, wait for a non-zero value before reading: `await expect(locator).toHaveText(/[1-9][\d,]*\.\d{2}/, { timeout: TIMEOUTS.BASE * 30 })`. Do not use `/\d+\.\d{2}/` (matches `0.00`). End `submitCreateProposal()` with `await expect(this.stepperStep1).toBeVisible()` — `waitForLoadState('domcontentloaded')` is a no-op on SPA navigation.

---

## 19. MUI ListItemButton in `evaluate()` — Use `[role="button"]`

In `evaluate()` callbacks, use `querySelectorAll('[role="button"]')` not `querySelectorAll('button')` — MUI `ListItemButton` renders as `<div role="button">`, not a native `<button>` tag.

---

## 20. Reset Shared State on Non-Fatal `beforeAll` Failures

When a `beforeAll` helper (e.g., `ensureContractTargetDeal`) is wrapped in `.catch()`, the catch block MUST reset shared state variables (e.g., `resolvedContractDealName = ""`). Any consumer function (e.g., `openContractDealDetail`) must guard against empty/falsy values with a fast descriptive error.

---

## 21. Extra Browser Tabs and Unreachable Wizard Steps

Navigation helpers (`goToStepN`) must close extra tabs at start:
```javascript
for (const p of page.context().pages()) { if (p !== page) await p.close(); }
```
Use a `stepNAvailable` flag set in `beforeEach` (with try/catch). Always verify step content after `goToStepN` via `await expect(stepContentLocator).toBeVisible()` before setting `stepNAvailable = true`. If the content assertion fails, set `stepNAvailable = false`. For Step 5→6 advancement, add a fallback click on `stepperTab6` when Save & Next fails silently.

---

## 22. MUI Dropdown Trigger — Real Click, Not Fiber Invocation

For MUI Popper-backed dropdowns, use `locator.click()` — never `page.evaluate()` fiber invocation. Fiber invocation leaves the Popper unanchored at `top:0,left:0`.

```javascript
// CORRECT — real click on jss container
const trigger = page.locator('[class*="jss136"]')
  .filter({ has: page.getByRole('heading', { name: /Select Property/, level: 6 }) });
await trigger.click();
await expect(page.locator('#simple-popper').last()).toBeVisible({ timeout: TIMEOUTS.BASE * 16 });
```

**Also applies to `click({ force: true })` on jss container divs.** `force: true` bypasses the browser's pointer-events dispatch, so React never receives the synthetic click event. `#simple-popper` never renders as a result — `waitFor({ state: "visible" })` times out. Always use a plain `.click()` (or a POM method that wraps real clicks with ArrowDown retry) to open MUI Popper dropdowns.

- **Symptom:** `locator.waitFor: Timeout Nms exceeded` waiting for `#simple-popper` after `click({ force: true })` on the trigger div.
- **Root cause:** `force: true` skips pointer-event checks and React synthetic event dispatch; the Popper is never triggered.
- **Rule:** Never call the low-level `click({ force: true })` method alone to open a Popper. Use the POM's dedicated opener method (e.g. `openSelectSupervisorDropdownInCreateDrawer()`) which combines a real `.click()` with an `ArrowDown` key press and up to 5 retry attempts.

---

## 23. `.isVisible()` as Classification Gate — Forbidden for Shared State

Never use `.isVisible()` as a classification gate when its result is persisted to a shared state variable. Wait for one anchor to settle first:

```javascript
// CORRECT — wait, then read mutually exclusive states
await contractModule.contractPublishedBadge.or(contractModule.publishContractBtn)
  .waitFor({ state: 'visible', timeout: TIMEOUTS.BASE * 10 }).catch(() => {});
const isPublished = await contractModule.contractPublishedBadge.isVisible().catch(() => false);
const isDraft = !isPublished && await contractModule.publishContractBtn.isVisible().catch(() => false);
```

---

## 24. `beforeAll` Deal Classifiers — Exclude Child Deals by Name Prefix

When classifying deals into role-specific buckets, add name-prefix guards. The "parent with no Addendum icon" bucket must exclude deals whose name starts with `"Addendum -"`:

```javascript
if (isPublished && !hasAddendum && !hasParentNoAddendum && !dealName.startsWith("Addendum -")) {
  parentNoAddendumUrl = page.url();
  hasParentNoAddendum = true;
}
```

---

## 25. Contract "Published and Signed" State

Add `contractFullySignedBadge = page.getByText('Published and signed', { exact: true })` to the POM. `openSignatureDropdown()` must detect this badge first (short timeout) and throw `'ALREADY_FULLY_SIGNED'` — avoids a full timeout. Tests calling signature methods must check a `contractAlreadySigned` flag and return early with `expect(contractFullySignedBadge).toBeVisible()` + `assertDealStageActive('Closed Won')`. Include `.or(contractFullySignedBadge)` in deal-finder locator chains so fully-signed deals are not skipped.

---

## 26. MUI Accordion Email Body — Wait on `aria-expanded`, Not `[role="region"]`

MUI Accordion renders `[role="region"]` always in the DOM (even when collapsed). After clicking the accordion summary, wait for `aria-expanded="true"` on `.MuiAccordionSummary-root` scoped to the Emails tabpanel, then read body from `.MuiAccordionDetails-root > div`.

```javascript
const emailsPanel = page.getByRole('tabpanel', { name: /Emails/i });
const summary = emailsPanel.locator('.MuiAccordionSummary-root');
await summary.click();
await expect(summary).toHaveAttribute('aria-expanded', 'true');
const bodyHtml = await emailsPanel.locator('.MuiAccordionDetails-root > div').innerHTML();
```

---

## 27. Note Activity Cards Strip Rich HTML — Assert in Notes Tab

The Activities tab strips all HTML tags from note body content. To assert rich-text formatting (`<ul>/<li>`, `<strong>`, etc.), assert in the **Notes tab** card body — never via `activityCardContentByTitle()`.

```javascript
// CORRECT — get rich body HTML from Notes tab card
const noteBodyHtml = await page
  .getByRole('tabpanel', { name: /Notes/i })
  .locator('p').filter({ hasText: noteSubject }).first()
  .locator('..').locator('..')
  .locator('div > div').innerHTML();
expect(/<ul|<ol|<li/i.test(noteBodyHtml)).toBe(true);
```

---

## 28. Google Autocomplete — Assert Non-Empty, Not Exact Value After `fill()`

**Symptom:** `expect(addressInput).toHaveValue(typedText)` fails immediately after `addressInput.fill(typedText)` — received value is the first autocomplete suggestion, not the typed text.

**Root cause:** Google's Maps autocomplete widget overwrites the input value with the first suggestion text synchronously after `fill()`, before a `toHaveValue(typedText)` assertion can resolve. This is a race condition between Playwright's assertion and the autocomplete widget's mutation.

**Rule:** After `fill()` on an autocomplete-controlled input, guard only that the input is non-empty — never assert the exact typed value, because the widget may have already replaced it.

```javascript
// WRONG — fails when autocomplete immediately replaces typed text
await addressInput.fill(variant);
await expect(addressInput).toHaveValue(variant, { timeout: TIMEOUTS.BASE * 4 });

// CORRECT — confirms fill() had an effect without racing the autocomplete widget
await addressInput.fill(variant);
await expect(addressInput).not.toHaveValue("", { timeout: TIMEOUTS.BASE * 4 });
```

---

## 29. `filter({ hasText: regex })` — Never Use Anchors (`^`/`$`) Against React-Rendered Buttons

**Symptom:** `locator('button').filter({ hasText: /^Negotiation$/ })` returns "element(s) not found" even though the button is visibly present in the DOM snapshot with inner text "Negotiation".

**Root cause:** When `hasText` receives a `RegExp`, Playwright tests it against the element's raw `textContent` (not normalised). React-rendered buttons that contain an `<img>` child alongside a text node produce `textContent` with surrounding whitespace or newlines (e.g., `"\nNegotiation\n"`). The anchored `^Negotiation$` regex does not match against this whitespace-padded string.

**Rule:** Never use anchored regexes (`^...$`) in `filter({ hasText })` for stage buttons or any React-rendered button that contains child elements (icons, images). Use a non-anchored pattern — or use `getByRole('button', { name: /pattern/ })` which matches against the accessible name.

```javascript
// WRONG — fails when React surrounds the text node with whitespace
page.locator('button').filter({ hasText: /^Negotiation$/ });
page.locator('button').filter({ hasText: new RegExp(`^${stage}$`) });

// CORRECT — non-anchored partial match is whitespace-safe
page.locator('button').filter({ hasText: /Negotiation/ });
page.locator('button').filter({ hasText: new RegExp(stage) });
```

---

## 30. MUI Stepper Tab Headings — Tooltips Only, No Navigation

**Symptom:** `clickStepperTab(N)` times out waiting for step N's content after successfully clicking the heading element. The step stays unchanged.

**Root cause (DOM-verified 2026-05-16):** Each stepper tab renders as a MUI Tooltip wrapper (`generic[aria-label="Add additional services"]`) containing an `<h6>` heading. Clicking the heading (or its parent wrapper) **only shows a tooltip** — it does NOT navigate the stepper. Navigation from step N to step N+1 is only possible by clicking `Save & Next` (which fires a PATCH `/contracts` API call). Backward navigation to a previously completed step via tab heading may work but is not guaranteed.

**Rule:** Never rely on `clickStepperTab()` as the primary path to advance the stepper forward. The only reliable forward path from any step is `clickSaveAndNext()`. Only use `clickStepperTab()` as a fallback for already-completed steps (backward navigation or re-visit).

```javascript
// WRONG — clicking the heading shows tooltip, does NOT navigate
await this.stepperTab3.click();
await expect(this.onDemandPageHeading).toBeVisible(); // times out

// CORRECT — advance with Save & Next (fires API PATCH, then navigates)
await this.clickSaveAndNext();
await expect(this.onDemandPageHeading).toBeVisible({ timeout: TIMEOUTS.BASE * 40 });
```

**Rule:** When defining stepper tab locators, target the `<h6>` heading directly (cursor:pointer lives on the heading). Do NOT use `.locator('..')` to target the MUI Tooltip parent container — the parent has no click handler and only shows the tooltip.

```javascript
// WRONG — targets MUI Tooltip container (no React onClick, just tooltip)
this.stepperTab2 = page.getByRole('heading', { name: '2. Devices', level: 6 }).locator('..');

// CORRECT — targets the h6 heading which has cursor:pointer
this.stepperTab2 = page.getByRole('heading', { name: '2. Devices', level: 6 });
```

**Rule:** On a fresh (first-ever) visit to Step 2 (Devices), React's form is in pristine/disabled state — `Save & Next` is `disabled=true` until the form hydrates. Wait for a quantity control to be enabled as the hydration indicator before interacting:

```javascript
// Wait for form hydration on Step 2 before calling ensureDeviceQuantity
const nfcPlusBtn = this.page
  .getByRole('group')
  .filter({ has: this.page.getByRole('button', { name: '-' }) })
  .filter({ has: this.page.getByRole('button', { name: '+' }) })
  .first()
  .getByRole('button', { name: '+' });
await expect(nfcPlusBtn).toBeEnabled({ timeout: TIMEOUTS.BASE * 40 });
```

---

## 31. Strict Mode Violation on Table Cell Click — Use `.first()`

**Symptom:** `locator.click: Error: strict mode violation: getByRole('cell', { name: '...' }) resolved to 2 elements` when clicking a search result row by contact/entity name.

**Root cause:** Search results may return duplicate rows (e.g., same contact appears twice during loading or due to a backend pagination overlap). `getByRole('cell', { name })` without a scope guard matches all cells with that name in the entire table, triggering Playwright's strict mode error.

**Rule:** When clicking a table cell by entity name to navigate to a detail page, always scope with `.first()` to pick the top result. Do not rely on the search producing exactly one match.

```javascript
// WRONG — strict mode error when duplicate rows exist
await this.page.getByRole('cell', { name }).click();

// CORRECT — always take the first matching cell
await this.page.getByRole('cell', { name }).first().click();
```

---

## 32. Shared Deal Name May Capture UI Navigation Labels — Validate Before Use

**Symptom:** `openContractDealDetail("Overview")` searches for a deal named "Overview", finds nothing, and throws or times out. `resolvedContractDealName` was `"Overview"` instead of the actual deal name.

**Root cause:** When a `beforeAll` or helper navigates the page (e.g., `assertOnDealDetailPage` triggers a tab click), the `resolvedContractDealName` shared variable may have been populated from a UI element's text content (tab label, heading) rather than the actual deal name. The check `!dealName` passes because the string is non-empty, but the value is a UI navigation label, not a valid deal name.

**Rule:** Any function that consumes `resolvedContractDealName` must validate it with `isUsableContractDealName()` (or equivalent) before using it. Each child `beforeAll` that could inherit a stale/invalid shared value must re-validate and reset it before searching.

```javascript
// WRONG — empty string check passes for "Overview"
if (!dealName) { throw new Error("..."); }

// CORRECT — reject known-invalid UI labels too
if (!dealName || !isUsableContractDealName(dealName)) { throw new Error("..."); }

// CORRECT — child beforeAll resets invalid inherited value before searching
if (!isUsableContractDealName(resolvedContractDealName)) {
  const freshName = readCreatedDealName();
  resolvedContractDealName = isUsableContractDealName(freshName) ? freshName : "";
}
```

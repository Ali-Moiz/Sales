---
name: playwright-pom-best-practices
description: Senior QA automation workflow for Playwright JavaScript in this repo. Use when creating or updating Playwright tests, page objects, fixtures, auth/session handling, locators, or debugging flaky tests. Aligns with this codebase’s CommonJS setup, storageState auth, existing folders (tests/, pages/, fixtures/, utils/, data/), and stability patterns.
---

# Playwright POM Best Practices (Repo Skill)

Act as a **Senior QA Automation Engineer** specializing in **Playwright with JavaScript**, focused on **stable, maintainable, scalable automation** using a Page Object Model (POM).

This skill is intentionally **repo-aware**: it prefers best practices, but must also respect what the codebase already does so changes don’t break existing flows.

---

## Repo reality (current conventions you must follow)

- **Language/runtime**: JavaScript + **CommonJS** (`require` / `module.exports`)
- **Runner**: `@playwright/test`
- **Config**: `playwright.config.js`
- **Folders (as-is)**:
  - `tests/` (includes `tests/e2e/` and some specs directly under `tests/`)
  - `pages/` (page objects; both `*.page.js` and `*-module.js` patterns exist)
  - `fixtures/` (light fixtures wrapper exists)
  - `utils/` (auth, shared state, helpers)
  - `data/` (credentials + data)
  - `docs/` (runbooks/test steps)
- **Auth strategy used today**: `storageState` written to `playwright/.auth/user.json`
  - Setup file exists: `tests/setup/login.setup.js`
  - Some suites implement `ensureAuthState()` internally
- **Login flow**: centralized + resilient in `utils/auth/login-action.js`
- **Stability patterns already used**:
  - `expect.poll(...)`
  - “wait for skeletons to clear” (e.g., `.MuiSkeleton-root` polling in Market Verticals POM)
  - targeted `waitForTimeout(...)` (exists in codebase; avoid adding new ones unless justified)

---

## 🎯 Core objectives

- **Stability**: minimize flake by anchoring on URL/heading/table-visible and Playwright auto-waiting
- **Maintainability**: keep selectors centralized and flows reusable
- **Scalability**: make it easy to add new suites/modules without copy-paste
- **Coverage**: maximize functional coverage with clear, grep-able test IDs

---

## Framework architecture (recommended target)

Use this as the _ideal_ shape, while mapping to existing folders when implementing changes:

```text
project-root/
│
├── tests/
│   ├── setup/            # storageState login setup (already exists)
│   ├── e2e/              # module suites (already exists)
│   ├── helpers/          # reusable suite registrars (already exists)
│   └── ...               # other smoke/regression specs (already exists)
│
├── pages/                # Page Objects (already exists)
├── fixtures/             # test fixtures (already exists)
├── utils/                # auth + helpers (already exists)
├── data/                 # env-driven creds + static test data (already exists)
├── docs/                 # runbooks and testcase docs (already exists)
│
├── playwright.config.js
└── package.json
```

Do **not** create new top-level folders unless the user asks; prefer to fit within current structure.

---

## 🔐 Session / auth strategy (IMPORTANT)

### Goal

Avoid logging in before every test by **reusing authenticated state**, while keeping tests reliable.

### Repo-default approach: `storageState`

Prefer this (it matches the codebase):

- **Write storageState once**:
  - `tests/setup/login.setup.js` saves to `playwright/.auth/user.json`
- **Load storageState for suites**:
  - `browser.newContext({ storageState: 'playwright/.auth/user.json' })`

### Guidance when editing auth

- **Do not duplicate login logic** in new specs; use `utils/auth/login-action.js` (`performLogin`)
- If login gets flaky, fix **one place** (`performLogin`) rather than patching every spec
- If a suite needs “ensure auth file exists”, follow the existing `ensureAuthState(browser)` pattern

### Your provided “sessionStorage JSON” pattern

Your snippet saves `sessionStorage` to a JSON file and re-injects it later. That can work in some apps, but in this repo today:

- authentication reuse is implemented via **Playwright `storageState`** (cookies + localStorage, etc.)
- keep **storageState** as the default unless a migration is explicitly requested

If the user asks for sessionStorage-only auth, implement it as an **additive helper** (e.g., `utils/session-helper.js`) and do not break storageState flows.

---

## 📌 Test design principles

- **One test = one scenario**
- Prefer **AAA** (Arrange → Act → Assert)
- Keep tests **grep-able**:
  - `TC-XXX-001 | ...`
  - `NT-Module-N004: ...`
- Prefer **stable anchors**:
  - `await expect(page).toHaveURL(...)`
  - `await expect(page.getByRole('heading', ...)).toBeVisible()`
- **Minimize shared state**
  - Repo has serial suites that share a session (acceptable for speed/stability)
  - If you introduce shared state, make it explicit and reset/anchor state per test

---

## 🎭 Page Object Model (POM) rules (recommended)

### Preferred rules (best practice)

- Keep **locators in POM**
- Methods represent **user actions** (navigate, create, edit, search)
- Keep **test data out of POM**
- Keep **assertions mostly in tests**

### Repo compatibility note

This codebase _already includes_ POM assertion helpers in some pages (e.g., `assert...` methods). When modifying existing POMs:

- do not remove existing assertion helpers unless requested
- for new work, prefer action methods + return values, and keep assertions in tests

---

## ⚡ Locator strategy (STRICT)

### ✅ Always use (recommended)

```js
page.getByRole("button", { name: "Submit" });
page.getByLabel("Email");
page.getByText("Dashboard");
page.getByPlaceholder("Password");
```

Also acceptable when roles/names are unreliable:

- `page.locator('#stable-id')`
- label/heading anchored locators (e.g., `label[for="x"] + div`)

### ❌ Strictly avoid

```js
// XPath
page.locator("//div[3]/button");

// Random/unstable IDs
page.locator("#id-123");

// Deep CSS chains
page.locator("div > div > ul > li:nth-child(3)");
```

Rule: prefer **user-facing** selectors and accessibility roles.

---

## ⏱️ Waiting strategy (flakiness control)

### Default: rely on Playwright auto-waiting + explicit anchors

Prefer:

- `toHaveURL`
- `toBeVisible`
- `toHaveText`
- `expect.poll(...)` for async UI settle

### About `waitForTimeout`

Your shared guidance says “Never use waitForTimeout”. Best practice is to avoid it; however this repo already uses small timeouts in a few places.

Rules:

- Do **not** add new `waitForTimeout(...)` unless you can’t model the wait via a stable condition
- If you must use one, keep it short and pair it with a real condition afterward

---

## 🧪 Test structure template (CommonJS, repo-aligned)

Use this template for new specs:

```js
const { test, expect } = require("@playwright/test");
const { performLogin } = require("../utils/auth/login-action"); // adjust relative path
const { SomePage } = require("../pages/some.page"); // adjust relative path

test.describe.serial("Module Name", () => {
  let context;
  let page;
  let somePage;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    somePage = new SomePage(page);
    await performLogin(page);
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test("TC-MOD-001 | Scenario name", async () => {
    // Arrange

    // Act

    // Assert
    await expect(page).toHaveURL(/\/app\/sales\//);
  });
});
```

If the suite should reuse auth via storageState, prefer:

- create/ensure `playwright/.auth/user.json`
- `browser.newContext({ storageState: 'playwright/.auth/user.json' })`

---

## 🔁 Reusability patterns (use these instead of copy/paste)

- **Reusable suite registrar** pattern:
  - e.g., `tests/helpers/register-notes-tasks-suite.js`
- **Shared state (only if needed)**:
  - `utils/shared-run-state.js` writes to `.tmp/shared-run-state.json`
  - use sparingly; prefer unique runtime data (`Date.now()` suffixes)

---

## ⚙️ Config best practices (matches repo)

Keep sequential/stable settings consistent with current config:

- `workers: 1` on CI and local (as currently configured)
- `trace: 'on-first-retry'`
- `screenshot: 'only-on-failure'`
- `video: 'retain-on-failure'`

If asked to speed up, propose:

- per-suite `describe.serial` vs parallel
- splitting into separate projects
- only then increasing workers

---

## 🧠 Error handling & debugging

Prefer:

- clear expectation messages via stable asserts
- centralized fixes in shared utilities (login, waiting helpers)
- isolating flaky UI areas with better anchors (URL/title/table visible)

If you must wrap an action:

```js
try {
  await action();
} catch (e) {
  console.error("Step failed:", e);
  throw e;
}
```

---

## ❌ Anti-patterns (strictly avoid)

- Merge-conflict markers committed (`<<<<<<<`, `=======`, `>>>>>>>`)
- XPath selectors
- Long hard waits as a primary sync strategy
- Duplicated login code in many specs
- Tests that depend on other tests without explicit serial + setup
- Putting secrets directly in specs (credentials must come from env)

---

## ✅ Final output expectation for any new automation

Every generated test/POM change should be:

- **Clean**
- **Scalable**
- **Maintainable**
- **Dynamic** (unique data where needed)
- **Stable** (anchors + auto-waits; minimal timeouts)
- **Speed Optimization**

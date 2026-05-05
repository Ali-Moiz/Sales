# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an End-to-End test automation framework for the Sales CRM application built with Playwright. The project uses a Page Object Model (POM) pattern to organize test code and follows a modular testing approach with separate test suites for different functional areas (login, company, contact, property, deal, contract, etc.).

## Architecture

### Directory Structure

- **`pages/`** — Page Object Model classes representing UI pages/modules. Each module has a corresponding page class (e.g., `LoginModule`, `CompanyModule`, `PropertyModule`). These contain selectors and helper methods for interacting with specific pages.
- **`tests/`** — Test specifications organized by module. Each `.spec.js` file contains test cases for a specific feature using the page objects from `pages/`.
- **`utils/`** — Shared utility functions:
  - `env.js` — Environment configuration (base URL, credentials for different user roles)
  - `auth/` — Authentication helpers including login action and slider image blocking
  - Other utilities for test data and state management
- **`fixtures/`** — Test fixtures
- **`data/`** — Test data files
- **`docs/`** — Test case documentation and smoke test scenarios

### Multi-Environment & Multi-Role Setup

Tests are designed to run against different environments and user roles:

- **Environments**: UAT (default) and Prod
- **User Roles**: HO (Head Office), SM (Scenario Manager), SP (another role)
- Environment is set via `ENV_NAME` variable (e.g., `ENV_NAME=uat npm run test:uat`)
- Credentials are loaded from `.env.[environment]` files

### Test Organization

Tests follow a modular structure with separate specs for each functional area:

- `login-module.spec.js` — Login and authentication tests
- `company-module.spec.js` — Company management tests
- `contact-module.spec.js` — Contact management tests
- `property-module.spec.js` — Property management tests
- `deal-module.spec.js` — Deal management tests
- `contract-module.spec.js` — Contract management tests
- Plus additional specs for market verticals, tasks, notes, etc.

## Development Commands

### Running Tests

```bash
# Run all tests against UAT (headless)
npm run test:uat

# Run all tests against UAT (headed - visible browser)
npm run test:uat:headed

# Run tests against Prod
npm run test:prod

# Run specific module tests
npm run test:uat:login
npm run test:uat:company
npm run test:uat:contact
npm run test:uat:property
npm run test:uat:deal
npm run test:uat:contract

# Run a single test file
npx playwright test tests/e2e/login-module.spec.js

# Run tests matching a pattern
npx playwright test --grep "TC-001"
```

### Linting

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Reports

```bash
# Open the HTML test report from the last run
npm run report
```

## Key Technologies & Configuration

### Playwright Configuration

- **Config file**: `playwright.config.js`
- **Test directory**: `./tests`
- **Test pattern**: `**/*.spec.js`
- **Base URL**: Defaults to `https://uat.sales.teamsignal.com` (overridable via `BASE_URL` env var)
- **Timeouts**: 60s per test, 10s for assertions, 15s action timeout, 30s navigation timeout
- **Workers**: Single worker (sequential execution)
- **Reporters**: HTML, JUnit, and console list
- **Screenshots/Videos**: Captured on failure only
- **Trace**: On first retry only

### ESLint Configuration

- **Config file**: `eslint.config.mjs` (ESLint flat config)
- **Base config**: ESLint recommended rules
- **Playwright plugin**: Enabled for test files
- **Ignored dirs**: `node_modules`, `playwright-report`, `test-results`, `artifacts`, `reports`, `dist`, `.tmp`
- **Special handling**: Tests can use `playwright/no-wait-for-timeout: off` to allow `waitForTimeout()`

### Environment Configuration

- Environment variables are loaded from `.env.[ENV_NAME]` files via `utils/auth/load-env.js`
- At Playwright startup, it loads the `.env.uat` or `.env.prod` file
- Credentials are exposed via `utils/env.js` with keys for different user roles (`SIGNAL_EMAIL_HO`, `SIGNAL_PASSWORD_SM`, etc.)

## Environment Setup

### .env File Configuration

Before running tests, create environment files in the repo root:

**`.env.uat`** — UAT environment credentials

```bash
SIGNAL_EMAIL_HO=head.office@company.com
SIGNAL_PASSWORD_HO=your_password_here
SIGNAL_EMAIL_SM=scenario.manager@company.com
SIGNAL_PASSWORD_SM=your_password_here
SIGNAL_EMAIL_SP=another.role@company.com
SIGNAL_PASSWORD_SP=your_password_here
BASE_URL=https://uat.sales.teamsignal.com
```

**`.env.prod`** — Production environment (if needed)

```bash
SIGNAL_EMAIL_HO=prod.user@company.com
SIGNAL_PASSWORD_HO=prod_password
BASE_URL=https://sales.teamsignal.com
```

### Loading Credentials in Tests

Credentials are automatically loaded via `utils/auth/load-env.js` and exposed by `utils/env.js`:

```javascript
const { env } = require("../utils/env");

// Access credentials for different roles:
const hoEmail = env.email; // Head Office email
const smEmail = env.email_sm; // Scenario Manager email
const password = env.password; // Corresponding password
```

Always use `env` for credentials—never hardcode them in tests.

## Test Data & Fixtures

### Dynamic Test Data

Tests use dynamic data resolution to select or create entities:

- **Deal Target Resolution** (`utils/shared-run-state.js`): Tests search for a reusable deal; if none exists, create one fresh and reuse it across all contract tests
- **Company/Property Fallbacks** (`utils/property-company-selector.js`): When required entity not found, fall back to hardcoded fallback company/property (e.g., "Regression Phase 2")
- **Contract Stepper Data** (`utils/contract-test-data.js`): Service types, pricing, payment terms, and signee templates

### Contract-Specific Test Data

The contract module uses timezone-aware test data:

- **Time Zone**: Eastern (for contract date calculations)
- **Service Templates**: Define Officer count, hourly rates, work days, start/end times
- **Payment Terms**: Billing occurrence, contract type, frequency, payment method, cycle reference

See `docs/contract-module-test-steps.md` for complete test case documentation including expected calculations.

## Page Object Model Pattern

When creating or modifying page objects:

1. **Constructor**: Accept the `page` object and define all locators (selectors)
2. **Locators**: Use `page.getByRole()`, `page.getByPlaceholder()`, `page.locator()` for accessibility
3. **Methods**: Create methods for user actions (e.g., `login()`, `fillForm()`, `submit()`)
4. **Waits**: Include necessary waits in navigation/action methods
5. **Error Handling**: Use `.catch(() => {})` for optional network waits, throw explicit errors for required conditions

### Real Example: ContractModule

From `pages/contract-module.js` — notice ARIA-first selectors and descriptive method names:

```javascript
class ContractModule {
  constructor(page) {
    this.page = page;

    // ── ARIA-based locators (accessible, resilient) ──
    this.contractTermsTab = page.getByRole("tab", { name: "Contract & Terms" });
    this.createProposalBtn = page
      .getByRole("button", { name: "Create Proposal" })
      .first();
    this.dedicatedPatrolRadio = page.getByRole("radio", {
      name: /Dedicated\s*\/\s*Patrol/,
    });
    this.proposalNameInput = page.getByRole("textbox", {
      name: "Add Proposal Name",
    });

    // ── Fallback for complex selectors ──
    this.dealSearchInput = page
      .getByRole("searchbox", { name: "ID, Deal" })
      .or(page.locator('input[placeholder*="ID, Deal"]'))
      .first();
  }

  async openDealDetail(dealName) {
    await this.dealSearchInput.fill(dealName);
    await this.page.getByRole("button", { name: dealName }).click();
    await expect(this.contractTermsTab).toBeVisible();
  }

  async createProposal() {
    await this.createProposalBtn.click();
    await expect(this.createProposalDrawerHeading).toBeVisible();
  }
}
```

**Key principles:**

- ✅ All selectors live-verified via browser (noted in comments with date)
- ✅ Use `.or()` for resilience when element structure varies
- ✅ No hardcoded indices (`.first()` is last resort, used with `.or()`)
- ✅ Method names are action-based (`openDealDetail`, `createProposal`)
- ✅ Include visibility waits in navigation methods

## Testing Best Practices for This Codebase

1. **Use env variables**: Access credentials and URLs via `utils/env.js`, not hardcoded values
2. **Page Objects**: All page interactions should go through page object methods, not raw selectors
3. **Test naming**: Follow the `TC-###` naming convention in test names
   - ⚠️ **CRITICAL:** TC codes must exist in `docs/*.md` (documented first), never invented or auto-generated
   - Example: `TC-CONTRACT-DELETE-006` must be in `docs/contract-module-test-steps.md` before automation
4. **Test.setTimeout()**: Use for tests that need longer timeouts (e.g., login tests use 180s)
5. **Assertions**: Use Playwright's built-in assertions (`expect()`)
6. **Screenshots/Videos**: Automatically captured on failure; no need to manually enable
7. **Auth handling**: Use `performLogin()` helper from `utils/auth/login-action.js`

### Login & Authentication

The `performLogin()` function handles Auth0 login with retry logic:

```javascript
const { performLogin } = require("../utils/auth/login-action");

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login with default HO credentials from .env
  await performLogin(page);
  // OR with custom credentials:
  // await performLogin(page, { loginCredentials: { email: 'custom@example.com', password: 'pass' } });
});
```

It automatically:

- Detects Auth0 vs. internal login form
- Handles image blocking for slider challenges
- Retries up to 2 times on failure
- Waits for app shell (`/app/sales/`) before returning

## Test Execution Patterns

### Single-Session Pattern (Recommended)

For optimal performance, use a **single browser session** for entire test suites:

```javascript
test.describe("Module — Feature", () => {
  let sharedPage;
  let module;

  // ── Open browser ONCE ──
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    sharedPage = await context.newPage();
    module = new MyModule(sharedPage);
    await performLogin(sharedPage);
  });

  // ── Reuse session for all tests ──
  test.beforeEach(async () => {
    await sharedPage.goto(`${baseUrl}/app/home`); // Reset state only
  });

  // ── Close browser ONCE ──
  test.afterAll(async () => {
    await sharedPage.context().close();
  });

  test("TC-001", async () => {
    /* ... */
  });
  test("TC-002", async () => {
    /* ... */
  });
});
```

**Benefits**: 60%+ faster execution (login once, not per-test) + shared authenticated state.

See `.claude/commands/generate-test.md` for full test generation workflow.

### Codegen for Selector Discovery

Use Playwright's codegen to capture actual DOM selectors and timing:

```bash
HEADLESS=false npx playwright codegen https://uat.sales.teamsignal.com
```

Steps:

1. Browser opens with codegen inspector
2. Manually perform the test flow
3. Codegen records all interactions + selectors
4. Copy generated code → refactor into Page Objects + POM methods
5. Replace XPath with ARIA-based selectors

## Common Issues & Solutions

### Auth0 Loading Issues

The `LoginModule.goto()` includes a wait for Auth0 scripts to load. If login tests timeout, check:

- Network idle state is reached
- Auth0 service is accessible
- Slider image blocking is enabled (see `utils/auth/slider-image-blocker.js`)

### Selector Finding

If selectors break:

1. Check if the page structure changed
2. Use browser DevTools to inspect the element
3. Prefer accessibility-based selectors (`getByRole`, `getByLabel`) over CSS selectors
4. Update both the locator in the page object and potentially the test assertion

### Environment Variables Not Loading

Ensure:

- The `.env.[ENV_NAME]` file exists in the repo root
- `ENV_NAME` is set correctly before running tests
- Credentials in the env file are correct and not expired

## CI/CD Considerations

- CI mode disables `.only` and `.skip` on tests
- CI retries failed tests 2 times
- CI runs with single worker
- JUnit reports are generated to `reports/junit/results.xml` for CI integration

## Quick Reference for New Contributors

### First Test Run (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Set environment (create .env.uat if not present)
# See "Environment Setup" section above

# 3. Run a single module test
npm run test:uat:contract

# 4. View results
npm run report
```

### Common First Tasks

| Task                             | Command                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Run all tests                    | `npm run test:uat`                                                             |
| Run specific module              | `npm run test:uat:contract`                                                    |
| Run single test file             | `npx playwright test tests/e2e/contract-module.spec.js`                        |
| Run tests matching pattern       | `npx playwright test --grep "TC-CONTRACT-001"`                                 |
| Debug a failing test             | `HEADLESS=false npx playwright test tests/e2e/contract-module.spec.js --debug` |
| Generate selectors for a feature | `HEADLESS=false npx playwright codegen https://uat.sales.teamsignal.com`       |
| Lint code                        | `npm run lint`                                                                 |
| Auto-fix lint issues             | `npm run lint:fix`                                                             |

### Where to Find Things

| What                     | Where                                         |
| ------------------------ | --------------------------------------------- |
| Test cases for a feature | `docs/*-test-steps.md`                        |
| Page Object code         | `pages/*-module.js` or `pages/*.page.js`      |
| Actual test specs        | `tests/e2e/*-module.spec.js`                  |
| Authentication helpers   | `utils/auth/`                                 |
| Test data & config       | `utils/env.js`, `utils/contract-test-data.js` |
| Playwright config        | `playwright.config.js`                        |
| ESLint config            | `eslint.config.mjs`                           |

### Common Gotchas

**Auth0 Timeout:**

- Check `.env.[ENV_NAME]` credentials are correct and not expired
- Ensure internet connectivity to auth0.com
- Slider image blocking is enabled in `utils/auth/slider-image-blocker.js`

**Selector Not Found:**

- Use codegen (`npx playwright codegen ...`) to record actual DOM
- Prefer `getByRole()` over CSS or XPath
- Check if element is conditionally rendered (may need visibility wait first)

**Test Hangs or Timeouts:**

- Check for `waitUntil: 'networkidle'` — may wait too long for slow responses
- Use `HEADLESS=false` to see what's happening visually
- Run with `--debug` flag to step through interactions

## CLI Skills & Automation

### Generate Tests from Documentation

Use the `/generate-tests` command to automatically convert manual test cases into Playwright automation:

**For Cursor IDE:**

```
/generate-tests
```

**For Claude Code (claude.ai/code):**

```
/generate-test
```

Both commands invoke the same agent. Answer 4 input prompts:

1. **Requirement** — Feature to test (e.g., "Verify deleting a service updates totals")
2. **Module** — Module name (e.g., "Contract Module")
3. **Documentation file** — Where test cases are documented (e.g., `docs/contract-module-test-steps.md`)
4. **Test output file** — Where to write automation (e.g., `tests/e2e/contract-module.spec.js`)

The agent will run the full 8-phase workflow.

(CRITICAL) All test cases (TC codes) MUST be documented in the docs file first. Never invent TC codes — they must exist in documentation before automation.

**Workflow (8 Phases):**

- **Phase 0**: Pre-flight checks (parse docs, check existing tests, validate env)
- **Phase 1** (optional): Record actual flow with Playwright codegen
- **Phase 2**: Analyze codegen output, extract selectors, map to Page Objects
- **Phase 3**: Update documentation with test scenarios
- **Phase 4**: Update Page Object Model with new methods
- **Phase 5**: Generate automated tests (DELTA only — skip tests already in file)
- **Phase 6**: Validate syntax and standards compliance
- **Phase 7**: Execute tests in headed browser mode
- **Phase 8**: Auto-fix failing tests (up to 3 attempts per test)

**Authoritative references:**

- `@.cursor/commands/generate-tests.md` — Main command documentation (all users)
- `@.claude/agents/generate-playwright-tests.md` — Agent orchestration
- `@.claude/skills/playwright-test-standards/SKILL.md` — All coding standards and constraints

## Performance Notes

The test suite runs in a single worker (sequential execution) for consistency and state management. Key optimization already in place:

- **Single-session pattern** in test specs: Login once per suite, reuse session for all tests (~60% faster than per-test login)
- **Smart waits**: `waitUntil: 'domcontentloaded'` instead of `'networkidle'` where appropriate
- **Selective retries**: Playwright retries failed tests 2x in CI; flaky selectors should use `.or()` for fallbacks

For new test suites, follow the single-session pattern documented in "Test Execution Patterns" above.

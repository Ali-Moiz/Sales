---
name: Skills for playwright-mcp-automation Agent
description: Writing automation functional end-to-end test scripts with Playwright MCP server in browser
---

# Skills — playwright-mcp-automation Agent

This file documents the capabilities, constraints, and decision-making rules for the `playwright-mcp-automation` agent. It is intended to help the agent self-orient at the start of each conversation and help collaborators understand what this agent does and does not do.

---

## Language & Runtime

- All test code is written exclusively in **JavaScript** (`.spec.js` files)
- No TypeScript, no Python, no other test runners (Jest, Cypress, etc.)

---

## Core Capabilities

### 1. Test Authoring

- Write complete end-to-end Playwright spec files
-always write dynamic code and save the values in fxture files for resuse.
- Cover happy paths, edge cases, error states, and boundary conditions
- Name every test following the pattern: `should [expected behavior] when [condition]`
- Group related tests using `test.describe()` blocks
- Use `test.beforeEach` / `test.afterEach` for setup and teardown

### 2. Page Object Model (POM) Architecture

- Create POM classes for every page or component under test
- always use current date or future dates and dont hardcoded any script.
- Encapsulate all locators and user interactions inside POM classes — never inline them in spec files
- Expose readable action methods (e.g., `fillEmail()`, `submit()`) and assertion helpers
- Follow the established file structure:

```
tests/
  pages/      → POM classes
  specs/      → .spec.js test files
  fixtures/   → Custom fixtures and test data
  helpers/    → Utility/shared functions
playwright.config.js
```

### 3. Locator Strategy

Locators are chosen in **strict priority order** — never deviate:

| Priority | Strategy | When to Use |
|----------|----------|-------------|
| 1 | `getByRole()` | Interactive elements (buttons, links, inputs, headings) |
| 2 | `getByLabel()` | Form fields associated with a `<label>` |
| 3 | `getByText()` | Non-interactive elements or content assertions |
| 4 | `getByPlaceholder()` | Inputs identified by placeholder text |
| 5 | `getByTestId()` | When a `data-testid` is explicitly present |
| 6 | `getByAltText()` | Images |
| ❌ | XPath | **Never. Under any circumstance.** |
| ❌ | Fragile CSS classes | **Never. Request a `data-testid` instead.** |

### 4. Test Suite Maintenance

- Refactor and debug existing Playwright test suites
-always use current date or future dates and dont hardcoded any script.
- Identify and fix flaky tests (race conditions, hard waits, unstable selectors)
- Optimize test execution time and reliability
- Enforce locator hygiene across the entire suite

### 5. CI/CD Integration

- Configure Playwright for GitHub Actions, GitLab CI, Azure Pipelines, and Jenkins
- Set up parallelization via workers and sharding across CI agents
- Configure `--reporter=github` for GitHub Actions PR annotations
- Enable screenshot and video capture on failure
- Use environment variables for all base URLs and credentials — **never hardcode**

### 6. Reporting

- Configure HTML, JUnit, and Allure reporters
- Interpret test result output and summarize failures
- Store reports as CI artifacts

### 7. Test Strategy & Planning

- Advise on test pyramid coverage priorities
- Identify which scenarios require e2e vs. unit/integration coverage
- Recommend parallelization and sharding strategies for large suites

---

## Quality Constraints (Non-Negotiable)

- No XPath — ever
- No fragile CSS class selectors
- No inline selectors or actions in spec files (POM always)
- Tests must be fully independent — no shared mutable state
- No hardcoded credentials or base URLs
- All assertions use Playwright's built-in `expect` with web-first assertions
- All files follow consistent naming conventions (`LoginPage.js`, `login.spec.js`)

## DOM Investigation Rule (Zero Tolerance)

**ALWAYS investigate the real DOM BEFORE writing any code.**

The mandatory order for every new task:
1. READ SKILLS.md and existing POM files
2. USE playwright-mcp browser to navigate the live app
3. CAPTURE every field selector in ONE session — not one at a time
4. WRITE code once with verified selectors
5. RUN once to confirm

**Never guess a selector. Never fix selectors iteratively after failures.**
Repeated DOM fixing wastes tokens and is not tolerated. Get it right in one pass.

This rule was added after repeated selector guessing on the TeamSignal Sites module caused 6-7 failed runs and unnecessary token consumption.

---

## TeamSignal Portal — Verified DOM Patterns

These patterns were discovered through real DOM investigation and confirmed passing tests. Apply them immediately without re-investigation.

### Custom Dropdowns (all forms)
All custom dropdowns follow ONE pattern — no exceptions:
```js
// Open
await page.locator('h6').filter({ hasText: 'Select X' }).click();
// Pick option — use exact:true by default, exact:false when option text has leading/trailing whitespace
await page.locator('#simple-popper').getByText('Option Text', { exact: true }).click();
```
⚠️ Some dropdown options have **leading whitespace** (e.g. Checkpoint Type: `" GPS"`, `" Image"`).
Use `exact: false` for those, or pass `false` as the third arg to `selectDropdownOption()`.

### MUI DatePicker
`fill()` is blocked. Use calendar icon strategy:
```js
await page.locator('button[aria-label="Choose date"]').nth(index).click();
// Navigate months via button[aria-label="Next month"]
// Pick day via button[role="gridcell"]
```

### Site Detail Tab Panels
13 tabpanels exist in DOM simultaneously — inactive ones have `hidden` attribute:
```js
// Standard tabs (Contracts, Jobs, Instructions, Locations, Devices, Checkpoints, Attendance):
page.locator('[role="tabpanel"]:not([hidden])')  // exactly 1 visible — use directly

// Nested tabs (Visitors, Loads, Billing) — 2 non-hidden panels exist simultaneously:
page.locator('[role="tabpanel"]:not([hidden])').first()  // outer panel (sub-tab nav)
page.locator('[role="tabpanel"]:not([hidden])').last()   // inner active content
```
⚠️ Using `activeTabPanel` directly on Visitors/Loads/Billing causes a strict mode error (2 matches).

### Contracts / Jobs Tab
Both use MUI Accordion — NOT a `<table>`:
```js
panel.locator('.MuiAccordionSummary-root').first() // accordion row
panel.getByText(/\d+–\d+ of \d+/)                 // pagination count
```
⚠️ Auto-created test sites have 0 jobs — use `openSiteByName('Kenefick')` for Jobs tab tests (11 confirmed jobs).

### FullCalendar (Schedule Page)
```js
page.locator('.fc-event')  // FullCalendar library class — stable, not build-tool generated
```
⚠️ Day view may show 0 events. Always test in **Week view** — confirmed 1,065+ events.

**Extra Hit card identification:**
FullCalendar event card `textContent` does NOT include the job type label ("Extra", "Patrol", etc.). The only way to identify Extra Hit cards is via computed `border-left-color: rgb(241, 159, 2)` on `.fc-event-main > div`. Use `page.evaluate()` scanning `getComputedStyle`:
```js
// Locator — filter by child having orange border class (current build: jss202)
page.locator('.fc-event').filter({ has: page.locator('.fc-event-main > div[class*="jss202"]') })

// Border assertion — scan computed styles, no class dependency
await page.evaluate(() => {
  const orangeCard = Array.from(document.querySelectorAll('.fc-event-main > div'))
    .find(div => window.getComputedStyle(div).borderLeftColor === 'rgb(241, 159, 2)');
  return orangeCard ? window.getComputedStyle(orangeCard).borderLeftColor : null;
});
```
⚠️ The JSS suffix (`jss202`) is build-deterministic but can shift after redeployment. If it breaks, find the new number by scanning `.fc-event-main > div` computed styles for `rgb(241, 159, 2)`.

**Site Schedule tab URL:**
`/app/obx/sites/sitesDetail/{id}?activeTab=duty&value=0` — the param is `duty`, NOT `schedule`.

### Draft.js Rich Text Editor (Instructions Tab)
NOT a `<textarea>` — `fill()` does not work:
```js
await page.locator('[contenteditable][role="textbox"]').click();
await page.keyboard.type('Your text');
```

### Visitors / Loads / Billing Tabs — Inner Sub-Tabs
Each has 3 inner sub-tabs. Default active sub-tab in each:

| Tab | Sub-tabs | Default | Default inner panel content |
|-----|----------|---------|----------------------------|
| Visitors | Visitors Log, Template, Officers | Visitors Log | Table: Name, Status, Visitor Type, Phone, Check in/out Date & Time, Created By |
| Loads | Loads Log, Template, Officers | Loads Log | Table: Vehicle Number, Status, Load Type, In-bound Date & Time, Out-bound Date & Time, Created By |
| Billing | Billing Details, Merged Invoices, Contacts | Billing Details | Editable form (no table) + "Update" button |

Empty state text for all tabs: `"No Record Found"`

### Devices Tab
Read-only — confirmed column headers: ID, Device Name, Type, Installation Date, Last Scanned On, Last Scanned By, Site Location.
No create/add button. Empty state: `"No Record Found"`.

### Checkpoint Creation Drawer
```js
// Button to open: panel.getByRole('button', { name: /create a checkpoint/i })
// Drawer selector: .MuiDrawer-paper
// Required fields:
//   1. Checkpoint Type — h6 "Select Checkpoint Type" + #simple-popper (options: " GPS", " Image" — leading space, use exact:false)
//   2. Location       — h6 "Select Location" + #simple-popper (lists existing site locations)
// Submit button text: "Create Checkpoint" (NOT "Save")
// On success: drawer closes automatically
await drawer.getByRole('button', { name: /^create checkpoint$/i }).click();
```
⚠️ MUI Drawer does NOT close on `Escape` — submit the form or click the Cancel button.

### Location Row — Kebab Menu
```js
// 3-dot icon (no aria-label): row.locator('button.MuiIconButton-root')
// Opens MUI Popover with: "Edit" | "Delete"
page.locator('[class*="MuiPopover-paper"]').getByText('Delete').click();
```
May show a MUI Dialog confirmation — handle with:
```js
const dialog = page.locator('[role="dialog"]');
if (await dialog.isVisible()) {
  await dialog.getByRole('button', { name: /yes|confirm|delete|ok/i }).first().click();
}
```

### Reports Module
- Read-only in the web portal — reports are created via mobile app only
- No "Create Report" button exists in the web UI
- Test only: tab visibility + row presence + pagination count

### Phone Field
```js
page.getByPlaceholder('Enter phone number')  // react-phone-number-input component
```

### Invoices Module (Confirmed via live DOM investigation 2026-04-05)

**URL**: `/app/obx/invoices`
**Total records**: 5105+
**Invoice Number format**: `US_<integer>` (e.g. `US_156650`) — NOT the format described in some user stories

**Column headers** (exact, confirmed):
```
Invoice Number | Customer ID | Site Name | Type | Contract | Invoice Date |
Due Date | Status | Invoice Duration | Line Item Total ($) | Tax Amount ($) |
Grand Total ($) | Report Distributed At | (action column — no heading)
```

**Action column** (last column, no heading text):
- `page.locator('span[aria-label="Push to Sage"]')` — approve action, it is a `<span>`, NOT a `<button>`
- `button[aria-label="Resync with Payroll"]` — resync button
- Two additional unnamed buttons (preview and other)

**Filters**:
```js
// Invoice number search
page.getByPlaceholder('Search by Invoice Number')

// Date range — ALWAYS use getByRole, NOT getByPlaceholder (MUI renders two elements with the same placeholder → strict mode violation)
page.getByRole('textbox', { name: 'MM/DD/YYYY - MM/DD/YYYY' })

// Status dropdown — h6+popper pattern
page.locator('h6').filter({ hasText: /^all statuses$/i })

// Type dropdown — h6+popper pattern
page.locator('h6').filter({ hasText: /^all types$/i })
```

**Bulk select**: `page.locator('tbody tr input[type="checkbox"]')` — unnamed checkboxes, 1 per row

**Top-level buttons**: `Create Invoice`, `Export`, `Invoice Reconciliation`, `Resync with Payroll`

**Default sort**: Pending invoices appear first (first row Status cell contains "Pending")

**Navigation**: `SitesPage.gotoInvoices()` method navigates to `/app/obx/invoices`

### Billing Tab — Inner Tablist (Site Detail)

The Billing tab within site detail has a nested MUI tablist with `aria-label="basic tabs example"`:
```js
// Scope to inner billing tablist
page.getByRole('tablist', { name: /basic tabs example/i })

// Sub-tabs (click to navigate between them)
page.getByRole('tab', { name: /^billing details$/i })    // default selected
page.getByRole('tab', { name: /^merged invoices$/i })
page.getByRole('tab', { name: /^contacts$/i })
```

⚠️ Kenefick site (ID 17538) and all investigated sites have ZERO merged invoices. "No Merged Invoices!" is the empty state text for the Merged Invoices sub-tab. For invoice content assertions, always use the global Invoices module at `/app/obx/invoices`, not the site-level Billing tab.

### Date Range Input — MUI Strict Mode Trap

`getByPlaceholder('MM/DD/YYYY - MM/DD/YYYY')` matches 2 elements simultaneously:
1. The MUI wrapper `<div>` (which inherits the placeholder attribute)
2. The actual `<input>` element

This causes a strict mode violation. **Always use**:
```js
// CORRECT
page.getByRole('textbox', { name: 'MM/DD/YYYY - MM/DD/YYYY' })

// WRONG — strict mode violation
page.getByPlaceholder('MM/DD/YYYY - MM/DD/YYYY')
```

---

## DOM Investigation Fallback — Playwright Spec Script

When the MCP browser session is unavailable (e.g. after a `--headed` test run closes Chromium), use a temporary spec file to extract DOM data instead of MCP tools.

### Why MCP Session May Be Unavailable

Running `npx playwright test --headed` closes all Chromium instances, including the MCP browser session. After this, `mcp__playwright__browser_navigate` throws `"Target page, context or browser has been closed"`.

### Recovery: Write a Temporary Investigation Spec

```js
// tests/tmp-investigate.spec.js
import { test } from '@playwright/test';

test('investigate X', async ({ page }) => {
  await page.goto('/app/obx/invoices');
  await page.waitForLoadState('networkidle');

  const headers = await page.evaluate(() =>
    Array.from(document.querySelectorAll('th'))
      .map(el => el.textContent?.trim())
      .filter(Boolean)
  );
  console.log('HEADERS:', JSON.stringify(headers));

  // Add more evaluate() calls as needed to extract selectors, aria-labels, etc.
});
```

Run it:
```bash
npx playwright test tests/tmp-investigate.spec.js --project=chromium --reporter=list
```

Delete after use:
```bash
rm tests/tmp-investigate*.spec.js
```

**Never leave temp investigation specs in the repo.**

---

## User Story vs Live DOM — Gap Detection Rule

When a user story AC describes UI text or data that does not match the live DOM, **write tests to match the LIVE DOM** so tests pass green. Document the gap in a comment inside the test.

Examples of gaps found in this project (2026-04-05):

| User Story AC | Live DOM Reality |
|---------------|-----------------|
| "Invoices" tab | Actual tab name: "Merged Invoices" |
| "Billing Information" tab | Actual tab name: "Billing Details" |
| Invoice format `US1234567_67` | Actual format: `US_156650` |
| 4 status types described | Only "Pending" visible in live data |

---

## Lessons Learned — Applied Going Forward

| Lesson | Rule |
|--------|------|
| Guessing selectors caused 6-7 failed runs | Investigate DOM first, always — one session, all fields |
| Auto-created sites have 0 jobs | Use named sites with known data for Jobs tab |
| Day view calendar may be empty | Always use Week view for schedule tests |
| Reports have no Create button on web | Scope reports tests to read/view only |
| Visitors/Loads/Billing have nested tabpanels | Use `.first()` / `.last()` — not `activeTabPanel` directly |
| Draft.js editor ignores `fill()` | Use `click()` + `keyboard.type()` |
| Checkpoint Type options have leading space | Use `exact: false` for those options |
| MUI Drawer doesn't close on Escape | Use the explicit Cancel button or submit the form |
| `count >= 0` assertion always passes | Never write `expect(count).toBeGreaterThanOrEqual(0)` — assert real content |
| Read-only tabs need a negative assertion | Always assert absence of create/edit buttons on read-only tabs |
| Tests that create data must clean up | Assert the deletion too — cleanup is part of the test |
| Creating test data every run pollutes the environment | Use known pre-existing data (ID/name) for verification-only tests |
| Test independence from other tests | Each test must create its own preconditions — never depend on another test's side effects |
| `--headed` test run kills MCP browser session | Use a tmp-investigate.spec.js file when MCP session is gone — delete after use |
| MUI date range input has two elements with same placeholder | Always use `getByRole('textbox', { name: 'MM/DD/YYYY - MM/DD/YYYY' })` — never `getByPlaceholder()` for date ranges |
| User story AC may not match live DOM | Write tests against live DOM, not AC text — document the gap in a test comment |
| Billing > Merged Invoices is empty on all investigated sites | Use global `/app/obx/invoices` module for invoice content assertions, not site Billing tab |
| Push to Sage action is a `<span>`, not a `<button>` | Use `page.locator('span[aria-label="Push to Sage"]')` — getByRole('button') will not find it |
| JSS counter-based class names break every session | Never use `.jss*` selectors — they reset on each browser session and app reload |
| FullCalendar card text doesn't include job type | `hasText: 'Extra'` on `.fc-event` finds zero elements — job type label is not in card textContent |
| Extra Hit cards identified only by computed border color | Use `getComputedStyle(div).borderLeftColor === 'rgb(241, 159, 2)'` on `.fc-event-main > div` |
| Feature tab tests belong in existing spec file | Add a nested `test.describe` block to the existing module spec — do NOT create a new file |
| 5 parallel headed browsers cause navigation timeouts | Use `--workers=2` for headed runs to avoid flaky timeouts |

---

## Test Coverage Counts (as of 2026-04-05)

| Module | Spec File | Test ID Range | Count |
|--------|-----------|---------------|-------|
| Sites (smoke) | sites.smoke.spec.js | SMOKE-SITE-001 to SMOKE-SITE-047 | 47 |
| All modules total | — | — | 136 |

Next available Sites smoke ID: **SMOKE-SITE-048**

---

## Limitations & Out-of-Scope

- Does not write tests in TypeScript (JS only)
- Does not write test cases without my permission
- Does not create too many functions — keep POM lean
- Does not use other test frameworks (Cypress, Selenium, Jest, etc.)
- Does not handle CAPTCHA solving
- Does not automate native desktop dialogs (OS-level prompts)
- If an element has no accessible role, label, or `data-testid`, this agent will flag it as a **testability issue** and ask the dev team to add a `data-testid` rather than using a fragile workaround

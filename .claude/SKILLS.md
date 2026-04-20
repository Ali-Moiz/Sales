# Playwright MCP Integration Skills — TeamSignal Portal

## Overview

This document is the authoritative reference for how to use the Microsoft Playwright MCP server tools within this project. Read this before writing any selector, POM code, or spec file. Violating the DOM-first protocol wastes tokens and causes repeated failures.

---

## MCP Tool Reference

| Tool | Purpose |
|------|---------|
| `mcp__playwright__browser_navigate` | Navigate to a URL |
| `mcp__playwright__browser_snapshot` | Capture accessibility tree (preferred over screenshot for DOM investigation) |
| `mcp__playwright__browser_take_screenshot` | Capture visual screenshot |
| `mcp__playwright__browser_click` | Click an element by `ref` from snapshot |
| `mcp__playwright__browser_type` | Type into a focused element |
| `mcp__playwright__browser_fill_form` | Fill multiple form fields at once |
| `mcp__playwright__browser_select_option` | Select a `<select>` option |
| `mcp__playwright__browser_press_key` | Press a keyboard key |
| `mcp__playwright__browser_hover` | Hover over an element |
| `mcp__playwright__browser_drag` | Drag one element to another |
| `mcp__playwright__browser_evaluate` | Run JavaScript against the page or a specific element |
| `mcp__playwright__browser_run_code` | Execute a full Playwright snippet (`async (page) => { ... }`) |
| `mcp__playwright__browser_wait_for` | Wait for a text or URL condition |
| `mcp__playwright__browser_navigate_back` | Go back one page in history |
| `mcp__playwright__browser_network_requests` | Inspect in-flight network requests |
| `mcp__playwright__browser_console_messages` | Read browser console output |
| `mcp__playwright__browser_handle_dialog` | Accept or dismiss an alert/confirm dialog |
| `mcp__playwright__browser_file_upload` | Upload a file via an `<input type="file">` |
| `mcp__playwright__browser_resize` | Resize the browser viewport |
| `mcp__playwright__browser_tabs` | List or switch between open tabs |
| `mcp__playwright__browser_close` | Close the browser |

---

## Rule 1: DOM Investigation Protocol (Zero Tolerance)

**Never write a selector without first observing it in the live browser.**

The correct sequence every time:

```
1. mcp__playwright__browser_navigate  → go to the page
2. mcp__playwright__browser_snapshot  → read accessibility tree
3. Interact as needed (click, fill)   → observe state changes
4. mcp__playwright__browser_snapshot  → confirm post-interaction DOM
5. Write POM code using CONFIRMED selectors
6. Run tests once — no iterative selector guessing
```

Snapshot returns `ref` values (e.g. `e42`, `e107`). Those refs are only valid during the current browser session. Never embed refs in POM code — translate them into semantic Playwright locators (`getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`, `getByTestId`, `getByAltText`) before writing to `.page.js` files.

---

## Rule 2: Snapshot Is Preferred Over Screenshot

`mcp__playwright__browser_snapshot` returns the accessibility tree as text. It is faster, cheaper (no image tokens), and gives you exact role, name, and state attributes needed to write correct locators.

Use `mcp__playwright__browser_take_screenshot` only when:
- You need to confirm a visual layout (e.g. a chart rendered correctly)
- The element has no accessible role and you need to understand its position
- You are debugging a visual regression

Use `depth` parameter on snapshot to limit noise when investigating deeply nested components:
```
mcp__playwright__browser_snapshot { depth: 4 }
```

---

## Rule 3: browser_run_code Is the Power Tool for Complex Interactions

`mcp__playwright__browser_run_code` executes a full Playwright snippet in the context of the live page. Use it to:
- Run multi-step sequences in a single call (navigate + interact + assert)
- Debug timing issues with `waitForSelector`, `waitForTimeout`
- Confirm a complete selector chain before committing it to POM code

```javascript
// Example: confirm dropdown interaction pattern
async (page) => {
  await page.locator('h6').filter({ hasText: 'Select Billing Frequency' }).click();
  await page.waitForSelector('#simple-popper', { state: 'visible' });
  const options = await page.locator('#simple-popper p').allTextContents();
  return options;
}
```

`browser_evaluate` is lighter — use it when you need to read a DOM property or run a quick JS expression against a single element:
```javascript
// Example: read input value after interaction
async (element) => element.value
// with ref: pointing to the input element ref from snapshot
```

---

## Rule 4: Locator Priority Order

Translate refs from snapshots into POM code using this priority order (same as project standard):

1. `getByRole()` — interactive elements (button, link, textbox, combobox, tab, columnheader, gridcell, heading)
2. `getByLabel()` — form inputs with associated `<label>`
3. `getByText()` — non-interactive content, KPI card labels, status chips
4. `getByPlaceholder()` — inputs identified by placeholder (common in MUI forms that skip `<label>`)
5. `getByTestId()` — only when `data-testid` is explicitly present
6. `getByAltText()` — images

Never use XPath. Never use CSS class selectors that are implementation-specific (e.g. `.jss124`, `.MuiBox-root`, `.css-0`). The only acceptable CSS selectors in POM code are:
- `a[href*="siteUpdate"]` — stable href attributes for navigation links
- `input[name="fieldName"]` — stable `name` attributes on form inputs
- `button[role="gridcell"]` — for MUI DatePicker day buttons (confirmed pattern)
- `[role="tabpanel"]:not([hidden])` — for active tab panel scoping

---

## TeamSignal-Specific MCP Investigation Patterns

### Investigating a Custom MUI Dropdown (h6 + #simple-popper)

TeamSignal uses custom div-based dropdowns, not native `<select>`. The pattern:

```
1. mcp__playwright__browser_snapshot   → identify the h6 trigger text (e.g. "Select Billing Frequency")
2. mcp__playwright__browser_click      → click the h6 ref
3. mcp__playwright__browser_snapshot   → confirm #simple-popper is now visible
4. Read option text exactly            → note leading/trailing spaces (e.g. " GPS" has a leading space)
```

POM code produced:
```javascript
await page.locator('h6').filter({ hasText: 'Select Billing Frequency' }).click();
await page.locator('#simple-popper').getByText('Monthly', { exact: false }).click();
```

Use `{ exact: false }` for any option that might have leading/trailing whitespace (confirmed: Checkpoint Type options are `" GPS"` and `" Image"`).

### Investigating MUI DatePicker

```
1. mcp__playwright__browser_snapshot   → locate the calendar icon button (aria-label="Choose date")
2. mcp__playwright__browser_click      → click it
3. mcp__playwright__browser_snapshot   → confirm dialog[role="dialog"] appeared
4. mcp__playwright__browser_snapshot   → read calendar header text for month/year label selector
5. mcp__playwright__browser_click      → click "Next month" button to navigate
6. mcp__playwright__browser_snapshot   → confirm header changed
7. mcp__playwright__browser_click      → click a day gridcell button
```

Do NOT attempt `fill()` directly on the date input segments — this is confirmed broken. Always use the calendar icon strategy.

### Investigating Nested TabPanels (Visitors / Loads / Billing)

```
1. mcp__playwright__browser_navigate   → go to site detail page
2. mcp__playwright__browser_click      → click "Visitors" tab
3. mcp__playwright__browser_snapshot   → count [role="tabpanel"]:not([hidden]) elements
4. If count === 2: outer = .first(), inner active content = .last()
5. mcp__playwright__browser_snapshot { depth: 3 } scoped to inner panel
   → read table column headers and row data
```

Tabs that produce TWO simultaneous non-hidden tabpanels: Visitors, Loads, Billing.
Tabs that produce ONE non-hidden tabpanel: all others (General Information, Contracts, Jobs, Locations, Devices, Checkpoints, Attendance).

### Investigating MUI Accordion (Contracts / Jobs tab)

```
1. mcp__playwright__browser_click      → click "Contracts" tab
2. mcp__playwright__browser_snapshot   → list .MuiAccordionSummary-root items
3. mcp__playwright__browser_click      → click a summary row to expand
4. mcp__playwright__browser_snapshot   → read expanded content (service rows)
```

Auto-created test sites have 0 jobs. Always use the Kenefick site (ID: 17538) for Jobs tab testing.

### Investigating a MUI Drawer

```
1. mcp__playwright__browser_click      → click the "Create a Checkpoint" button
2. mcp__playwright__browser_snapshot   → confirm .MuiDrawer-paper is visible
3. Read all field refs in one snapshot  → capture all form field text and refs
4. Do NOT press Escape to close         → drawer ignores Escape
5. mcp__playwright__browser_click      → click "Cancel" or the submit button to close
```

### Investigating Draft.js Rich Text Editor (Instructions tab)

```
1. mcp__playwright__browser_click      → click the editor area
2. mcp__playwright__browser_evaluate   → confirm element is [contenteditable][role="textbox"]
3. DO NOT use browser_fill_form        → fill() does not work on Draft.js
4. mcp__playwright__browser_type       → type text character by character
   OR
   mcp__playwright__browser_run_code   → page.keyboard.type('text')
```

### Investigating FullCalendar Events (Schedules)

```
1. mcp__playwright__browser_navigate   → go to /app/obx/schedules
2. mcp__playwright__browser_click      → click "Week" view button first
3. mcp__playwright__browser_snapshot   → look for .fc-event elements
4. mcp__playwright__browser_evaluate   → () => document.querySelectorAll('.fc-event').length
```

Always test FullCalendar in Week view — event slots are more reliably visible and clickable than in Month view.

**Identifying Extra Hit cards:**
FullCalendar event `textContent` does NOT include the job type label — `hasText: 'Extra'` finds nothing. The only distinguishing feature is `border-left-color: rgb(241, 159, 2)` on `.fc-event-main > div`. Scan via `getComputedStyle()` — never rely on `.jss*` classes which change every session.

**Site Schedule tab URL param:** `activeTab=duty` (NOT `activeTab=schedule`)

---

## Workflow: Writing a New POM from Scratch

### Step 1 — Navigate and Capture

```
mcp__playwright__browser_navigate { url: "https://portal.teamsignal.com/app/obx/sites" }
mcp__playwright__browser_snapshot { depth: 4 }
```

### Step 2 — Interact Through the Entire Flow

Open every relevant state in a single session. Example for Sites CRUD:
- Sites list (snapshot)
- Click "Create Site" (snapshot of form)
- Fill and submit (snapshot of validation errors)
- Cancel (snapshot of list again)
- Click a site row (snapshot of detail page)

Do not close the browser between investigation and coding. Capture ALL selectors before you start writing.

### Step 3 — Translate Refs to Locators

From snapshot output like:
```
- textbox "Search by Site Name" [ref=e42]
- button "+ Create Site" [ref=e89]
- columnheader "Site Name" [ref=e112]
```

Write POM:
```javascript
this.searchInput   = page.getByPlaceholder(/search by site name/i);
this.createSiteBtn = page.getByRole('link', { name: /create site/i });
this.siteNameHeader = page.getByRole('columnheader', { name: /site name/i });
```

### Step 4 — Verify with browser_run_code Before Committing

```javascript
async (page) => {
  const el = await page.getByPlaceholder(/search by site name/i);
  return await el.isVisible();
}
```

If this returns `true`, write the locator. If `false`, go back to snapshot and re-investigate.

---

## browser_fill_form Usage

`mcp__playwright__browser_fill_form` fills multiple fields in one call. Use it during investigation to simulate user form input efficiently. It requires `ref` values from a snapshot.

```
fields: [
  { name: "Site Name", type: "textbox", ref: "e42", value: "Test Site" },
  { name: "Company Name", type: "textbox", ref: "e55", value: "ACME Corp" }
]
```

Field types: `textbox`, `checkbox`, `radio`, `combobox`, `slider`.

Note: This tool is for investigation sessions only. POM code uses typed Playwright locators, not refs.

---

## Auth During MCP Investigation Sessions

The global setup saves auth state to `.auth/user.json`. When the MCP browser opens a fresh session, it does NOT automatically have this state.

To investigate authenticated pages, navigate to the login page first and authenticate manually via MCP tools:

```
mcp__playwright__browser_navigate { url: "https://portal.teamsignal.com/login" }
mcp__playwright__browser_fill_form {
  fields: [
    { name: "Email", type: "textbox", ref: "<email_ref>", value: "oliver.ryan@yopmail.com" },
    { name: "Password", type: "textbox", ref: "<pwd_ref>", value: "Admin@123" }
  ]
}
mcp__playwright__browser_click { ref: "<login_btn_ref>" }
mcp__playwright__browser_wait_for { text: "dashboard" }
```

Then proceed with the investigation. Credentials are in `.env` (`TEST_USER_EMAIL` / `TEST_USER_PASSWORD`).

---

## Network and Console Tools

Use `mcp__playwright__browser_network_requests` to confirm API calls after form submission (useful when a success toast does not appear or a URL does not change as expected).

Use `mcp__playwright__browser_console_messages` to catch React warnings, failed API responses, or JavaScript errors that explain why an element is not behaving as expected.

These two tools are diagnostic — use them when the snapshot after interaction does not match your expectation.

---

## Known Data for Investigation

| Entity | Value |
|--------|-------|
| Test user email | `oliver.ryan@yopmail.com` |
| Test user password | `Admin@123` |
| Known vehicle | Reg: `LEO7777`, Make/Model: `Toyota Yaris 25`, ID: `976` |
| Site with jobs | Kenefick (ID: 17538) — 11 jobs, 1 location ("gate", ID 36925), 4 attendance rows |
| Auto-created test sites | Have 0 jobs — do not use for Jobs tab tests |
| Total reports in system | 22 (as of April 2026) |

---

## Anti-Patterns (Never Do These)

| Anti-Pattern | Correct Approach |
|---|---|
| Guess a selector from memory | Run `browser_snapshot` first |
| Use `browser_screenshot` for DOM investigation | Use `browser_snapshot` — it gives text refs |
| Embed snapshot `ref` values in POM code | Translate refs to semantic Playwright locators |
| Use `fill()` on Draft.js editor | Use `page.keyboard.type()` |
| Press Escape to close MUI Drawer | Click Cancel button or submit button |
| Use `[role="tabpanel"]:not([hidden])` directly on Visitors/Loads/Billing | Use `.first()` / `.last()` |
| Assert `count >= 0` | Assert specific visible content |
| Use XPath | Never, for any reason |
| Use fragile CSS class selectors (`.jss124`, `.MuiBox-root`) | Use role/label/text/placeholder selectors |
| Use `.jss*` class names in any selector | They reset every session — use computed styles, Emotion hashes, or semantic attributes |
| Use `hasText: 'Extra'` to find FullCalendar Extra Hit cards | Job type is not in card textContent — use `getComputedStyle` border color scan |
| Create a new spec file for a new feature tab | Add a nested `test.describe` block to the existing module spec file |
| Run headed mode with 5 workers | Use `--workers=2` for headed runs to avoid navigation timeouts |
| Hardcode dates | Use dynamic date calculation |
| Hardcode credentials | Use `process.env.TEST_USER_EMAIL` |
| Create data to read it in a verification-only test | Use pre-existing known data (Kenefick, LEO7777) |
| Create data without cleaning it up | Always delete and assert `toHaveCount(0)` |

---

## ESM Module Rules (Required)

All files in this project use ESM. Every file must follow:
```javascript
// Correct imports
import { test, expect } from '../../fixtures/base.fixture.js';
import { SitesPage } from '../../pages/sites.page.js';

// Correct exports
export class SitesPage { ... }
```

Never use `require()` or `module.exports`. The `.js` extension is required on all import paths.

---

## File Naming and Location

| Type | Location | Pattern |
|------|----------|---------|
| POM class | `/pages/` | `{module}.page.js` |
| Spec file (smoke) | `/tests/smoke/` | `{module}.smoke.spec.js` |
| Spec file (CRUD) | `/tests/crud/` | `{module}.crud.spec.js` |
| Base fixture | `/fixtures/` | `base.fixture.js` |
| Global setup | `/utils/` | `global.setup.js` |

New POM classes must be:
1. Created in `/pages/`
2. Imported in `/fixtures/base.fixture.js`
3. Registered as a fixture in the `test.extend({})` block

---

## Test ID Format

```
SMOKE-{MODULE}-{NNN}   (smoke tests)
CRUD-{MODULE}-{NNN}    (CRUD tests)
```

| Module | Token |
|--------|-------|
| Auth | AUTH |
| Dashboard | DASH |
| Vehicles | VEH |
| Users | USR |
| Sites | SITE |
| Schedules | SCH |
| Dispatch | DIS |
| Reports | RPT |

Numbers are zero-padded to 3 digits. The ID is embedded in the test title string, not as a separate annotation. The `@smoke` or `@crud` tag goes on `test.describe()`, not individual tests.

---

## Quick Reference: Confirmed TeamSignal Locator Patterns

```javascript
// Custom MUI dropdown (h6 + #simple-popper)
await page.locator('h6').filter({ hasText: 'Select Billing Frequency' }).click();
await page.locator('#simple-popper').getByText('Monthly', { exact: false }).click();

// MUI DatePicker (calendar icon strategy — fill() is broken)
const calBtn = inputLocator.locator('..').locator('..').locator('button[aria-label="Choose date"]');
await calBtn.click();
// then navigate months and click gridcell day button

// Active tab panel (single panel)
page.locator('[role="tabpanel"]:not([hidden])')

// Active tab panel (nested — Visitors / Loads / Billing)
page.locator('[role="tabpanel"]:not([hidden])').first()  // outer sub-tab nav
page.locator('[role="tabpanel"]:not([hidden])').last()   // inner active content

// MUI Accordion summary
panel.locator('.MuiAccordionSummary-root').first()

// FullCalendar events (always in Week view)
page.locator('.fc-event')

// Draft.js editor
await page.locator('[contenteditable][role="textbox"]').click();
await page.keyboard.type('text');

// Pagination count (en-dash, not hyphen)
page.getByText(/\d+–\d+ of \d+/)

// Site name click to navigate (React onClick handler, not <a> tag)
page.locator('tbody tr').filter({ hasText: siteName }).getByText(siteName).click()

// Edit link on site detail (no text label, no aria-label)
page.locator('a[href*="siteUpdate"]')

// Row context menu (kebab icon)
row.locator('button.MuiIconButton-root').click()
// then:
page.getByRole('menuitem', { name: /^delete$/i })

// Checkpoint validation errors (double space is intentional)
drawer.getByText('Checkpoint  Type is required.')
drawer.getByText('Location is required.')

// Status chip
page.locator('.MuiChip-root').filter({ hasText: /^functional$/i })

// Sidebar nav links (stable href values)
page.locator('a[href="/app/obx/sites"]')
```

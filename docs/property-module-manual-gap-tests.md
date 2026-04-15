# Property module — manual test cases (gaps vs existing Playwright)

This document lists **only** scenarios from the stakeholder checklist that are **not fully covered** (or not covered at all) by the current Playwright suite, so QA or automation authors can execute them manually and later translate them into tests.

**Environment:** Load credentials from the project **`.env`** file (same variables used by Playwright: `BASE_URL`, `SIGNAL_EMAIL`, `SIGNAL_PASSWORD`). Do not commit real passwords.

**Sign-in (manual):**

1. Open a browser and navigate to `BASE_URL` (include trailing slash if that is how it is stored; the app should redirect as needed).
2. Complete the login flow until you land in the Signal Sales app (URL path typically contains `/app/sales/`).
3. Use the email and password from `.env` (`SIGNAL_EMAIL`, `SIGNAL_PASSWORD`).

**Existing automation map (do not duplicate these as new manual-only smoke unless you need regression depth):**

| Stakeholder point                  | Existing Playwright coverage (approx.)                                           |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| Create new property                | `tests/e2e/property-module.spec.js` — TC-PROP-007                                |
| View property details              | TC-PROP-008, TC-PROP-009, TC-PROP-010                                            |
| Edit property                      | TC-PROP-012, TC-PROP-013                                                         |
| Link franchise (during create)     | `createProperty()` → `selectAssociatedFranchise()` in `pages/property-module.js` |
| Notes add / edit / delete          | `registerNotesTasksSuite` — `NT-Property-N*` in same spec file                   |
| Add tasks                          | `NT-Property-T007`                                                               |
| Mark task complete                 | `NT-Property-T015`                                                               |
| Create Property opens from listing | TC-PROP-004                                                                      |
| Cancel closes without saving       | TC-PROP-006                                                                      |
| Company dropdown search            | TC-PROP-005                                                                      |
| Duplicate / blocked address        | TC-PROP-018                                                                      |

---

## M-PROP-01 — Verify that the Create Property modal displays all expected fields, labels, and mandatory (\*) indicators.

**Gap vs automation:** TC-PROP-004 checks that major controls are visible but does not systematically assert every label, helper text, and asterisk for required fields.

**Objective:** Document the exact UI copy and required indicators for future `expect` assertions.

**Preconditions:** Logged in; on Properties list (`/app/sales/locations`).

**Steps:**

1. Click **Create Property** on the list page.
2. Wait until the drawer shows heading **Create Property** (level 3).
3. Without filling anything, scroll the entire drawer from top to bottom once.
4. For each field group, record in your notes:
   - Visible label text (exact spelling and casing).
   - Whether a **required** asterisk `*` appears next to the label or in the accessible name (compare with `getByRole` / label locators in automation).
5. Confirm presence (visibility) of at least these conceptual groups (wording may vary slightly by release):
   - Company search / selection
   - Property name
   - Property source
   - Associated franchise
   - Stage
   - Property affiliation controls
   - Assignee
   - Contact selection (if applicable on your tenant)
   - Address
   - Primary action **Create Property** and secondary **Cancel**

**Expected:**

- All mandatory fields required for a successful submit are marked consistently (same pattern as other drawers in the app).
- No duplicate or overlapping labels that would confuse automation locators.

**Data for Playwright later:** Prefer `getByRole('heading', { level: 6, name: '...' })` for MUI “section” triggers, and `getByRole('textbox', { name: /.../ })` for inputs, matching `pages/property-module.js`.

---

## M-PROP-02 — Verify that the close (X) icon closes the Create Property modal without saving any data.

**Gap vs automation:** Only **Cancel** is automated (TC-PROP-006). Dismiss via header/icon is not asserted.

**Objective:** Confirm that the user can exit via the non-Cancel close affordance and that no partial record is created.

**Preconditions:** Logged in; on Properties list.

**Steps:**

1. Open **Create Property**.
2. Fill **Property / Property Name** with a distinctive string, for example: `MANUAL-X-CLOSE-DELETE-ME`.
3. Optionally select a company and type a few characters into address (do not complete a full successful create).
4. Locate the **dismiss** control for the drawer (common patterns: top-right icon in the drawer header, or an icon button adjacent to the title). Use browser devtools if needed to find `aria-label` or `title` for stable selectors.
5. Click that dismiss control once.
6. Wait until the **Create Property** heading (level 3) is no longer visible.

**Expected:**

- Drawer closes.

7. In the list search box, search for `MANUAL-X-CLOSE-DELETE-ME`.

**Expected:**

- No new property with that exact name appears (pagination may show `0–0 of 0` or no matching row).

**Playwright hint:** After you identify the real `aria-label` or structure, add something like `page.getByRole('button', { name: '...' })` scoped to the drawer root.

---

## M-PROP-03 — Verify that validation message appear if user try to create a property by clicking on the 'Create Property' button when mandatory fields are empty

**Gap vs automation:** No dedicated test asserts all validation messages when submitting an empty form.

**Objective:** Capture exact validation strings and where they appear (inline vs toast).

**Preconditions:** Logged in; on Properties list.

**Steps:**

1. Open **Create Property**.
2. Do not fill any field (fresh drawer).
3. Click the drawer’s primary **Create Property** submit button (the one inside the drawer footer, not the list page button if two exist).
4. Wait up to 3 seconds for inline errors, helper text, or toast messages.

**Expected (UAT sample observed during exploration — re-verify on your build):**

- At minimum, messages such as:
  - `Property / Property Name is required.`
  - `Address is required.`
- Drawer remains open so the user can correct inputs.

**Steps (continued):**

5. Fill only property name; leave address empty; submit again. Record which messages persist or change.
6. Select company and complete address autocomplete but clear property name; submit. Record behavior.

**Playwright hint:** Use `getByText(/Property \\/ Property Name is required/i)` and similar, scoped to the drawer if needed to avoid cross-page matches.

---

## M-PROP-04 — Verify that the Company dropdown opens and lists companies correctly.

**Gap vs automation:** TC-PROP-005 focuses on **search** in the tooltip, not on “open and scroll default list”.

**Objective:** Ensure companies load and list renders when the user only opens the control.

**Preconditions:** Create Property drawer open.

**Steps:**

1. Click the **Search Company** (or equivalent) heading to open the company picker tooltip/popover.
2. Do not type in the search field yet.
3. Observe whether a scrollable list of companies appears (paragraph/cell rows).
4. Scroll to the bottom of the first “page” of results if virtualized.

**Expected:**

- List is non-empty in a typical UAT dataset, or an intentional empty state with messaging.
- No JavaScript error overlay; tooltip stays open until dismissed.

---

## M-PROP-04A — Verify that clicking `+ Create New` in Company section opens the Create New Company flow.

**Gap vs automation:** Not directly covered in current Playwright property suite; automation focuses on selecting an existing company.

**Objective:** Validate end-to-end `+ Create New` behavior from Create Property drawer, including open/close controls, validation affordance, and return-to-property-form behavior.

**Preconditions:**

- User logged in with valid `.env` credentials.
- Navigate to **Properties** and open **Create Property** drawer.
- Company section with `+ Create New` link is visible.

### Scenario A — Positive: open Create New Company flow

**Steps:**
1. Click `+ Create New` in Company section.
2. Observe modal/drawer that appears.

**Expected:**
- **Create a New Company** flow opens.
- Form contains company creation controls (Company Name, Market Vertical, Address, etc.).
- Parent Create Property drawer remains in background.

### Scenario B — Positive: close behavior (Cancel and X)

**Steps:**
1. Open **Create a New Company** flow.
2. Click **Cancel**.
3. Reopen and click top-right **X**.

**Expected:**
- Both actions close company flow cleanly.
- User returns to Create Property drawer without app error.

### Scenario C — Edge: repeated click stability

**Steps:**
1. Double-click `+ Create New` rapidly.
2. Repeat open/close cycle 3-5 times.

**Expected:**
- Only one company modal opens per action.
- No duplicate overlays, UI freeze, or stacked dialogs.

### Scenario D — Validation state: Create Company button gating

**Steps:**
1. Open company flow and leave all fields empty.
2. Observe **Create Company** button state.
3. Fill only **Company Name**.
4. Re-check button state before filling other required fields.

**Expected:**
- Button disabled when required fields are incomplete.
- Button enabled only after all required fields are valid (as per product rules).

**Observed on UAT (manual probe):**
- Button was enabled after partial entry (Company Name only).  
- Needs confirmation whether this is intended or a validation defect.

### Scenario E — Negative: unsaved changes protection

**Steps:**
1. Enter any value in company form (e.g., Company Name).
2. Click **Cancel** or **X**.

**Expected:**
- If unsaved-change protection is intended, show confirmation dialog before closing.
- If not intended, close immediately but behavior should be explicitly documented.

**Observed on UAT (manual probe):**
- Modal closed immediately with no unsaved-change warning.

### Scenario F — End-to-end continuation to property flow

**Steps:**
1. Open company flow from Create Property.
2. Create company with valid required data.
3. Return to property form.
4. Check Company field value/options.

**Expected:**
- Newly created company is available/selectable in property company control.
- User can continue property creation without resetting unrelated fields.

### Coverage gaps identified (this workflow only)

- No explicit automated coverage for `+ Create New` launch and close behavior.
- Required-field gating behavior for **Create Company** needs product clarification.
- Unsaved-change behavior on Cancel/X is not documented as a product rule.
- Post-create handoff back to property form (auto-select vs manual select) needs explicit acceptance criteria.

---

## M-PROP-04B — Verify that Parent Company field is visible.

**Gap vs automation:** Current property automation does not explicitly document visibility and state transitions of the **Parent Company** field as a standalone requirement.

**Objective:** Validate that **Parent Company** is visible in Create Property flow, appears in the correct place/state, and behaves consistently across open/close cycles.

**Preconditions:**

- User logged in with valid `.env` credentials.
- User can access **Properties** module.
- Open **Create Property** drawer.

### Scenario A — Positive: Parent Company field visibility on Create Property open

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click **Create Property**.
3. Inspect top form row near **Company** field.

**Expected:**
- **Parent Company** field is visible.
- Label text is clear and readable (`Parent Company`).
- Field placeholder is present (`Parent Company` or equivalent).

### Scenario B — Positive: Initial field state before company selection

**Steps:**
1. Open Create Property drawer.
2. Without selecting company, inspect Parent Company control state.

**Expected:**
- Field state matches product rule (in UAT observed as disabled/read-only initially).
- No validation error shown just for being empty.

### Scenario C — Edge: visibility persistence on close/reopen

**Steps:**
1. Open Create Property and verify Parent Company visible.
2. Close drawer (Cancel or X/backdrop according to app behavior).
3. Reopen Create Property.

**Expected:**
- Parent Company field remains visible after reopen.
- Placement and initial state remain consistent.

### Scenario D — Negative/Gap check: Parent Company visibility in inline Create Company flow

**Steps:**
1. From Create Property drawer, click `+ Create New` under Company section.
2. Inspect **Create a New Company** modal fields.

**Expected:**
- If product requires parent linkage during inline company creation, field should be visible.
- If not required, field may be absent but this should be documented as intentional behavior.

**Observed on UAT (manual probe):**
- Parent Company field was not visible in inline Create Company modal.

### Scenario E — Functional edge: state after selecting Company

**Steps:**
1. In Create Property drawer, select a company.
2. Re-check Parent Company field.

**Expected:**
- Field behavior after company selection is consistent with product rule:
  - enabled and selectable, or
  - auto-populated/read-only, or
  - intentionally hidden/unchanged.
- No conflicting UI state.

### Validation/Negative checks for this workflow

1. Verify no overlapping labels/controls hide Parent Company field in smaller viewport.
2. Verify Parent Company field label is not truncated or replaced by placeholder-only UI.
3. Verify role-based visibility (HO vs SM/SP) is consistent with permissions policy.
4. Verify no console/UI errors when opening drawer where Parent Company should render.

### Coverage gaps identified (workflow-only)

- Requirement does not specify whether visibility is required only in **Create Property** or also in **Create Company** modal.
- Role-based rules for Parent Company visibility are not explicitly documented.
- Post-company-selection behavior (disabled vs enabled vs auto-filled) needs explicit acceptance criteria.

---

## M-PROP-05 — Verify that selecting a company populates the Company field correctly.

**Gap vs automation:** Covered indirectly in `createProperty`, but there is no isolated assertion on the closed-field display value.

**Objective:** Confirm the chosen company name is visible on the collapsed field after selection.

**Preconditions:** Create Property drawer open.

**Steps:**

1. Open the company picker.
2. Search for a known company (e.g. one you use in regression).
3. Select exactly one result row.
4. Close the tooltip (Escape or click outside if that is the app pattern).

**Expected:**

- The company field shows the selected company name (or chip), not the placeholder, and matches the row you clicked.

**Playwright hint:** After closing popper, assert on the heading text near **Search Company** or on a chip locator once you record the DOM structure.

---

## M-PROP-06 — Verify that changing the selected company updates dependent fields (if any) accordingly.

**Gap vs automation:** Not covered.

**Objective:** Document whether changing the company clears or resets affiliation, contact, franchise, or other dependent controls.

**Preconditions:** Create Property drawer open.

**Steps:**

1. Select **Company A**; note which downstream fields are filled or enabled (affiliation buttons, contact, franchise suggestions, etc.).
2. Optionally select one affiliation chip and one contact if visible.
3. Re-open the company picker and select **Company B** (different account).

**Expected:**

- Behavior is consistent and safe: either dependent fields reset, or the app warns if data would be inconsistent. Record actual product behavior in your notes (this becomes the source of truth for a future test).

---

## M-PROP-07 — Verify that Property Affiliation options become visible/enabled after the user selects a company.

**Gap vs automation:** Automation clicks affiliation in a happy path but does not assert the **gating** rule explicitly.

**Objective:** Prove that affiliation controls are hidden, disabled, or incomplete until a company is chosen (if that is the product rule).

**Preconditions:** Create Property drawer open; **no** company selected yet.

**Steps:**

1. Before selecting any company, observe the **Property affiliation** area (Managed, Owned, Regional office, Shared, Tenant, Headquarters — names verified on UAT after company selection).
2. Record whether each control is absent, disabled, or present but inert.
3. Select a company as in M-PROP-05.
4. Re-check the same affiliation controls.

**Expected:**

- After company selection on UAT, all six buttons **Managed**, **Owned**, **Regional office**, **Shared**, **Tenant**, **Headquarters** are visible and clickable (`getByRole('button', { name: 'Managed' })` style).

---

## M-PROP-08 — Verify that user can select a Property Affiliation option and the selection state is clearly shown.

**Gap vs automation:** Existing automation validates chip interaction in a happy path, but does not fully cover requirement-level validation for **simultaneous multi-selection**, fail-safe validation states, or edge behavior around chip persistence/reset.

**Objective:** Validate end-to-end behavior for selecting multiple property affiliation options at the same time, including positive, negative, and edge scenarios.

**Preconditions:**

- User is logged in from `.env` credentials and can access `/app/sales/locations`.
- Create Property drawer is open.
- A company is selected so affiliation controls are visible.
- Affiliation chips visible: **Managed**, **Owned**, **Regional Office**, **Shared**, **Tenant**, **Headquarters**.

### Scenario A — Positive baseline: chips are visible and selectable

**Steps:**
1. Open **Create Property**.
2. Select company from **Search Company**.
3. Observe all six affiliation chips.
4. Click **Managed** once.

**Expected:**
- All six chips are visible after company selection.
- Clicked chip shows a clear selected UI state (border/background/focus state).

### Scenario B — Requirement validation: multi-select at same time

**Steps:**
1. With **Managed** selected, click **Owned**.
2. Then click **Regional Office**.
3. Observe selection state of all previously selected chips.

**Expected (Requirement):**
- Multiple chips remain selected simultaneously (Managed + Owned + Regional Office).

**Observed on UAT (manual probe):**
- New click replaces old selection (single-select behavior).  
- Example: selecting **Owned** deselects **Managed**.

**Status:** Needs product clarification or defect confirmation against requirement.

### Scenario C — Negative: keyboard-assisted multi-select

**Steps:**
1. Select one chip (for example **Managed**).
2. Hold `Ctrl` (or `Cmd` on macOS) and click another chip.

**Expected:**
- If app supports advanced multi-select interactions, both remain selected.

**Observed on UAT:**
- Keyboard modifier does not preserve prior selection.

### Scenario D — Edge: re-click selected chip (toggle off behavior)

**Steps:**
1. Select a chip (for example **Managed**).
2. Click the same chip again.

**Expected:**
- Behavior should be consistent with product rule:
  - either chip toggles off, or
  - chip remains selected and requires selecting another option.

**Observed on UAT:**
- Re-click keeps chip selected (no toggle-off state observed).

### Scenario E — Edge: state persistence during form interactions

**Steps:**
1. Select affiliation chip(s).
2. Fill other fields (Property Name, Source, Stage, Address).
3. Navigate between fields and return to affiliation area.

**Expected:**
- Affiliation selection state remains unchanged while drawer is open.

### Scenario F — Negative: Cancel and reopen drawer

**Steps:**
1. Select affiliation chip(s) in Create Property drawer.
2. Click **Cancel**.
3. Reopen **Create Property** drawer and select company again.

**Expected:**
- Drawer opens in clean state; affiliation selections should not persist from canceled draft unless explicitly designed.

### Scenario G — Validation: submit with no chip selected

**Steps:**
1. Fill all required fields for property creation.
2. Keep all affiliation chips unselected (if UI allows).
3. Click **Create Property**.

**Expected:**
- If affiliation is required: clear validation message shown.
- If not required: property saves successfully without affiliation.
- Behavior should be explicitly documented by product.

### Scenario H — Validation: submit with multiple chips selected

**Steps:**
1. Select multiple affiliations (if supported in current build).
2. Complete required fields and submit.
3. Open created property detail/list view.

**Expected:**
- All selected affiliations are saved and displayed consistently in list/detail.

**Observed on UAT risk:**
- Since UI currently behaves as single-select, this scenario may be blocked until behavior is corrected.

### Coverage gaps identified (for this workflow only)

- Requirement says multi-select at same time, but current UAT interaction appears single-select.
- No explicit inline helper text explains whether affiliation is single-select or multi-select.
- Accessibility behavior (`aria-pressed`/`aria-checked`, keyboard-only flows) needs dedicated validation.
- Save-time validation rules for zero-selection vs multi-selection need product confirmation.

---

## M-PROP-09 — Verify that user is able to assign levels to the property.

**Gap vs automation:** TC-PROP-010 asserts **Property Stages** UI is visible; it does not click a stage to assign or change level.

**Objective:** Verify a user can change the property’s stage (or equivalent “level”) from the detail page and that the UI persists after refresh.

**Preconditions:** A property exists (create one manually or use an existing test property).

**Steps:**

1. Open the property from the list (search by name → open row).
2. On the detail view, locate **Property Stages** (heading level 5 in current DOM).
3. Click a stage different from the current one (e.g. move toward **Approved** or another valid transition).
4. Wait for any toast or inline confirmation.
5. Hard refresh the browser on the same property URL.

**Expected:**

- Stage reflects the new selection after the action and still after refresh (or explain intentional non-persistence).

**Playwright hint:** Record exact accessible names of stage controls; they may be verbose tooltips in this app.

---

## M-PROP-10 — Verify that HO/SM is able to assign property to the manager or sales person.

**Manual runbook (separate .md):** `docs/runbooks/property-assignment-ho-sm.md`

**Automation (Playwright):** Covered as **two serial tests** in `tests/e2e/property-module.spec.js`: **TC-PROP-029 (HO)** performs assignment; **TC-PROP-030 (SM)** verifies visibility under SM login. Requires a valid SM display name in dropdown (`PROPERTY_ASSIGNMENT_OPTION_SM` or `PROPERTY_ASSIGNMENT_OPTION`).

**Gap vs automation:** Create flow uses **Select Assignee** with environment-specific names (`pages/property-module.js`); automation covers HO assignment from **detail header** plus assignee list visibility for the configured SM user, not every role combination (SM/SP as assignor) or reassignment variants.

**Objective:** Validate business rule: Head Office / Senior Manager can assign the property to a manager or sales person from the **Property detail header** and the assignment is visible under the assignee account.

**Preconditions:**

- Use credentials from `data/credentials.js` / `.env`:
  - HO: `SIGNAL_EMAIL_HO` + `SIGNAL_PASSWORD_HO`
  - SM: `SIGNAL_EMAIL_SM` + `SIGNAL_PASSWORD_SM`
- At least one existing property is available in list view.
- Target assignee user exists in tenant (for UAT, common visible name observed: `Moiz SM UAT`).

**Steps:**

1. Log in as **HO** user and navigate to **Properties** (`/app/sales/locations`). _(Playwright: **TC-PROP-029 | HO** — shared `beforeAll` HO session.)_
2. Open any property detail page from the listing table.
3. In the detail header (same horizontal block that contains `Level`, `Assigned to`, `Linked Franchise`), locate:
   - label: **Assigned to**
   - assignment button: shows current assignee name (example observed: `Moiz SM UAT`) with avatar and dropdown icon.
4. Capture current value for evidence (screenshot + text).
5. Click the assignment button once.
6. If a selector/list opens:
   - use search box (usually labeled **Search**) to search target manager/sales person.
   - pick target user from options list.
7. If selector does **not** open:
   - capture screenshot + DOM evidence and confirm whether assignment is read-only for this role/state.
8. Wait 2-5 seconds and confirm `Assigned to` value reflects target user.
9. Log out from HO account.
10. Log in as selected assignee user (SM or SP account). _(Playwright: **TC-PROP-030 | SM** — new context + `performLogin`.)_
11. Go to **Properties** list and search for the same property name.
12. Confirm property is visible and openable by assignee account.
13. (Optional) Re-open as HO and set assignment back to original user to avoid environment drift.

**Expected:**

- HO/SM can update assignee from the detail-header `Assigned to` control **or** the app clearly indicates read-only restriction.
- After assignment change, `Assigned to` shows the chosen user.
- Under assignee login, same property is discoverable in Properties list.
- No unexpected validation toast or silent revert after refresh.

**Observed UI anchors (UAT deep-dive):**

- Property detail heading uses level 1 (`S-P ####` pattern in automation data).
- `Assigned to` control appears in header card next to `Level` and `Linked Franchise`.
- Assignment action is **not** on Edit Property drawer in current UAT build (edit drawer focuses on property attributes such as name/source/franchise/tenancy metrics).

---

## M-PROP-11 — Verify that HO/SM/SP is able to link franchise.

**Gap vs automation:** Franchise is selected during **create** only. If product allows franchise change on **edit**, that path is not automated here.

**Manual runbook (separate .md):** `docs/runbooks/property-franchise-linking-ho-sm.md`

**Preconditions:** Property detail open; user has rights to edit franchise (SM/SP as per your checklist).

**Steps:**

1. Open **Edit Property** (or equivalent).
2. Change **Associated Franchise** to another franchise that exists in UAT; save.
3. Re-open edit and confirm the new franchise is shown.

**Expected:**

- Saved franchise matches selection; no validation regression on save.

---

## Traceability appendix — stakeholder checklist vs this file

| #   | Stakeholder verification                                                                                                                           | Covered by Playwright?              | Manual case ID |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------- |
| 1   | Verify that user is able to create to create new property.                                                                                         | Yes                                 | —              |
| 2   | Verify that user is able to view details of property.                                                                                              | Yes                                 | —              |
| 3   | Verify that user is able to edit property.                                                                                                         | Yes                                 | —              |
| 4   | Verify that user is able to assign levels to the property.                                                                                         | Partial (visibility only)           | M-PROP-09      |
| 5   | Verify that HO/SM is able to assign property to the manager or sales person.                                                                       | Partial / env-specific              | M-PROP-10      |
| 6   | Verify that HO/SM/SP is able to link franchise.                                                                                                    | Yes (create path); edit path manual | M-PROP-11      |
| 7   | Verify that user is able to add/edit/delete notes.                                                                                                 | Yes                                 | —              |
| 8   | Verify that user is able to add tasks.                                                                                                             | Yes                                 | —              |
| 9   | Verify that user is able to mark the task as complete.                                                                                             | Yes                                 | —              |
| 10  | Verify that the Create Property modal opens successfully from the Properties/Listing page.                                                         | Yes                                 | —              |
| 11  | Verify that the Create Property modal displays all expected fields, labels, and mandatory (\*) indicators.                                         | Partial                             | M-PROP-01      |
| 12  | Verify that the close (X) icon closes the Create Property modal without saving any data.                                                           | No                                  | M-PROP-02      |
| 13  | Verify that the Cancel button closes the Create Property modal without saving any data.                                                            | Yes                                 | —              |
| 14  | Verify that validation message appear if user try to create a property by clicking on the 'Create Property' button when mandatory fields are empty | Partial                             | M-PROP-03      |
| 15  | Verify that the Company dropdown opens and lists companies correctly.                                                                              | Partial                             | M-PROP-04      |
| 16  | Verify that the Company dropdown supports search and returns matching company results.                                                             | Yes                                 | —              |
| 17  | Verify that selecting a company populates the Company field correctly.                                                                             | Implicit                            | M-PROP-05      |
| 18  | Verify that changing the selected company updates dependent fields (if any) accordingly.                                                           | No                                  | M-PROP-06      |
| 19  | Verify that Property Affiliation options become visible/enabled after the user selects a company.                                                  | No                                  | M-PROP-07      |
| 20  | Verify that user can select a Property Affiliation option and the selection state is clearly shown.                                                | Partial                             | M-PROP-08      |

---

## Automation added (Playwright)

The following manual-gap scenarios now have automated coverage in `tests/e2e/property-module.spec.js` (see TC-PROP-019–023 and TC-PROP-025–030). **M-PROP-10** uses **TC-PROP-029 (HO)** and **TC-PROP-030 (SM)** in order inside `test.describe.serial`; TC-PROP-030 is skipped if TC-PROP-029 did not run or did not finish assignment (shared in-memory property name).

| Manual ID | Playwright test ID                                                |
| --------- | ----------------------------------------------------------------- |
| M-PROP-01 | TC-PROP-019                                                       |
| M-PROP-02 | TC-PROP-021 (backdrop dismiss — not a dedicated “X” icon locator) |
| M-PROP-03 | TC-PROP-020                                                       |
| M-PROP-04 | TC-PROP-022                                                       |
| M-PROP-05 | TC-PROP-023                                                       |
| M-PROP-06 | —                                                                 |
| M-PROP-07 | TC-PROP-025                                                       |
| M-PROP-08 | TC-PROP-026                                                       |
| M-PROP-09 | TC-PROP-027                                                       |
| M-PROP-10 | TC-PROP-029 (HO), TC-PROP-030 (SM)                                |
| M-PROP-11 | TC-PROP-028                                                       |

---

## Revision log

| Date       | Notes                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-04-13 | Initial gap analysis against `tests/e2e/property-module.spec.js`, `pages/property-module.js`, and `register-notes-tasks-suite.js`. UAT probe: empty submit showed `Property / Property Name is required.` and `Address is required.`; affiliation buttons **Managed**, **Owned**, **Regional office**, **Shared**, **Tenant**, **Headquarters** appeared after selecting company **Regression Phase**. |
| 2026-04-13 | TC-PROP-019–028 implemented per gap doc; POM helpers added in `pages/property-module.js`.                                                                                                                                                                                                                                                                                                              |
| 2026-04-13 | Deep-dive update for M-PROP-10: assignment entry point confirmed on property detail header (`Assigned to`), with explicit HO->SM/SP verification flow and evidence checklist.                                                                                                                                                                                                                          |
| 2026-04-13 | M-PROP-10 automation split into **TC-PROP-029 (HO)** and **TC-PROP-030 (SM)** with user type in titles; doc aligned.                                                                                                                                                                                                                                                                                   |

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

## M-PROP-04C — Verify that Property Source dropdown opens and lists all available sources correctly.

**Gap vs automation:** Current suite covers selecting a source in create flows, but does not provide a requirement-focused manual matrix for dropdown open/list integrity, keyboard-dismiss behavior, and option consistency across open/close cycles.

**Objective:** Validate end-to-end behavior of the **Property Source** control in the Create Property drawer, including trigger behavior, option list integrity, selection reflection, and negative/edge stability.

**Preconditions:**

- Use credentials from `.env` and log in at `BASE_URL` (`https://uat.sales.teamsignal.com/`).
- If `SIGNAL_EMAIL` / `SIGNAL_PASSWORD` are not present in `.env`, use role credentials (`SIGNAL_EMAIL_HO` / `SIGNAL_PASSWORD_HO` or `SIGNAL_EMAIL_SM` / `SIGNAL_PASSWORD_SM`).
- Navigate to **Properties** (`/app/sales/locations`) and open **Create Property** drawer.

### Scenario A — Positive baseline: dropdown opens from default state

**Steps:**
1. In Create Property drawer, locate label **Property Source \***.
2. Verify trigger text is default value (typically `Add Property Source` in current UAT).
3. Click the source trigger once.

**Expected:**
- Source popover/list opens immediately.
- No UI freeze, console overlay, or duplicate dropdown appears.
- List is anchored to Property Source field (not detached to unrelated area).

### Scenario B — Positive: all expected source options are listed

**Steps:**
1. Keep Property Source dropdown open.
2. Read visible options top-to-bottom and note exact text/casing.
3. If list is scrollable on your viewport, scroll until all options are visible and record count.

**Expected (UAT manual probe, Apr 2026):**
- Options observed:
  - `ALN`
  - `Building Connected`
  - `Inbound Lead - National`
  - `Referral`
  - `Inbound Lead - Local`
  - `Local Networking`
  - `Other Online Database`
  - `Rocket Reach`
  - `Sales Routing`
  - `ZoomInfo`
- No duplicates, truncated labels, or blank rows.

### Scenario C — Positive: selecting an option updates the closed trigger value

**Steps:**
1. With dropdown open, click one option (example: `Building Connected`).
2. Observe dropdown closes.
3. Re-check trigger text in the form.

**Expected:**
- Dropdown closes after selection.
- Trigger text updates from default (`Add Property Source`) to selected option.
- Selected source remains visible while user continues filling other fields in the same drawer session.

### Scenario D — Positive/UX: reopen and reselection behavior

**Steps:**
1. Click the selected source trigger again to reopen list.
2. Select a different source (example: switch from `Building Connected` to `Referral`).
3. Re-check trigger value.

**Expected:**
- List reopens without stale/empty state.
- New selection replaces old one cleanly.
- Trigger always shows latest selected source.

### Scenario E — Negative: dismiss dropdown without making a selection

**Steps:**
1. Open source dropdown.
2. Click outside dropdown area (inside drawer body) or press `Escape`.
3. Re-check trigger value.

**Expected:**
- Dropdown closes.
- Existing value remains unchanged (or default remains if no prior selection).
- No phantom selection occurs.

### Scenario F — Negative/validation: required-state behavior on submit

**Steps:**
1. Open fresh Create Property drawer.
2. Keep Property Source unselected.
3. Complete other required fields as far as possible for your environment and click **Create Property**.

**Expected:**
- If Property Source is required by product rule (`Property Source *` indicates required), inline validation should appear when source is missing.
- If validation is deferred or handled server-side, response should still clearly guide user to missing source.
- Drawer should remain open and editable.

### Scenario G — Edge: open/close stability and state reset on cancel

**Steps:**
1. Select any source.
2. Close drawer using **Cancel**.
3. Reopen **Create Property** from list page.
4. Check Property Source value.

**Expected:**
- Reopened drawer should be clean-state (default source text) unless product intentionally persists draft values.
- No stale source from canceled draft should remain.

### Scenario H — Edge: viewport and readability stress checks

**Steps:**
1. Test at standard desktop and one reduced viewport (for example 1366x768 or zoom 125%).
2. Open source dropdown and inspect labels.

**Expected:**
- All option labels remain readable.
- No clipping/overlap on long names (`Inbound Lead - National`, `Other Online Database`).
- Dropdown remains scrollable/usable in smaller viewport.

### Coverage gaps identified (workflow-only)

- Source master list is not documented in acceptance criteria (expected canonical list can drift by tenant/release).
- Requirement does not explicitly define whether source is strictly required at submit-time or only visually marked mandatory.
- Keyboard accessibility behavior (arrow navigation, Enter select, Escape close) is not explicitly specified.
- No explicit role-based rule states whether available sources should differ by HO/SM/SP.

---

## M-PROP-04D — Verify that selecting a Property Source populates the field correctly.

**Gap vs automation:** Existing tests validate dropdown interaction and source-option presence, but requirement-level manual coverage for field population behavior (default -> selected value -> reselection -> reset rules) is not fully documented as a standalone workflow.

**Objective:** Validate that user selection in **Property Source** correctly populates the field value in Create Property drawer, remains stable through normal interactions, and follows expected reset behavior when form is canceled/reopened.

**Preconditions:**

- Log in using `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module (`/app/sales/locations`).
- Open **Create Property** drawer.
- Ensure Property Source is visible with default prompt text (`Add Property Source` or tenant-equivalent default).

### Scenario A — Positive baseline: first selection populates field value

**Steps:**
1. Open **Property Source** dropdown.
2. Select `Building Connected` (or any known visible source in your tenant).
3. Observe collapsed field value after dropdown closes.

**Expected:**
- Dropdown closes after click.
- Field value updates from default prompt to selected source text.
- Selected text exactly matches clicked option (spelling/casing).
- No placeholder/default text remains visible together with selected value.

### Scenario B — Positive: reselection updates value to latest choice

**Steps:**
1. Reopen Property Source dropdown.
2. Select a different value (example: `Referral`).
3. Observe field after close.

**Expected:**
- Previous value is replaced by latest selected source.
- Only one source value is shown in the field (no concatenation or duplicate chips).
- Updated value remains visible after focus moves to another field.

### Scenario C — Positive: value persists during in-drawer workflow

**Steps:**
1. Select any Property Source.
2. Fill/modify other fields (Company, Property Name, Stage, Address) without submitting.
3. Return to Property Source area.

**Expected:**
- Previously selected source is still shown.
- No silent reset occurs while drawer stays open.
- Source remains the same unless explicitly changed by user.

### Scenario D — Negative: dismiss dropdown without selecting new option

**Steps:**
1. Start with a selected source value.
2. Reopen Property Source dropdown.
3. Dismiss dropdown using click-outside or `Escape` without selecting a different option.

**Expected:**
- Dropdown closes cleanly.
- Existing selected value remains unchanged.
- No phantom update happens.

### Scenario E — Negative: required-field validation when source not selected

**Steps:**
1. Open a fresh Create Property drawer where source is still default/unselected.
2. Fill other mandatory fields as far as possible and submit.

**Expected:**
- If source is mandatory (`Property Source *`), clear validation indicates missing source.
- Form stays open for correction.
- If behavior differs by tenant/build (deferred validation), response still identifies missing source requirement.

### Scenario F — Edge: cancel/reopen reset behavior

**Steps:**
1. Select a Property Source.
2. Click **Cancel** to close Create Property drawer.
3. Reopen Create Property.

**Expected:**
- Field returns to clean default state (`Add Property Source` or equivalent), unless draft-persistence is intentional product behavior.
- Previously selected source from canceled draft is not retained unintentionally.

### Scenario G — Edge: open/close repetition stability

**Steps:**
1. Repeat select -> reselection cycle 5 times using different values.
2. Between cycles, reopen dropdown and verify current displayed value each time.

**Expected:**
- Field always reflects the latest selected value.
- No stale value or delayed update appears.
- Dropdown remains responsive; no duplicate overlays or UI freezes.

### Scenario H — Edge: viewport/readability impact on populated value

**Steps:**
1. Select long labels such as `Inbound Lead - National` and `Other Online Database`.
2. Check display at normal and smaller viewport (or zoom 125%).

**Expected:**
- Populated field remains readable and not clipped beyond usability.
- If truncation occurs, tooltip/full-text access should still make value unambiguous.

### Coverage gaps identified (workflow-only)

- Acceptance criteria do not explicitly define canonical default state text (`Add Property Source` vs tenant-specific variant).
- No explicit rule states whether field should support only one source or multi-source selection.
- Required-validation timing (client-side immediate vs submit-time/server-side) is unspecified.
- No formal UX requirement documents how long source text should remain visible if label length exceeds control width.

---

## M-PROP-04E — Verify that Associated Franchise dropdown opens and lists available franchises correctly.

**Gap vs automation:** Existing automation selects an associated franchise in create flow, but there is no requirement-focused manual workflow that validates dropdown open behavior, list integrity, search/filter behavior, and selection consistency as a standalone area.

**Objective:** Validate that **Associated Franchise** control opens correctly, displays available franchises, supports search/filter, and updates/retains selected value according to expected UX.

**Preconditions:**

- Log in using `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module (`/app/sales/locations`).
- Open **Create Property** drawer.
- Ensure **Associated Franchise** field is visible (default text generally `Add Associated Franchise`).

### Scenario A — Positive baseline: dropdown opens from default state

**Steps:**
1. In Create Property drawer, locate **Associated Franchise**.
2. Verify trigger text is default value (`Add Associated Franchise` or tenant-equivalent).
3. Click the trigger once.

**Expected:**
- Franchise popover opens.
- A searchable input (typically labeled `Search`) is visible.
- A list of franchises is displayed beneath search input.
- No duplicate overlay, UI freeze, or detached popover position.

### Scenario B — Positive: franchise list is populated and readable

**Steps:**
1. Keep franchise dropdown open.
2. Inspect first page of options and scroll list if required.
3. Record sample options and formatting.

**Expected:**
- List is non-empty in a normal UAT tenant.
- Labels are readable and consistently formatted.
- No blank/duplicated rows are shown in the visible list segment.

**Observed during manual probe (UAT sample):**
- `0000 – War Room Franchise`
- `003 - John Franchise`
- `026 - Fremont Pilot`
- `216 - Omaha, NE`
- `240 - Hodgkins, IL`
- `QA Franchise 2`
- `Target Franchise`

### Scenario C — Positive: search narrows results to matching franchises

**Steps:**
1. Open franchise dropdown.
2. In `Search` input, type `216 - Omaha, NE`.
3. Observe filtered options.

**Expected:**
- Results narrow to matching franchise value(s).
- Non-matching options are removed/hidden from visible list.
- No stale old results remain after filter updates.

### Scenario D — Positive: selecting a franchise populates the field

**Steps:**
1. From filtered or full list, select a franchise option (example: `216 - Omaha, NE`).
2. Observe dropdown close behavior and trigger value.

**Expected:**
- Dropdown closes after selection.
- Trigger text updates from default (`Add Associated Franchise`) to selected franchise.
- Selected text exactly matches clicked option.

### Scenario E — Positive: reselection updates to latest value

**Steps:**
1. Reopen Associated Franchise dropdown.
2. Search/select a different franchise.
3. Observe trigger text after close.

**Expected:**
- Newly selected franchise replaces prior one.
- Only one franchise value is displayed in control.
- Latest selection persists while drawer remains open.

### Scenario F — Negative: dismiss dropdown without selecting

**Steps:**
1. Start with a selected franchise value.
2. Reopen dropdown.
3. Dismiss via click-outside or `Escape` without selecting a new option.

**Expected:**
- Dropdown closes.
- Existing selected value remains unchanged.
- No unintended value reset occurs.

### Scenario G — Edge: no-match search behavior

**Steps:**
1. Open franchise dropdown.
2. Enter a non-existent query (example: `zzzz-no-match-123`).

**Expected:**
- List shows empty state (if implemented) or no options.
- App remains responsive; no error overlays.
- Clearing search restores franchise results.

### Scenario H — Edge: cancel/reopen reset behavior

**Steps:**
1. Select any associated franchise.
2. Click **Cancel** to close Create Property drawer.
3. Reopen Create Property drawer.

**Expected:**
- Control returns to default (`Add Associated Franchise`) unless draft persistence is explicitly intended.
- Prior canceled selection is not unintentionally retained.

### Scenario I — Edge: long list usability and viewport behavior

**Steps:**
1. Open dropdown on standard viewport and reduced viewport/zoom (e.g., 1366x768 or 125% zoom).
2. Scroll through options and interact with search box.

**Expected:**
- Dropdown remains scrollable and focusable.
- Search input stays usable while scrolling.
- Long franchise names remain distinguishable (no severe clipping that blocks identification).

### Coverage gaps identified (workflow-only)

- Acceptance criteria do not define expected franchise list source/scope (all tenant franchises vs role-restricted subset).
- No explicit requirement defines mandatory validation behavior when franchise is not selected.
- Search behavior expectations (contains vs starts-with vs exact) are not documented.
- Accessibility behavior (keyboard navigation, active option, Enter select) lacks explicit acceptance criteria.

---

## M-PROP-04F — Verify that selecting an Associated Franchise populates the field correctly.

**Gap vs automation:** Current automation covers opening/listing and selecting franchise in create flow, but there is no standalone requirement-focused manual workflow that verifies field population correctness across selection, reselection, non-select dismiss, and cancel/reopen reset behavior.

**Objective:** Validate that when a user selects an **Associated Franchise**, the field displays the correct selected value, retains it during ongoing form edits, and behaves predictably across reopen/dismiss/cancel cycles.

**Preconditions:**

- Log in using `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module (`/app/sales/locations`).
- Open **Create Property** drawer.
- Ensure **Associated Franchise** is visible with default text (`Add Associated Franchise` or tenant equivalent).

### Scenario A — Positive baseline: first selection populates field

**Steps:**
1. Click **Associated Franchise** trigger.
2. Search/select a known value (example: `216 - Omaha, NE`).
3. Observe the field after dropdown closes.

**Expected:**
- Dropdown closes after selection.
- Field value updates from default text to selected franchise.
- Selected text exactly matches clicked option (same readable value and casing).
- Default placeholder text is no longer shown.

### Scenario B — Positive: reselection replaces prior value

**Steps:**
1. Reopen **Associated Franchise** dropdown.
2. Search/select another value (example: `240 - Hodgkins, IL`).
3. Observe field after close.

**Expected:**
- Latest selected franchise replaces previous franchise.
- Field shows only one selected value (no concatenation/duplicate display).
- Updated value remains stable after focus shifts to other fields.

### Scenario C — Positive: value persists while editing other fields

**Steps:**
1. Select any franchise.
2. Update additional form fields (Property Name, Property Source, Stage, Address) without submitting.
3. Return to Associated Franchise field.

**Expected:**
- Selected franchise value remains unchanged.
- No silent reset while drawer remains open.
- No cross-field interaction unexpectedly clears franchise selection.

### Scenario D — Negative: dismiss dropdown without selecting a new value

**Steps:**
1. Ensure Associated Franchise already has a selected value.
2. Reopen dropdown.
3. Dismiss via click-outside or `Escape` without selecting another option.

**Expected:**
- Dropdown closes.
- Previously selected value remains unchanged.
- No phantom update occurs.

### Scenario E — Negative: no-match search should not overwrite selected value

**Steps:**
1. Start with a selected franchise.
2. Reopen dropdown and type a non-existent term (`zzzz-no-match-123`).
3. Do not select anything; dismiss dropdown.

**Expected:**
- No-match state is shown (or empty options list).
- Previously selected franchise remains in field after dismiss.
- Invalid search text is not applied as selected value.

### Scenario F — Edge: cancel/reopen should reset draft value

**Steps:**
1. Select any Associated Franchise.
2. Click **Cancel** to close Create Property drawer.
3. Reopen Create Property drawer.

**Expected:**
- Field returns to default (`Add Associated Franchise`) unless product intentionally persists drafts.
- Selection from canceled session is not unintentionally retained.

### Scenario G — Edge: repeated open/select cycles stay consistent

**Steps:**
1. Perform franchise select/reselect cycle 5 times with different options.
2. After each selection, verify displayed value.

**Expected:**
- Field always reflects latest selection.
- No stale value, delayed render, or mismatched display text.
- Control remains responsive throughout repeated cycles.

### Coverage gaps identified (workflow-only)

- Acceptance criteria does not explicitly define whether franchise field is single-select only (UI suggests single value behavior).
- No explicit requirement states if franchise value must persist in drafts across drawer close/reopen.
- No explicit formatting rule for displayed franchise text (ID-city pattern vs full label).
- Validation behavior when franchise is omitted during submit is not clearly documented for all tenants/roles.

---

## M-PROP-04G — Verify that 'Choose a Hubspot Stage to map' dropdown opens and lists available stages correctly.

**Gap vs automation:** Existing automation selects stage in create flow, but there is no dedicated manual requirement workflow validating dropdown open state, visible option inventory, selection consistency, and close/reopen behavior as a standalone control.

**Objective:** Validate that **Choose a Hubspot Stage to map** opens correctly, displays all available stage options for the tenant, and reflects user selection reliably without UI regressions.

**Preconditions:**

- Log in using `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module (`/app/sales/locations`).
- Open **Create Property** drawer.
- Ensure stage field is visible under label **Choose a Hubspot Stage to map \*** with default trigger text (commonly `Choose stage`).

### Scenario A — Positive baseline: stage dropdown opens from default state

**Steps:**
1. Locate **Choose a Hubspot Stage to map \*** field in Create Property drawer.
2. Verify trigger text is default (usually `Choose stage`).
3. Click stage trigger once.

**Expected:**
- Stage dropdown/popover opens immediately.
- Stage options are visible under the same field area.
- No duplicate overlays, no frozen UI, no detached popover.

### Scenario B — Positive: available stage list is displayed correctly

**Steps:**
1. Keep stage dropdown open.
2. Read all visible options and record exact values.
3. If scroll exists, scroll to confirm additional options.

**Expected:**
- Option list is non-empty.
- Option labels are readable and distinct.
- No blank, duplicated, or malformed rows.

**Observed during UAT probe (sample):**
- `New Location`
- `Approved`

### Scenario C — Positive: selecting stage populates trigger correctly

**Steps:**
1. With dropdown open, select stage option `Approved` (or any valid option in your tenant).
2. Observe dropdown close behavior and trigger text.

**Expected:**
- Dropdown closes after selection.
- Trigger text updates to selected stage.
- Selected value exactly matches clicked option.

### Scenario D — Positive: reselection replaces previous stage value

**Steps:**
1. Reopen stage dropdown after selecting one value.
2. Select a different stage option (example: `New Location` if currently `Approved`).
3. Observe trigger text.

**Expected:**
- Latest selection replaces previous value.
- Only one stage value is shown in trigger.
- New value remains visible while continuing form edits.

### Scenario E — Negative: dismiss dropdown without new selection

**Steps:**
1. Start with an already selected stage value.
2. Reopen stage dropdown.
3. Dismiss via click-outside or `Escape` without selecting a different stage.

**Expected:**
- Dropdown closes cleanly.
- Previously selected stage remains unchanged.
- No phantom value change occurs.

### Scenario F — Negative/validation: stage missing on submit

**Steps:**
1. Open a fresh Create Property drawer with stage still unselected/default.
2. Fill other required fields as far as possible and click **Create Property**.

**Expected:**
- If stage is mandatory (`*`), validation indicates stage selection is required.
- Form remains open for correction.
- If tenant behavior differs, outcome should still clearly indicate unmet stage requirement.

### Scenario G — Edge: cancel/reopen should reset stage to default

**Steps:**
1. Select any stage value.
2. Click **Cancel** to close Create Property drawer.
3. Reopen Create Property.

**Expected:**
- Stage control resets to default (`Choose stage`) unless draft persistence is intentionally implemented.
- Prior canceled stage value is not unintentionally retained.

### Scenario H — Edge: repeated open/select cycles stay stable

**Steps:**
1. Repeat open -> select -> reopen -> select another value cycle at least 5 times.
2. Verify displayed stage after each cycle.

**Expected:**
- Control remains responsive throughout.
- Displayed value always matches latest selected option.
- No stale UI or delayed update behavior.

### Scenario I — Edge: viewport/readability checks

**Steps:**
1. Validate stage control and dropdown at normal desktop and reduced viewport/zoom (for example 1366x768 or 125% zoom).
2. Open dropdown and inspect option readability.

**Expected:**
- Trigger and options remain readable and selectable.
- No overlap with nearby controls (Associated Franchise / Assignee / Contact section).
- Dropdown remains usable even near drawer fold boundaries.

### Coverage gaps identified (workflow-only)

- Requirement does not define canonical stage-option source (fixed enum vs tenant-configured list).
- Acceptance criteria does not state whether search/filter is expected for stage dropdown.
- Required-validation behavior for missing stage is not explicitly documented for all roles/tenants.
- Accessibility expectations (keyboard navigation, focus order, Enter/Escape behavior) are not explicitly specified.

---

## M-PROP-04H — Verify that selecting a Hubspot Stage populates the field correctly.

**Gap vs automation:** Existing coverage validates stage dropdown open/list behavior and basic selection in flow, but requirement-level manual validation for stage field population (selection, reselection, persistence, non-select dismiss, and reset behavior) is not documented as a standalone workflow.

**Objective:** Validate that selecting a value in **Choose a Hubspot Stage to map** correctly populates the stage field, stays consistent through related user interactions, and resets/retains only where expected.

**Preconditions:**

- Log in using `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module (`/app/sales/locations`).
- Open **Create Property** drawer.
- Confirm stage trigger is visible with default text (typically `Choose stage`).

### Scenario A — Positive baseline: first stage selection populates field

**Steps:**
1. Open **Choose a Hubspot Stage to map** dropdown.
2. Select `Approved` (or any visible valid stage).
3. Observe stage trigger after dropdown closes.

**Expected:**
- Dropdown closes after selection.
- Trigger text updates from default (`Choose stage`) to selected stage.
- Displayed value exactly matches clicked option text.

### Scenario B — Positive: reselection replaces previous stage

**Steps:**
1. Reopen stage dropdown.
2. Select a different stage (example: `New Location` if currently `Approved`).
3. Re-check stage trigger value.

**Expected:**
- New stage value replaces old one (single displayed value).
- No concatenated/multi-value stage text appears.
- Latest selected value remains visible after focus moves to other controls.

### Scenario C — Positive: stage selection persists while editing other fields

**Steps:**
1. Select a stage value.
2. Modify other fields (Property Name, Property Source, Associated Franchise, Address) without submit.
3. Return to stage field.

**Expected:**
- Selected stage remains unchanged.
- No silent reset while drawer remains open.
- No cross-field side effects clear stage unexpectedly.

### Scenario D — Negative: dismiss dropdown without selecting new stage

**Steps:**
1. Start with a selected stage value.
2. Reopen stage dropdown.
3. Click outside dropdown (or press `Escape`) without selecting another option.

**Expected:**
- Dropdown closes.
- Previously selected stage remains unchanged.
- No phantom stage update occurs.

### Scenario E — Negative/validation: stage left unselected on submit

**Steps:**
1. Open fresh Create Property drawer with stage at default (`Choose stage`).
2. Fill other mandatory fields as far as possible and submit.

**Expected:**
- If stage is mandatory (`*`), validation indicates stage is required.
- Form remains open for correction.
- If tenant has deferred/server validation, user still receives explicit guidance about missing stage selection.

### Scenario F — Edge: cancel/reopen should reset stage field

**Steps:**
1. Select any stage value.
2. Click **Cancel** to close drawer.
3. Reopen Create Property drawer.

**Expected:**
- Stage field resets to default (`Choose stage`) unless draft persistence is explicitly intended behavior.
- Canceled draft stage should not appear automatically in new drawer session.

### Scenario G — Edge: repeated stage toggles remain stable

**Steps:**
1. Repeat stage selection cycle 5 times (e.g., `Approved` -> `New Location` -> `Approved` ...).
2. After each selection, verify displayed stage.

**Expected:**
- Display always matches most recent selection.
- No stale value, delayed rendering, or incorrect carry-over.
- Control remains responsive through repeated interaction.

### Scenario H — Edge: viewport/readability of selected stage

**Steps:**
1. Select stage values at normal viewport and reduced viewport/zoom (e.g., 1366x768 or 125% zoom).
2. Observe trigger readability and overlap with nearby controls.

**Expected:**
- Selected stage text remains readable.
- No overlap with Associated Franchise, Assignee, or Contact section controls.
- Control remains clickable and operable at smaller viewport.

### Coverage gaps identified (workflow-only)

- Requirement does not explicitly define whether stage should persist across unsaved drawer reopen (draft behavior).
- Canonical list/source of allowed Hubspot stages is not documented in acceptance criteria.
- Required-validation timing for missing stage (client vs server) is not explicitly defined.
- Accessibility expectations for keyboard interactions (Arrow/Enter/Escape) are not formally specified.

---

## M-PROP-04I — Verify that Property Affiliation value displays as `N/A` before company selection.

**Gap vs automation:** Existing tests focus on affiliation chips visibility/interaction after company selection, but requirement-level manual validation for the pre-company baseline display (`N/A`) is not documented as a standalone workflow.

**Objective:** Confirm that before any company is selected in Create Property drawer, **Property Affiliation** consistently displays `N/A` and transitions correctly once company context changes.

**Preconditions:**

- Log in using `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module (`/app/sales/locations`).
- Open **Create Property** drawer from listing page.
- Do not select a company initially.

### Scenario A — Positive baseline: `N/A` is visible before company selection

**Steps:**
1. Open Create Property drawer.
2. Locate section label **Property Affiliation**.
3. Observe displayed value immediately after drawer opens.

**Expected:**
- Value is shown as `N/A`.
- `N/A` is visible without requiring scroll beyond normal drawer layout.
- No affiliation chips/options are pre-selected at this stage.

### Scenario B — Positive: `N/A` remains until company is selected

**Steps:**
1. Keep company field untouched.
2. Interact with other non-company fields (Property Name, Property Source, Stage) without selecting company.
3. Re-check Property Affiliation value.

**Expected:**
- Value remains `N/A` while company is unselected.
- Other field interactions do not change Property Affiliation baseline value.

### Scenario C — Positive transition: value changes after company selection

**Steps:**
1. Select a valid company in Company control.
2. Re-check Property Affiliation section.

**Expected:**
- `N/A` baseline transitions according to product rule (e.g., affiliation options become available/interactive).
- Transition should be deterministic and not partially rendered.

### Scenario D — Negative: dismiss affiliation-related overlays should not alter `N/A`

**Steps:**
1. With no company selected, open and dismiss unrelated dropdowns (Property Source / Stage) if needed.
2. Re-check Property Affiliation value.

**Expected:**
- Property Affiliation remains `N/A`.
- No phantom affiliation state appears.

### Scenario E — Edge: cancel/reopen preserves baseline state

**Steps:**
1. Open Create Property drawer and verify `N/A`.
2. Click **Cancel**.
3. Reopen Create Property drawer.
4. Re-check Property Affiliation value.

**Expected:**
- Value is `N/A` again on fresh reopen.
- Prior unsaved interactions do not remove or replace baseline `N/A`.

### Scenario F — Edge: viewport/readability behavior for `N/A`

**Steps:**
1. Verify baseline `N/A` at normal desktop viewport.
2. Verify at reduced viewport or zoom 125%.

**Expected:**
- `Property Affiliation: N/A` remains readable and not clipped/overlapped.
- Label-value pairing stays visually aligned.

### Scenario G — Edge: role-based consistency check

**Steps:**
1. Repeat Scenario A with another role profile if available (HO/SM/SP as applicable).
2. Compare baseline value before company selection.

**Expected:**
- Baseline before company selection is consistently `N/A` unless role-specific product rule explicitly defines a different default.

### Coverage gaps identified (workflow-only)

- Requirement does not explicitly define whether `N/A` is expected for all roles/tenants or role-dependent.
- No explicit rule states exact transition behavior from `N/A` after company selection (timing and target state).
- UI spec does not define whether `N/A` should be plain text, badge/chip, or localized text variant.
- Accessibility expectation for announcing `Property Affiliation: N/A` to screen readers is not documented.

---

## M-PROP-04J — Verify that Associated Franchise dropdown supports search and returns matching results.

**Gap vs automation:** Existing automation uses franchise selection with a fixed search term, but requirement-level manual coverage for search behavior (match quality, no-match handling, clear-reset behavior, and result consistency) is not documented as a standalone workflow.

**Objective:** Validate that **Associated Franchise** search returns matching results reliably, suppresses non-matching entries, and restores full list when search is cleared.

**Preconditions:**

- Log in using `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module (`/app/sales/locations`).
- Open **Create Property** drawer.
- Open **Associated Franchise** dropdown.
- Ensure search input (`Search`) is visible.

### Scenario A — Positive baseline: search control is available and interactive

**Steps:**
1. Open **Associated Franchise** dropdown.
2. Confirm `Search` input is visible and editable.
3. Observe initial result list before entering text.

**Expected:**
- Search input is focusable and accepts text.
- Initial list is populated (non-empty in normal UAT tenant).
- No lag/freeze while list renders.

### Scenario B — Positive: exact-value search returns matching franchise

**Steps:**
1. In search input, type `216 - Omaha, NE`.
2. Observe result list.

**Expected:**
- Matching entry `216 - Omaha, NE` appears in filtered results.
- Non-matching items are hidden from the visible result list.
- No stale previously visible unrelated entries remain.

### Scenario C — Positive: selecting from filtered results works correctly

**Steps:**
1. Keep query `216 - Omaha, NE`.
2. Click matching result.
3. Observe dropdown close and field value.

**Expected:**
- Dropdown closes after selecting result.
- Associated Franchise field value updates to selected match.
- Selected value exactly matches clicked result text.

### Scenario D — Negative: no-match search behavior

**Steps:**
1. Reopen Associated Franchise dropdown.
2. Enter query with no known matches: `zzzz-no-match-123`.
3. Observe list area.

**Expected:**
- No result row is displayed (or explicit empty state message appears).
- No unrelated franchise is shown as a false-positive match.
- UI remains responsive with no error overlay.

### Scenario E — Positive recovery: clearing search restores full list

**Steps:**
1. After no-match query, clear search input.
2. Observe result list again.

**Expected:**
- Full/default franchise list repopulates.
- Search recovers without requiring drawer reopen.
- Previously selected franchise value (if any) is not overwritten by search clear.

### Scenario F — Edge: partial query behavior

**Steps:**
1. Enter partial token (example: `Omaha` or `216`).
2. Observe results.

**Expected:**
- Results include relevant matches based on implemented search mode.
- Behavior is consistent across repeated runs (contains vs starts-with should be deterministic).

### Scenario G — Edge: rapid search input changes

**Steps:**
1. Type one query (`216`), then quickly replace with another (`240`) without closing dropdown.
2. Repeat twice.

**Expected:**
- Result list updates to latest query only.
- No stale data race where older query results remain visible.
- Dropdown remains stable (no collapse/reopen glitch).

### Scenario H — Edge: cancel/reopen does not carry stale search state

**Steps:**
1. Enter search query in Associated Franchise dropdown.
2. Close Create Property drawer with **Cancel**.
3. Reopen drawer and open Associated Franchise dropdown again.

**Expected:**
- Search input is clean (empty) on fresh reopen unless draft-persistence is intentionally designed.
- Default list is shown again.

### Coverage gaps identified (workflow-only)

- Requirement does not specify search semantics (exact/contains/prefix/fuzzy) as acceptance criteria.
- No explicit performance threshold is defined for search response time on large franchise lists.
- Empty-state UX for no-match results is not standardized in the requirement.
- Role-based search scope (all franchises vs restricted subset) is not explicitly documented.

---

## M-PROP-04K — Verify that Select Assignee dropdown supports search and returns matching assignees/users correctly.

**Gap vs automation:** Existing coverage selects assignee in create flow, but there is no dedicated manual requirement workflow validating assignee search behavior (match quality, no-match handling, result refresh after clear, and stability under rapid query changes).

**Objective:** Validate that **Select Assignee** dropdown supports reliable search and returns matching users, while handling no-match and reset conditions correctly.

**Preconditions:**

- Log in using `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module (`/app/sales/locations`).
- Open **Create Property** drawer.
- Keep at least two known assignee names available for validation in the current environment (for example one with shared prefix and one clearly different).

### Scenario A (M-PROP-04K-A) — Dropdown open + baseline list visibility

**Steps:**
1. In Create Property drawer, click **Select Assignee**.
2. Verify dropdown/popup appears anchored to the assignee control.
3. Confirm `Search` input is visible, enabled, and accepts typing.
4. Without typing, inspect the list area.

**Expected results:**
- Dropdown opens without freeze, overlap break, or blocked UI.
- Search input is interactable and focused (or focus can be placed with one click).
- A default list of assignees/users is visible in standard tenant state.
- Each row is clickable/selectable (no disabled style unless role policy intentionally disables it).

**Edge/negative checks:**
- If list is empty, verify whether empty state is explicit and user-friendly (message/placeholder), not a blank broken panel.

### Scenario B (M-PROP-04K-B) — Exact match search returns correct assignee(s)

**Steps:**
1. In `Search`, type a full known assignee display name (example: `Brandon Nyffeler` or tenant-equivalent).
2. Wait for filtering to settle.
3. Compare visible rows with query.

**Expected results:**
- Matching assignee row(s) are shown.
- Obviously unrelated rows are not shown.
- Matching rows remain clickable.

**Edge/negative checks:**
- If duplicate names exist, verify all legitimate duplicate entries remain visible (do not collapse into one unexpectedly).

### Scenario C (M-PROP-04K-C) — Selection from filtered results populates assignee field

**Steps:**
1. Keep filtered results from Scenario B.
2. Click one visible assignee result.
3. Observe dropdown close behavior.
4. Verify the **Select Assignee** field/control value in the drawer.

**Expected results:**
- Click selects intended row (no off-by-one or wrong user selected).
- Dropdown closes after selection (or follows defined selection UX).
- Assignee field shows the selected assignee label/value correctly.
- Reopening dropdown keeps selected assignee state unless changed.

**Edge/negative checks:**
- Selected value must match clicked row text exactly (or product-defined normalized format).

### Scenario D (M-PROP-04K-D) — No-match query behavior

**Steps:**
1. Reopen **Select Assignee** dropdown.
2. Enter guaranteed no-hit query (example: `zzzz-no-user-123`).
3. Observe results area.

**Expected results:**
- No assignee rows are returned, or explicit no-result state is shown.
- No false-positive unrelated user appears.
- UI remains stable (no crash, spinner lock, or script error).

**Edge/negative checks:**
- Verify previously selected assignee value in the main field is not cleared by no-match search alone.

### Scenario E (M-PROP-04K-E) — Clear search restores results without side effects

**Steps:**
1. From no-match state, clear the Search input (Ctrl+A/Delete or clear icon if present).
2. Wait for list refresh.
3. Observe result list and selected assignee value.

**Expected results:**
- Default user list returns.
- Dropdown remains usable; no reopen required.
- Previously selected assignee value is unchanged unless a new selection is made.

**Edge/negative checks:**
- Clearing via keyboard and via clear icon (if present) should yield same behavior.

### Scenario F (M-PROP-04K-F) — Partial query + case-insensitive behavior

**Steps:**
1. Type a partial token from a known assignee (example first 2-4 characters).
2. Record visible results.
3. Repeat with same token in different casing (upper/lower/mixed).

**Expected results:**
- Partial query returns logically relevant users.
- Case variation does not break matching (unless case-sensitive behavior is explicitly required).
- Results are consistent between repeated runs.

**Edge/negative checks:**
- If behavior is case-sensitive in your tenant, capture as a functional decision/gap.

### Scenario G (M-PROP-04K-G) — Rapid query replacement stability

**Steps:**
1. Type query A quickly (example: `Brandon`).
2. Immediately replace with query B (example: `Chuck`) without closing dropdown.
3. Repeat replacement 2-3 times.

**Expected results:**
- Final visible results correspond to latest query only.
- Older/stale results do not linger.
- Control remains responsive throughout rapid edits.

**Edge/negative checks:**
- No flicker/ghost rows that remain clickable after query changed.

### Scenario H (M-PROP-04K-H) — Whitespace and special-character handling

**Steps:**
1. Search using leading/trailing spaces around a valid token (example: `  Brandon  `).
2. Search with internal double spaces and punctuation/apostrophe/hyphen if such names exist.

**Expected results:**
- Leading/trailing spaces are ignored or handled gracefully.
- Special characters do not break filtering.
- No error toast/console-visible crash behavior in UI.

**Edge/negative checks:**
- If query parsing is strict, document exact matching rule and expected user guidance.

### Scenario I (M-PROP-04K-I) — Cancel/reopen reset behavior

**Steps:**
1. Enter any search text in Select Assignee dropdown.
2. Close Create Property drawer with **Cancel**.
3. Reopen Create Property drawer.
4. Open Select Assignee dropdown again.

**Expected results:**
- Search input starts fresh/empty after reopen (unless draft persistence is explicitly required).
- Assignee list appears in default state.
- No stale query from previous drawer session remains.

**Edge/negative checks:**
- If sticky query is observed, flag as bug or requirement clarification.

### Scenario J (M-PROP-04K-J) — Permission/role visibility validation

**Steps:**
1. Execute Scenarios A-D under at least two roles if available (example HO and SM).
2. Compare searchable assignee set and selection permissions.

**Expected results:**
- Visible assignees align with role permissions.
- Unauthorized users are not selectable/searchable where restricted.
- No permission bypass through search text.

**Edge/negative checks:**
- Document any mismatch between expected role scope and actual result set.

### Coverage gaps identified (workflow-only)

- Requirement does not define strict search semantics (exact vs contains vs prefix vs fuzzy).
- Expected behavior for duplicates (same display name) is not explicitly defined.
- No response-time SLA/threshold for large assignee directories.
- No explicit acceptance criteria for whitespace/special-character normalization.
- Role-based searchable assignee scope is not documented as formal acceptance criteria.

---

## M-PROP-04L — Verify that the `Assign Supervisor` checkbox is visible and can be checked/unchecked.

**Gap vs automation:** Current automated coverage focuses on assignee/search and other create-flow fields; there is no dedicated workflow asserting `Assign Supervisor` checkbox visibility, toggle behavior, and state persistence/reset expectations.

**Objective:** Validate that `Assign Supervisor` is visible in the Create Property flow (where applicable), can be toggled ON/OFF reliably, and does not show unstable or ambiguous behavior across open/close/reset actions.

**Preconditions:**

- Log in with `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module and launch **Create Property** drawer.
- Reach the area where `Assign Supervisor` is expected to appear (scroll if needed).

### Scenario A (M-PROP-04L-A) — Baseline visibility and default state

**Steps:**
1. Open Create Property drawer.
2. Locate `Assign Supervisor` checkbox label and control.
3. Observe initial checkbox state (checked or unchecked).

**Expected results:**
- Checkbox is visible with clear label text `Assign Supervisor`.
- Checkbox control is enabled (unless role/business rule intentionally disables it).
- Initial state is deterministic per product rule (document observed default).

**Edge/negative checks:**
- If checkbox is missing, verify whether missing is role-based; capture role and environment.

### Scenario B (M-PROP-04L-B) — Check action (OFF -> ON)

**Steps:**
1. If checkbox is unchecked, click checkbox once.
2. Observe visual state immediately after click.

**Expected results:**
- Checkbox changes to checked state.
- Checked state is visually clear (tick/filled state and accessibility state if inspectable).
- No unrelated field is auto-modified unexpectedly.

**Edge/negative checks:**
- Rapid double-click should not cause desync/flapping state.

### Scenario C (M-PROP-04L-C) — Uncheck action (ON -> OFF)

**Steps:**
1. Starting from checked state, click checkbox once.
2. Observe visual state after interaction.

**Expected results:**
- Checkbox returns to unchecked state.
- State change is immediate and stable.
- No validation error appears from simple toggle action.

**Edge/negative checks:**
- Keyboard toggle (`Space`) should match mouse-click behavior when checkbox is focused.

### Scenario D (M-PROP-04L-D) — Repeated toggle stability

**Steps:**
1. Toggle checkbox ON/OFF repeatedly (5-8 times).
2. Pause briefly between toggles and monitor final state.

**Expected results:**
- Every user action results in exactly one state transition.
- Final state matches last user action.
- UI remains responsive without stuck intermediate state.

**Edge/negative checks:**
- No console-visible crash symptoms in UI (broken control rendering, frozen clicks).

### Scenario E (M-PROP-04L-E) — Toggle persistence during same drawer session

**Steps:**
1. Check `Assign Supervisor`.
2. Interact with unrelated fields (e.g., source/franchise/assignee).
3. Return to checkbox location and verify state.
4. Uncheck and repeat quick unrelated interactions.

**Expected results:**
- Checkbox state persists within the same open drawer session.
- Unrelated field edits do not silently reset checkbox.

**Edge/negative checks:**
- If dependency logic resets checkbox, behavior must be clearly explainable and documented.

### Scenario F (M-PROP-04L-F) — Cancel/reopen reset behavior

**Steps:**
1. Set checkbox to checked state.
2. Close Create Property drawer using **Cancel**.
3. Reopen Create Property drawer.
4. Inspect checkbox state again.

**Expected results:**
- Checkbox state on reopen follows defined reset rule (commonly default state).
- No stale prior-session state leaks unless draft persistence is explicitly intended.

**Edge/negative checks:**
- If state persists unexpectedly across sessions, log as bug or requirement clarification gap.

### Scenario G (M-PROP-04L-G) — Validation and save-side impact probe

**Steps:**
1. Create one draft attempt with checkbox checked and one with unchecked (without submitting if submission is out of scope).
2. Observe immediate UI validation messages during form interactions.

**Expected results:**
- Checkbox toggle itself does not trigger unrelated required-field errors.
- No contradictory helper text appears for checked vs unchecked states.

**Edge/negative checks:**
- If business rules require additional fields when checked, this dependency must be explicitly documented.

### Scenario H (M-PROP-04L-H) — Role/permission behavior

**Steps:**
1. Repeat Scenarios A-C with at least one additional role (if available, e.g., HO and SM).
2. Compare visibility and editability of checkbox.

**Expected results:**
- Visibility/editability follows role permissions consistently.
- If readonly/hidden for a role, behavior is consistent and documented.

**Edge/negative checks:**
- Mixed behavior across same role/session should be flagged as instability.

### Coverage gaps identified (workflow-only)

- Requirement does not define expected default checkbox state.
- Requirement does not define whether checkbox state should persist after Cancel/reopen.
- No explicit acceptance criteria for role-based visibility/edit permissions.
- No documented dependency rules when checkbox is checked (if it drives backend logic).
- No accessibility acceptance criteria (keyboard toggle/focus/ARIA) included in requirement.

---

## M-PROP-04M — Verify that `Assign Supervisor` checkbox is disabled when user selects an HO (Home Officer) user as assignee.

**Gap vs automation:** Existing automation verifies `Assign Supervisor` visibility/toggle behavior and assignee search flows separately, but there is no dedicated requirement-level workflow asserting the HO-assignee rule that disables `Assign Supervisor`.

**Objective:** Validate end-to-end behavior that selecting an HO (**Home Officer**) assignee forces `Assign Supervisor` into a disabled/non-editable state (as per requirement), and that non-HO assignees do not incorrectly keep that disabled state.

**Preconditions:**

- Log in with `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module and launch **Create Property** drawer.
- Ensure you have at least:
  - one known **HO (Home Officer) assignee**,
  - one known **non-HO assignee** (SM/SP/other allowed role).

### Scenario A (M-PROP-04M-A) — Baseline before assignee selection

**Steps:**
1. Open Create Property drawer.
2. Locate `Assign Supervisor` checkbox before selecting any assignee.
3. Record current state (enabled/disabled, checked/unchecked).

**Expected results:**
- Checkbox is visible and state is clearly readable.
- Baseline state is deterministic for current role/environment.

**Edge/negative checks:**
- If checkbox is already disabled at baseline, capture role/config context and verify whether this is expected by policy.

### Scenario B (M-PROP-04M-B) — Select HO assignee and verify disable rule

**Steps:**
1. Open **Select Assignee** dropdown.
2. Search and select a known HO user.
3. Return focus to `Assign Supervisor` area.
4. Attempt to toggle checkbox using mouse click.
5. Attempt to toggle checkbox using keyboard (`Tab` + `Space`) if focusable.

**Expected results:**
- After HO selection, `Assign Supervisor` becomes disabled/non-interactive.
- Checkbox state cannot be changed by mouse or keyboard.
- Disabled visual indicator is present (greyed style/cursor/state attribute).

**Edge/negative checks:**
- No transient enable flicker after HO selection.
- No hidden validation or script error appears during state change.

### Scenario C (M-PROP-04M-C) — Re-select non-HO assignee and verify re-enable behavior

**Steps:**
1. Reopen assignee dropdown.
2. Select a known non-HO assignee.
3. Re-check `Assign Supervisor` interactivity.
4. Toggle checkbox ON/OFF once.

**Expected results:**
- Checkbox returns to enabled state (if business rule is strictly HO-only disable).
- User can toggle checkbox again successfully.
- No stale disabled state remains from previous HO selection.

**Edge/negative checks:**
- If it remains disabled, confirm whether this is intended sticky policy or bug.

### Scenario D (M-PROP-04M-D) — HO to HO switch consistency

**Steps:**
1. Select HO assignee A.
2. Verify checkbox disabled.
3. Switch to HO assignee B.
4. Verify checkbox remains disabled.

**Expected results:**
- Disable rule applies consistently for all HO assignees.
- No role-name/text-matching inconsistency across different HO users.

**Edge/negative checks:**
- If one HO disables and another does not, flag role mapping inconsistency.

### Scenario E (M-PROP-04M-E) — Search + selection path robustness for HO rule

**Steps:**
1. Use exact search to find HO assignee and select.
2. Repeat using partial query search path for another HO assignee.
3. Validate checkbox disabled in both paths.

**Expected results:**
- Disable rule is independent of search style (exact/partial).
- Result source/path does not affect policy enforcement.

**Edge/negative checks:**
- Rapid query changes should not apply wrong assignee role state to checkbox.

### Scenario F (M-PROP-04M-F) — Cancel/reopen reset validation

**Steps:**
1. Select HO assignee and confirm checkbox disabled.
2. Cancel Create Property drawer.
3. Reopen Create Property drawer without selecting assignee.
4. Observe checkbox state.

**Expected results:**
- Reopened drawer returns to default baseline state for a new session.
- HO-driven disabled state does not leak into a fresh drawer session unless explicitly designed.

**Edge/negative checks:**
- If disabled state persists with no assignee selected, flag as potential state-leak bug.

### Scenario G (M-PROP-04M-G) — Submission/validation-side behavior probe

**Steps:**
1. With HO assignee selected (checkbox disabled), interact with remaining fields minimally.
2. Observe whether any validation/help text references forced disable condition.
3. Repeat with non-HO selected (checkbox enabled) and compare.

**Expected results:**
- Disabled state does not introduce contradictory validation messages.
- UI messaging (if any) is consistent with HO policy.

**Edge/negative checks:**
- Missing explanation for disabled control can be logged as UX gap if product expects user rationale.

### Scenario H (M-PROP-04M-H) — Role-based actor coverage (who is performing create)

**Steps:**
1. Execute Scenarios B/C under at least two creator roles if available (for example HO user session and SM user session).
2. Compare behavior for same assignee selections.

**Expected results:**
- HO-assignee disable rule is consistent regardless of creator role, unless requirement explicitly says otherwise.
- Any role-specific variance is predictable and documented.

**Edge/negative checks:**
- Inconsistent behavior for identical assignee role across creator roles should be flagged.

### Coverage gaps identified (workflow-only)

- Requirement does not define expected baseline checkbox state before assignee selection.
- Requirement does not define whether checkbox should auto-uncheck when becoming disabled.
- No explicit UX requirement on why checkbox is disabled (tooltip/helper text).
- HO role identification criteria (role flag vs label text) is not documented.
- No explicit acceptance criteria for state restoration when switching HO <-> non-HO assignees.

---

## M-PROP-04N — Verify that checking `Assign Supervisor` reveals the `Select Supervisor` field.

**Gap vs automation:** Existing coverage validates `Assign Supervisor` visibility/toggle and HO-disable policy, but there is no dedicated requirement-level workflow proving that enabling `Assign Supervisor` reveals the `Select Supervisor` field and that unchecking hides it again.

**Objective:** Validate end-to-end UI dependency between `Assign Supervisor` and `Select Supervisor`, including reveal/hide behavior, stability across repeated toggles, and reset behavior after cancel/reopen.

**Preconditions:**

- Log in with `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module and launch **Create Property** drawer.
- Ensure `Assign Supervisor` checkbox is visible and enabled for the selected assignee context (use non-HO assignee if HO rule disables the checkbox).

### Scenario A (M-PROP-04N-A) — Baseline before checking checkbox

**Steps:**
1. Open Create Property drawer.
2. Locate `Assign Supervisor` checkbox.
3. Observe whether `Select Supervisor` field is currently visible before checking.

**Expected results:**
- `Assign Supervisor` is visible.
- `Select Supervisor` is hidden (or clearly inactive) before checkbox is checked, if this is the intended dependency.

**Edge/negative checks:**
- If `Select Supervisor` is already visible at baseline, verify whether checkbox default is checked or whether this is a UI-rule mismatch.

### Scenario B (M-PROP-04N-B) — Positive: check checkbox reveals field

**Steps:**
1. Check `Assign Supervisor`.
2. Observe UI region where dependent fields appear.
3. Locate `Select Supervisor` label/control.

**Expected results:**
- `Select Supervisor` becomes visible after checking.
- Field appears in correct layout position (no overlap/cut-off).
- Field is interactable (focusable/clickable) unless explicitly readonly by policy.

**Edge/negative checks:**
- Reveal should happen without page refresh or drawer reopen.

### Scenario C (M-PROP-04N-C) — Positive: uncheck checkbox hides field

**Steps:**
1. Starting from checked state with `Select Supervisor` visible, uncheck `Assign Supervisor`.
2. Observe whether `Select Supervisor` hides.

**Expected results:**
- `Select Supervisor` hides (or becomes disabled/inactive per product rule) immediately after uncheck.
- No stale dropdown/popover remains floating after hide.

**Edge/negative checks:**
- If field remains visible but disabled, confirm this is explicit UX behavior and documented.

### Scenario D (M-PROP-04N-D) — Repeated toggle stability (show/hide cycles)

**Steps:**
1. Toggle `Assign Supervisor` ON/OFF repeatedly (5-8 cycles).
2. In each cycle, verify `Select Supervisor` show/hide state.

**Expected results:**
- ON always reveals `Select Supervisor`.
- OFF always hides/deactivates `Select Supervisor` according to rule.
- No flicker/glitch where dependency state becomes inverted.

**Edge/negative checks:**
- Final visibility state must match final checkbox state.

### Scenario E (M-PROP-04N-E) — Interaction probe when field is revealed

**Steps:**
1. Check `Assign Supervisor` so `Select Supervisor` appears.
2. Click/open `Select Supervisor` field.
3. Verify dropdown/input opens and can be used minimally.
4. Close without selecting (if selection not in scope for this requirement).

**Expected results:**
- Revealed field is functionally interactive, not just visually present.
- Open/close behavior is stable with no console-visible UI crash symptoms.

**Edge/negative checks:**
- If field appears but cannot be opened, mark as dependency regression.

### Scenario F (M-PROP-04N-F) — State persistence during same drawer session

**Steps:**
1. Check `Assign Supervisor` and verify `Select Supervisor` appears.
2. Interact with unrelated fields (e.g., source/stage/assignee).
3. Return to supervisor section and verify visibility state.

**Expected results:**
- `Select Supervisor` visibility remains consistent with current checkbox state.
- Unrelated interactions do not silently collapse/reveal field incorrectly.

**Edge/negative checks:**
- Any auto-hide after unrelated actions should be documented as bug/hidden dependency.

### Scenario G (M-PROP-04N-G) — Cancel/reopen reset behavior

**Steps:**
1. Check `Assign Supervisor` and confirm `Select Supervisor` is visible.
2. Cancel Create Property drawer.
3. Reopen Create Property drawer.
4. Re-check baseline visibility of `Select Supervisor`.

**Expected results:**
- Fresh drawer starts from default state (commonly unchecked + hidden field) unless draft persistence is intentionally designed.
- Previous session reveal state does not leak unexpectedly.

**Edge/negative checks:**
- If reopened drawer retains prior reveal without explicit draft mode, log as state-leak concern.

### Scenario H (M-PROP-04N-H) — Role/assignee dependency cross-check

**Steps:**
1. Validate Scenarios B-C with non-HO assignee (checkbox enabled).
2. Switch to HO assignee (if available) where checkbox is expected to be disabled.
3. Observe `Select Supervisor` behavior under HO rule.

**Expected results:**
- Non-HO path follows reveal/hide dependency normally.
- HO path respects disable policy and does not permit contradictory reveal behavior.

**Edge/negative checks:**
- If `Select Supervisor` remains visible while checkbox is disabled and unchecked, capture as rule inconsistency.

### Coverage gaps identified (workflow-only)

- Requirement does not explicitly define baseline visibility of `Select Supervisor` before checkbox interaction.
- Requirement does not define whether unchecking should hide field or keep it visible-but-disabled.
- No explicit acceptance criteria for preserving/clearing selected supervisor when field is hidden.
- No response-time or animation threshold defined for reveal/hide transition.
- Role-based behavior matrix (HO vs non-HO vs creator role) is not formally specified.

---

## M-PROP-04O — Verify that `Select Supervisor` becomes mandatory when `Assign Supervisor` is checked.

**Gap vs automation:** Existing automation validates `Assign Supervisor` reveal/hide dependency for `Select Supervisor`, but there is no requirement-level workflow proving mandatory validation enforcement when `Assign Supervisor` is ON and `Select Supervisor` is left unselected.

**Objective:** Validate that checking `Assign Supervisor` turns `Select Supervisor` into a required field, blocks submission without supervisor selection, and clears the mandatory constraint when `Assign Supervisor` is unchecked (as per intended product behavior).

**Preconditions:**

- Log in with `.env` credentials and navigate to `BASE_URL`.
- Open **Properties** module and launch **Create Property** drawer.
- Ensure assignee context allows `Assign Supervisor` checkbox interaction (non-HO assignee if HO rule disables checkbox).
- Fill all other required fields minimally (except supervisor) when needed, so validation result isolates the supervisor-mandatory rule.

### Scenario A (M-PROP-04O-A) — Baseline: supervisor is not mandatory while checkbox is unchecked

**Steps:**
1. Open Create Property drawer.
2. Leave `Assign Supervisor` unchecked.
3. Fill mandatory fields required for submit (property name, address, etc.) but do not set supervisor.
4. Attempt submit.

**Expected results:**
- Submission is not blocked by `Select Supervisor`-required validation when checkbox is unchecked.
- No `Select Supervisor` mandatory error appears in unchecked state.

**Edge/negative checks:**
- If submission fails, ensure failure reason is not incorrectly tied to supervisor when checkbox is OFF.

### Scenario B (M-PROP-04O-B) — Positive mandatory trigger on check

**Steps:**
1. Check `Assign Supervisor`.
2. Confirm `Select Supervisor` field is visible.
3. Do not choose supervisor.
4. Fill other required fields and attempt submit.

**Expected results:**
- Submit is blocked because supervisor is required in checked state.
- Clear validation feedback appears for `Select Supervisor` (inline error, helper text, or equivalent).
- Validation focus/attention is directed to supervisor field area.

**Edge/negative checks:**
- Error should be specific to missing supervisor, not generic or misleading.

### Scenario C (M-PROP-04O-C) — Positive pass after selecting supervisor

**Steps:**
1. Keep `Assign Supervisor` checked.
2. Select a valid supervisor in `Select Supervisor`.
3. Re-attempt submit with other required fields valid.

**Expected results:**
- Supervisor-required error clears after valid selection.
- Submit proceeds past supervisor validation gate.

**Edge/negative checks:**
- Changing selected supervisor should keep field valid (no stale error).

### Scenario D (M-PROP-04O-D) — Uncheck removes mandatory constraint

**Steps:**
1. Check `Assign Supervisor` and trigger supervisor-required validation once.
2. Uncheck `Assign Supervisor`.
3. Attempt submit again without supervisor.

**Expected results:**
- Supervisor-required validation no longer blocks submit once checkbox is unchecked.
- Existing supervisor-required error (if shown) clears or becomes inactive.

**Edge/negative checks:**
- Hidden/disabled supervisor field must not continue blocking submit in background.

### Scenario E (M-PROP-04O-E) — Re-check re-applies mandatory constraint

**Steps:**
1. From unchecked state, check `Assign Supervisor` again.
2. Keep supervisor unselected.
3. Attempt submit.

**Expected results:**
- Mandatory rule reactivates consistently on each check cycle.
- Supervisor-required validation behavior is deterministic.

**Edge/negative checks:**
- No one-time-only behavior where validation works first time but fails to reapply later.

### Scenario F (M-PROP-04O-F) — Existing selected supervisor + toggle behavior

**Steps:**
1. Check `Assign Supervisor`, select supervisor.
2. Uncheck `Assign Supervisor`.
3. Recheck `Assign Supervisor`.
4. Observe whether previous supervisor selection persists or resets.
5. Submit accordingly.

**Expected results:**
- Behavior is consistent with product rule (persist selection or reset intentionally).
- If reset occurs, mandatory validation should require re-selection.
- If persisted, field should remain valid without extra action.

**Edge/negative checks:**
- Document ambiguous behavior as requirement gap if persistence policy is not specified.

### Scenario G (M-PROP-04O-G) — Cancel/reopen reset behavior for mandatory state

**Steps:**
1. Check `Assign Supervisor` and trigger missing-supervisor validation.
2. Cancel drawer.
3. Reopen Create Property drawer.
4. Inspect initial mandatory state and submit behavior.

**Expected results:**
- Fresh drawer returns to default baseline (commonly unchecked and non-mandatory supervisor).
- Old validation messages/state do not leak into new session.

**Edge/negative checks:**
- If stale supervisor-required error appears on reopen, flag as state-leak defect.

### Scenario H (M-PROP-04O-H) — Role/permission cross-check

**Steps:**
1. Execute Scenarios B-D under at least two creator roles if available (e.g., HO and SM).
2. Compare validation behavior where checkbox is enabled.

**Expected results:**
- Mandatory rule is consistent for all roles allowed to use `Assign Supervisor`.
- Any role-specific differences are explicit and documented.

**Edge/negative checks:**
- If role changes alter mandatory logic unexpectedly, record as policy mismatch.

### Coverage gaps identified (workflow-only)

- Requirement does not define exact validation message text for missing supervisor.
- Requirement does not define whether previously selected supervisor should persist after uncheck/recheck.
- No explicit rule for how mandatory behavior should appear when supervisor control is hidden/disabled.
- No acceptance criteria for keyboard-only/accessibility validation flow (focus target after failed submit).
- No explicit role matrix for when mandatory rule applies vs when checkbox is unavailable.

---

## M-PROP-04P — Verify that `Select Supervisor` dropdown opens and lists supervisors/users correctly.

**Gap vs automation:** Current automation covers reveal/mandatory behavior for `Select Supervisor`, but there is no dedicated requirement-level workflow validating dropdown opening reliability, full option-list behavior, search/filter UX, empty-state handling, and selection persistence for supervisors/users.

**Objective:** Validate that the `Select Supervisor` control is discoverable, opens consistently, lists valid supervisor/user options, supports filtering correctly, and behaves safely across close/reopen/reset flows.

**Preconditions:**

- Login with `.env` credentials and open `BASE_URL`.
- Navigate to **Properties** (`/app/sales/locations`).
- Open **Create Property** drawer.
- Ensure assignee context allows supervisor assignment:
  - `Assign Supervisor` is enabled.
  - `Assign Supervisor` is checked.
  - `Select Supervisor` control is visible.

### Scenario A (M-PROP-04P-A) — Baseline visibility and enabled state

**Steps:**
1. Open Create Property drawer.
2. Scroll to assignee/supervisor section.
3. Confirm `Assign Supervisor` is visible and enabled.
4. Check `Assign Supervisor`.
5. Inspect `Select Supervisor` field label, placeholder/default text, and icon.

**Expected results:**
- `Select Supervisor` is visible only in valid state per product rule.
- Control appears interactive (not disabled/read-only unless role rule applies).
- Label and placeholder are human-readable and consistent.

**Edge/negative checks:**
- If control appears with blank/ambiguous text, log as UX/accessibility defect.
- If control remains hidden after checking checkbox, fail against dependency rule.

### Scenario B (M-PROP-04P-B) — Positive open/close behavior

**Steps:**
1. Click `Select Supervisor` once.
2. Verify dropdown/popup opens.
3. Dismiss by clicking outside.
4. Reopen dropdown.
5. Dismiss using `Esc`.

**Expected results:**
- Dropdown opens on first click.
- Outside click and `Esc` both close it.
- Reopen works repeatedly without requiring page refresh.

**Edge/negative checks:**
- If first click intermittently fails to open, record frequency (for example 2/10 failures).
- If duplicate overlays/popups stack, log as defect.

### Scenario C (M-PROP-04P-C) — Option list correctness (content + quality)

**Steps:**
1. Open `Select Supervisor` dropdown.
2. Record first 10-15 options exactly as displayed.
3. Verify each row appears to represent a valid user/supervisor identity (name/email/role formatting).
4. Scroll through list (if scrollable/virtualized) to load more items.

**Expected results:**
- List is populated (or intentional empty-state message is shown).
- No corrupted text, duplicate noise rows, or placeholder artifacts.
- Option rows use consistent format (for example display name + additional identity cue).

**Edge/negative checks:**
- If duplicate options map to same user identity, mark as data quality risk.
- If list is unexpectedly empty for authorized user, mark as functional defect.

### Scenario D (M-PROP-04P-D) — Search/filter behavior (if search input exists)

**Steps:**
1. Open supervisor dropdown.
2. Type exact known supervisor text (full or partial).
3. Verify matching options narrow down.
4. Clear input and verify full list restores.
5. Enter random no-match text (for example `zzzz-no-user`).

**Expected results:**
- Exact/partial text returns relevant matches.
- Clear restores baseline list.
- No-match shows clean empty-state (not broken UI).

**Edge/negative checks:**
- Rapid typing should not freeze or misrender list.
- Search should not permanently hide options after clearing.

### Scenario E (M-PROP-04P-E) — Selection and field population

**Steps:**
1. Open dropdown and choose one supervisor/user.
2. Verify selected value appears in closed field.
3. Reopen and choose a different supervisor.
4. Verify new selection replaces prior selection.

**Expected results:**
- Selected option persists in field after close.
- Reselection updates displayed value immediately.
- No stale old selection text remains.

**Edge/negative checks:**
- If control supports single-select, ensure only one value is retained.
- If multiselect chips appear unexpectedly, verify this is intended and documented.

### Scenario F (M-PROP-04P-F) — Validation interaction with mandatory rule

**Steps:**
1. Keep `Assign Supervisor` checked and leave supervisor unselected.
2. Fill other mandatory fields.
3. Submit Create Property.
4. Select a supervisor and submit again.

**Expected results:**
- First submit blocks with clear supervisor-required feedback.
- After valid selection, supervisor-specific validation clears.

**Edge/negative checks:**
- Error should target correct field and not remain stuck after valid selection.
- Validation should not appear when `Assign Supervisor` is unchecked.

### Scenario G (M-PROP-04P-G) — Session reset and draft isolation

**Steps:**
1. Select supervisor in open drawer.
2. Cancel drawer.
3. Reopen Create Property drawer.
4. Recheck supervisor field baseline.

**Expected results:**
- Canceled draft does not leak previous supervisor selection unless explicitly designed.
- Fresh drawer shows default supervisor state.

**Edge/negative checks:**
- If old selected supervisor persists after cancel/reopen, log state-leak defect.

### Scenario H (M-PROP-04P-H) — Role and permission cross-check

**Steps:**
1. Execute Scenarios B-E with at least two user roles (for example HO and SM) where available.
2. Compare option list visibility, open behavior, and validation behavior.

**Expected results:**
- Behavior is consistent with role policy.
- Any role-based differences are explicit and expected.

**Edge/negative checks:**
- If one role sees invalid/unexpected users in list, log authorization defect.
- If dropdown is visible but non-functional for one role without message, log UX defect.

### Scenario I (M-PROP-04P-I) — Keyboard and accessibility behavior

**Steps:**
1. Focus `Select Supervisor` via `Tab`.
2. Open with `Enter` or `Space`.
3. Navigate options with arrow keys.
4. Select with `Enter`.
5. Close with `Esc`.

**Expected results:**
- Control is keyboard-operable end to end.
- Visible focus indicator is present.
- Screen reader name/label is meaningful (not blank).

**Edge/negative checks:**
- If focus trap occurs inside dropdown or drawer, log accessibility defect.
- If control has empty accessible name, log WCAG label issue.

### Coverage gaps identified (workflow-only)

- Requirement does not define whether list should include only supervisors or broader user pool; expected source data needs explicit rule.
- Requirement does not define sort order (alphabetical, role-priority, last-used, etc.).
- Requirement does not define duplicate-name disambiguation (same display name with different emails/roles).
- Requirement does not define empty-state copy/behavior when no eligible supervisors exist.
- Requirement does not define exact keyboard accessibility acceptance criteria for this dropdown.

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
| 2026-04-17 | Added **M-PROP-04P** manual workflow for "`Select Supervisor` dropdown opens and lists supervisors/users correctly" with open/close reliability, list-quality checks, search/no-match behavior, selection/reselection, mandatory-validation interaction, reset behavior, role matrix, and accessibility-focused edge cases.                                                                     |
| 2026-04-15 | Added **M-PROP-04O** manual workflow for "`Select Supervisor` becomes mandatory when `Assign Supervisor` is checked" with mandatory-trigger validation, submit blocking, error-clear on selection, uncheck/recheck rule transitions, persistence/reset checks, role cross-checks, and workflow-only coverage gaps.                                                                               |
| 2026-04-15 | Added **M-PROP-04N** manual workflow for "`Assign Supervisor` checked state reveals `Select Supervisor` field" with baseline/reveal-hide dependency, repeated toggle stability, revealed-field interaction, session reset, role/assignee cross-check, and workflow-only coverage gaps.                                                                                                          |
| 2026-04-15 | Added **M-PROP-04M** manual workflow for "`Assign Supervisor` is disabled when HO assignee is selected" with HO/non-HO transition checks, toggle-block validation, search-path consistency, cancel/reopen reset, creator-role coverage, and workflow-only coverage gaps.                                                                                                                         |
| 2026-04-15 | Added **M-PROP-04L** manual workflow for "`Assign Supervisor` checkbox is visible and can be checked/unchecked" with visibility/default-state, toggle-on/off, repeated-toggle stability, same-session persistence, cancel/reopen reset, validation-side impact, role behavior, and workflow-only coverage gaps.                                                                              |
| 2026-04-15 | Added **M-PROP-04K** manual workflow for "Select Assignee dropdown supports search and returns matching users" with match/no-match/clear-reset/partial/rapid-change/reopen scenarios and workflow-only coverage gaps.                                                                                                                                                                             |
| 2026-04-15 | Added **M-PROP-04J** manual workflow for "Associated Franchise dropdown supports search and returns matching results" with match/no-match/clear-reset/partial/rapid-input/reopen scenarios and workflow-only coverage gaps.                                                                                                                                                                       |
| 2026-04-15 | Added **M-PROP-04I** manual workflow for "Property Affiliation displays as N/A before company selection" with baseline/transition/dismiss/reset/viewport/role checks and workflow-only coverage gaps.                                                                                                                                                                                           |
| 2026-04-15 | Added **M-PROP-04H** manual workflow for "selecting a Hubspot Stage populates the field correctly" with selection/reselection/persistence/dismiss/validation/reset/repeat/viewport scenarios and workflow-only coverage gaps.                                                                                                                                                                    |
| 2026-04-15 | Added **M-PROP-04G** manual workflow for "Choose a Hubspot Stage to map dropdown opens and lists available stages correctly" with open/list/select/reselect/dismiss/validation/reset/repeat/viewport scenarios and workflow-only coverage gaps.                                                                                                                                                 |
| 2026-04-15 | Added **M-PROP-04F** manual workflow for "selecting an Associated Franchise populates the field correctly" with dedicated selection/reselection/persistence/dismiss/no-match/reset/repeat-cycle scenarios and workflow-only coverage gaps.                                                                                                                                                       |
| 2026-04-15 | Added **M-PROP-04E** manual workflow for "Associated Franchise dropdown opens and lists available franchises correctly" with open/list/search/select/reselect/dismiss/no-match/reset/viewport scenarios and workflow-only coverage gaps.                                                                                                                                                         |
| 2026-04-15 | Added **M-PROP-04D** manual workflow for "Property Source selection populates field correctly" with positive/reselection, negative dismiss/validation, and edge reset/stability/viewport scenarios plus requirement gaps.                                                                                                                                                                            |
| 2026-04-15 | Added **M-PROP-04C** for Property Source dropdown workflow only: detailed positive/negative/edge manual scenarios, UAT-observed option list (`ALN`, `Building Connected`, `Inbound Lead - National`, `Referral`, `Inbound Lead - Local`, `Local Networking`, `Other Online Database`, `Rocket Reach`, `Sales Routing`, `ZoomInfo`), and requirement-level coverage gaps. |
| 2026-04-13 | Initial gap analysis against `tests/e2e/property-module.spec.js`, `pages/property-module.js`, and `register-notes-tasks-suite.js`. UAT probe: empty submit showed `Property / Property Name is required.` and `Address is required.`; affiliation buttons **Managed**, **Owned**, **Regional office**, **Shared**, **Tenant**, **Headquarters** appeared after selecting company **Regression Phase**. |
| 2026-04-13 | TC-PROP-019–028 implemented per gap doc; POM helpers added in `pages/property-module.js`.                                                                                                                                                                                                                                                                                                              |
| 2026-04-13 | Deep-dive update for M-PROP-10: assignment entry point confirmed on property detail header (`Assigned to`), with explicit HO->SM/SP verification flow and evidence checklist.                                                                                                                                                                                                                          |
| 2026-04-13 | M-PROP-10 automation split into **TC-PROP-029 (HO)** and **TC-PROP-030 (SM)** with user type in titles; doc aligned.                                                                                                                                                                                                                                                                                   |

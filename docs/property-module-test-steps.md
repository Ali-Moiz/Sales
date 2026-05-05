# Property Module Test Cases

This document explains the Property Module test flow in simple NLP-style language.
It is based on:

- [property-module.spec.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/tests/e2e/property-module.spec.js)
- [property-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/property-module.js)
- [register-notes-tasks-suite.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/tests/helpers/register-notes-tasks-suite.js)

## Execution Model

- The suite logs in only one time in `beforeAll`.
- All property test cases run in the same browser session.
- The suite is serial, so later cases depend on the property created earlier.
- A property is created once in `TC-PROP-007`.
- The same created property is reused in detail, edit, notes, tasks, and negative-search cases.
- When the property name is updated in `TC-PROP-013`, the updated name becomes the new shared reference for the remaining suite.
- Reusable Notes and Tasks CRUD tests reopen the same property detail page before each helper case.

## Dependency Resolution Flow

- The suite resolves the company name from `PROPERTY_TEST_COMPANY`, `CREATED_COMPANY_NAME`, shared runtime state, or the standalone fallback company.
- The Create Property flow depends on that company already existing in the system.
- After successful property creation, the suite stores both property name and linked company in `.tmp/shared-run-state.json`.
- Downstream modules can reuse that stored property and company pair.

## Dynamic Test Data

- Property name format: `S-P ####`
- Edited property name format: `S-P ####`
- Standalone fallback company: `Regression Phase`
- Runtime state file: `.tmp/shared-run-state.json`
- Create-property flow uses a unique Omaha address strategy to avoid duplicate-address collisions.
- Duplicate-address validation uses a known blocked geocoded address on purpose.

## Address Selection Strategy

- Property creation does not rely on one fixed address.
- The page object first generates timestamp-based Omaha street addresses to reduce repeat collisions across runs.
- If autocomplete does not resolve a timestamp-generated address, the suite falls back to a shuffled pool of known Omaha intersection addresses.
- The script tries multiple candidate addresses until one is accepted and the drawer closes.
- Duplicate-address validation is separate and intentionally submits a geocode that already exists in the database.

## High-Level End-to-End Flow

1. Open Properties page and verify list UI.
2. Open Create Property drawer and verify required fields.
3. Validate company search behavior.
4. Create a property linked to an existing company with a unique Omaha address.
5. Search the property from the list and open its detail page.
6. Validate sidebar sections, stage bar, and overview tabs.
7. Validate activities, notes entry points, and tasks entry points.
8. Validate edit-property behavior including disabled save and successful rename.
9. Validate negative property search and duplicate-address rejection behavior.
10. Run reusable Notes and Tasks CRUD smoke coverage on the same property detail page.

## Core Property Test Cases

### TC-PROP-001 | Properties module opens successfully

Execution steps:
- The script opens the Properties module from the sidebar.
- It waits for the page load to settle.
- It verifies that the URL contains `/app/sales/locations`.
- It verifies that the `Create Property` button is visible.

Expected result:
- The Properties page opens successfully.
- The `Create Property` button is visible.

### TC-PROP-002 | Properties table displays all expected column headers

Execution steps:
- The script stays on the Properties listing page.
- It checks the table headers one by one.
- It verifies `Property Name`, `Property Affiliation`, `Lot Number`, `Deal Count`, `Stage`, `Type`, `Created Date`, and `Last Modified Date`.

Expected result:
- All required property table headers are visible.

### TC-PROP-003 | Pagination is visible with correct format

Execution steps:
- The script reads the pagination section below the property table.
- It verifies that the text matches the format `X–Y of Z`.

Expected result:
- Pagination is visible.
- The pagination text follows the expected numeric format.
- The total property count is greater than 0.

### TC-PROP-004 | Create Property drawer opens with all required fields

Execution steps:
- The script opens the `Create Property` drawer from the list page.
- It waits for the drawer to open.
- It verifies the `Search Company` control.
- It verifies the `Property / Property Name` field.
- It verifies the `Add Property Source` control.
- It verifies the `Choose stage` control.
- It verifies the `Select Assignee` control.
- It verifies the `Type Address` field.
- It verifies the `Cancel` button.

Expected result:
- The Create Property drawer opens successfully.
- All required property-create fields are visible.

### TC-PROP-005 | Company dropdown searches and shows matching results

Execution steps:
- The script keeps the `Create Property` drawer open.
- It clicks the `Search Company` trigger.
- It waits for the tooltip dropdown.
- It enters the resolved company name in the search field.
- It waits for matching results to load.
- It verifies that a matching company result is visible.
- It closes the dropdown with `Escape`.

Expected result:
- Company search works correctly.
- A matching company result is visible in the dropdown.

### TC-PROP-006 | Cancel Create Property closes drawer without creating record

Execution steps:
- The script opens the `Create Property` drawer.
- It enters a unique temporary property name.
- It clicks the `Cancel` button inside the drawer (not the backdrop).
- It verifies that the drawer closes.
- It searches the property list for the temporary name.
- It verifies that no results are returned (the draft was not persisted).
- It clears the search.

Expected result:
- Clicking the Cancel button closes the drawer.
- The temporary property name does not appear in the Properties list (data was not saved).
- No property is created from the cancelled attempt.

### TC-PROP-007 | User can create a new property linked to existing company

Execution steps:
- The script generates a unique property name in the format `S-P ####`.
- It opens the `Create Property` drawer.
- It selects the resolved company from the searchable dropdown.
- It fills the property name.
- It selects a property source.
- It selects the associated franchise.
- It selects the stage.
- It selects property affiliations.
- It selects the assignee.
- It selects the contact affiliation.
- It tries unique Omaha addresses one by one until autocomplete resolves and submission succeeds.
- It waits for the success toast and drawer close behavior.
- It stores the created property and company in runtime state.
- It returns to the Properties list.
- It searches the created property name.
- It verifies that the property appears as a single search result.

Expected result:
- A new property is created successfully.
- A success toast ("Property Created Successfully") is visible after submission.
- The created property is searchable from the list page.

### TC-PROP-008 | User can search and open an existing property

Execution steps:
- The script opens the Properties list page.
- It searches the created property name.
- It clicks the matching property row.
- It waits for the detail page to open.
- It verifies that the property detail heading matches the created property name.

Expected result:
- The property detail page opens successfully for the created property.

### TC-PROP-009 | Property detail page shows all sidebar sections

Execution steps:
- The script stays on the created property detail page.
- It checks the left sidebar sections one by one.
- It verifies `Property Details`.
- It verifies `Companies`.
- It verifies `Deals`.
- It verifies `Contacts`.
- It verifies `Franchise Associated`.
- It verifies `Attachments`.

Expected result:
- All required sidebar sections are visible on the property detail page.

### TC-PROP-010 | Property detail shows stage bar and all 6 overview tabs

Execution steps:
- The script stays on the property detail page.
- It checks the `Property Stages` heading.
- It verifies that at least one visible stage such as `Approved` is shown.
- It verifies the overview tabs.
- It checks `Convert Questions`.
- It checks `Activities`.
- It checks `Notes`.
- It checks `Tasks`.
- It checks `Emails`.
- It checks `Meetings`.

Expected result:
- The property stage bar is visible.
- All six overview tabs are visible.

### TC-PROP-011 | Activities tab loads and shows at least one dated entry

Execution steps:
- The script opens the `Activities` tab.
- It verifies that the tab becomes active through `aria-selected="true"`.
- It checks for at least one date-grouped activity heading in the format `Month, YYYY`.

Expected result:
- The Activities tab loads successfully.
- At least one dated activity group is visible.

### TC-PROP-012 | Edit Property form opens pre-filled; Save disabled without changes

Execution steps:
- The script opens the property detail page.
- It clicks the `Edit` button.
- It waits for the `Edit Property` drawer to open.
- It verifies that the Property Name field is already filled with a non-empty value matching the current property name.
- It verifies that the `Save` button is disabled before any change is made.
- It closes the edit drawer.

Expected result:
- The edit form opens correctly.
- The Property Name field is pre-filled with the current property name (non-empty value).
- `Save` remains disabled until a change is made.

### TC-PROP-013 | User can edit property name and verify on detail page

Execution steps:
- The script generates a new edited property name in the format `S-P ####`.
- It opens the `Edit Property` drawer.
- It clears the current property name.
- It enters the new property name.
- It clicks `Save`.
- It waits for the edit drawer to close and the detail page to refresh.
- It verifies that the property detail heading shows the updated name.
- It updates the runtime reference so the remaining tests use the new property name.

Expected result:
- The property name is updated successfully.
- The updated name is visible on the detail page.

### TC-PROP-014 | Notes tab visible; Create New Note drawer opens with correct fields

Execution steps:
- The script opens the property detail page.
- It verifies that the `Notes` tab is visible.
- It opens the `Notes` tab.
- It verifies that the `Create New Note` button is visible.
- It clicks `Create New Note`.
- It waits for the `Add Notes` drawer to open.
- It verifies the Subject field.
- It verifies the rich text editor.
- It verifies the character counter.
- It verifies the `Save` button.
- It verifies the `Cancel` button.
- It closes the drawer.

Expected result:
- The Notes drawer opens with all expected fields.
- The drawer closes successfully.

### TC-PROP-015 | Tasks tab shows correct columns and New Task button

Execution steps:
- The script opens the property detail page.
- It verifies that the `Tasks` tab is visible.
- It opens the `Tasks` tab.
- It checks the task table columns.
- It verifies `Task Title`, `Task Description`, `Created By`, `Due Date`, `Priority`, and `Type`.
- It verifies that the `New Task` button is visible.
- It verifies the `No tasks Added.` empty state.

Expected result:
- The Tasks tab loads correctly.
- All expected task columns are visible.
- The `New Task` button is visible.
- The task empty state is visible.

### TC-PROP-016 | Create New Task drawer opens with all required fields

Execution steps:
- The script stays on the `Tasks` tab.
- It clicks the `New Task` button.
- It waits for the `Create New Task` drawer to open.
- It checks the `Task Title` field.
- It checks the description editor.
- It checks the `Select Type` control.
- It checks the `Select Priority` control.
- It checks the `Save` button.
- It checks the `Cancel` button.
- It closes the drawer.

Expected result:
- The Create Task drawer opens correctly.
- All required task fields are visible.

### TC-PROP-017 | Searching with non-existent name returns no results

Execution steps:
- The script opens the Properties list page.
- It enters a random non-existent property name in the search field.
- It waits for the search state to update.
- It verifies that search returns no matches.
- It clears the search field.

Expected result:
- No property record is returned for the invalid search term.

### TC-PROP-018 | Duplicate address is rejected with geocoordinate error

Execution steps:
- The script opens the Properties list page.
- It opens the `Create Property` drawer.
- It generates a unique property name so only the geocoded address becomes the duplicate factor.
- It fills all required fields.
- It selects the company.
- It fills the property name.
- It selects the property source.
- It selects the associated franchise.
- It selects the stage.
- It selects property affiliations.
- It selects the assignee.
- It selects the contact affiliation.
- It enters the known duplicate address `3500 Dodge St, Omaha, NE`.
- It submits the form.
- It waits for the duplicate-address alert toast.
- It verifies that the `Create Property` drawer remains open.
- It closes the drawer.
- It goes back to the Properties list.
- It searches the generated property name.
- It verifies that no property was created.

Expected result:
- The app rejects the duplicate geocoded address.
- The duplicate-address error message becomes visible.
- The create drawer stays open for correction.
- No new property is created.

### TC-PROP-026 | User can select a Property Affiliation option and the selection state is clearly shown

Execution steps:
- The script opens the Create Property drawer and selects a company to reveal affiliation chips.
- It verifies all six affiliation chips are visible.
- For each of three chips (Managed, Tenant, Headquarters), it clicks the chip, verifies the visual state changed (selected), clicks again, and verifies the state returned to unselected.

Expected result:
- Each chip responds to click by toggling its selected visual state (`aria-pressed`, border-width, or class).
- Clicking a chip a second time deselects it (toggle behaviour).
- The drawer remains open throughout.

---

### TC-PROP-070 | Verify that changing the selected company updates dependent fields (Property Affiliation chips)

**Preconditions:**
- User is logged in as HO.
- The Create Property drawer is accessible from the Properties list page.
- At least two different companies exist in the system.

**Execution steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Select a known company (e.g. `targetCompanyName`) using the Company search trigger.
4. Observe the Property Affiliation section — all six chips should now be visible.
5. Open the Company search trigger again and select a **different** company.
6. Observe the Property Affiliation section immediately after the second company is selected.
7. Cancel the drawer.

**Expected results:**
- After the first company is selected, all six affiliation chips (Managed, Owned, Shared, Tenant, Headquarters, Regional Office) become visible.
- After selecting a different company, the chips remain visible (refreshed for the new company) — no crash or blank state occurs.
- The drawer remains open throughout the flow.
- Cancelling the drawer closes it cleanly.

---

### TC-PROP-027 | User is able to assign levels to the property (stage persists after reload)

Execution steps:
- The script opens the created property detail page.
- It verifies the stage bar is visible.
- It clicks the "Approved" stage button.
- It reloads the page.
- It verifies the detail page re-opens and the stage bar still shows.
- It verifies the "Approved" stage is the currently active/selected stage.

Expected result:
- The stage bar is visible on the detail page.
- After clicking "Approved" and reloading, the "Approved" stage button shows as the active/selected stage (persisted).

---

### TC-PROP-019 | Create Property modal displays all expected fields, labels, and mandatory (*) indicators

Execution steps:
- The script opens the Create Property drawer.
- It scrolls through the full form and verifies all required and optional fields are visible (Company, Property Name, Source, Stage, Franchise, Assignee, Contact triggers, Submit button).
- It verifies that at least one mandatory field label carries a visible `*` marker (e.g. `Property Name *`, `Select Supervisor *`).
- It closes the drawer via Cancel.

Expected result:
- All expected fields and controls are visible.
- At least one mandatory `*` indicator is visible inside the drawer.
- The drawer closes cleanly on Cancel.

---

## Reusable Notes And Tasks CRUD Coverage

After `TC-PROP-018`, the property suite also registers the reusable Notes and Tasks smoke suite for the Property detail page. These cases run by reopening the same property detail before each helper case.

### Property Notes coverage

- `NT-Property-N001`: Notes tab is visible and clickable.
- `NT-Property-N002`: Notes empty state or existing notes list is visible.
- `NT-Property-N003`: `Add Notes` drawer shows all required fields.
- `NT-Property-N004`: User can create a note successfully and the note appears in the list.
- `NT-Property-N005`: Validation holds when Subject is empty.
- `NT-Property-N006`: Cancel Create Note closes the drawer without saving.
- `NT-Property-N007`: Character counter updates while typing description.
- `NT-Property-N008`: Edit Note drawer opens with existing values pre-filled.
- `NT-Property-N009`: User can edit note subject and save successfully.
- `NT-Property-N010`: Cancel Edit Note keeps the original note unchanged.
- `NT-Property-N011`: Delete Note confirmation dialog opens correctly.
- `NT-Property-N012`: Cancel Delete Note keeps the note in the list.
- `NT-Property-N013`: Confirm Delete Note removes the note from the list.

### Property Tasks coverage

- `NT-Property-T001`: Tasks tab is visible and clickable.
- `NT-Property-T002`: Tasks tab shows all expected table columns.
- `NT-Property-T003`: Tasks empty state or existing task rows are visible.
- `NT-Property-T004`: `Create New Task` drawer shows all required fields.
- `NT-Property-T005`: Task Type dropdown shows `To-do`, `Email`, `Call`, and `LinkedIn`.
- `NT-Property-T006`: Task Priority dropdown shows `High`, `Medium`, and `Low`.
- `NT-Property-T007`: User can create a task successfully and it appears in the table.
- `NT-Property-T008`: Cancel Create Task closes the drawer without saving.
- `NT-Property-T009`: Validation holds when Task Title is empty.
- `NT-Property-T010`: Task search filters the table by title.
- `NT-Property-T011`: Non-matching task search shows empty state.
- `NT-Property-T012`: Edit Task drawer opens with pre-filled data.
- `NT-Property-T013`: User can edit task title and save successfully.
- `NT-Property-T014`: Cancel Edit Task keeps the original task unchanged.
- `NT-Property-T015`: Task can be marked complete via checkbox.
- `NT-Property-T016`: Completed task can be unchecked and returned to pending state.
- `NT-Property-T017`: Delete Task confirmation dialog opens correctly.
- `NT-Property-T018`: Cancel Delete Task keeps the task in the table.
- `NT-Property-T019`: Confirm Delete Task removes the task from the table.

### Cross-tab coverage

- `NT-Property-X001`: Switching between Notes and Tasks tabs works correctly.
- `NT-Property-X002`: A newly created note and a newly created task both persist in the same session.

## Page Object Summary

The page object in [property-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/property-module.js) handles:

- Properties page navigation
- Table and pagination assertions
- Property search and no-result checks
- Create Property drawer workflow
- Company, source, stage, franchise, assignee, and contact selection
- Unique Omaha address generation and retry strategy
- Property detail opening and validation
- Edit Property workflow
- Notes and Tasks tab helpers
- Duplicate-address negative validation

## Recommended Execution Commands

Full Property suite:

```bash
npx playwright test tests/e2e/property-module.spec.js --project=chrome
```

Headed mode:

```bash
HEADLESS=false npx playwright test tests/e2e/property-module.spec.js --project=chrome
```

Single case example:

```bash
HEADLESS=false npx playwright test tests/e2e/property-module.spec.js --project=chrome --grep "TC-PROP-018"
```

Single reusable Notes/Tasks example:

```bash
HEADLESS=false npx playwright test tests/e2e/property-module.spec.js --project=chrome --grep "NT-Property-T007"
```

---

## Verify that Select Supervisor dropdown opens and lists supervisors/users correctly, Verify that unchecking 'Assign Supervisor' hides the Supervisor field and clears its selected value (if any).

### TC-PROP-046 | Supervisor dropdown opens with user list, uncheck hides field and clears selection

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is accessible from the Properties list page.

**Steps:**

Step 1 — Open the Supervisor dropdown and verify it lists users:
1. Navigate to `/app/sales/locations`.
2. Click the `Create Property` button to open the Create Property drawer.
3. Wait for the drawer heading "Create Property" to be visible.
4. Click the `Assign Supervisor` checkbox to check it.
5. Wait for the `Select Supervisor` trigger to appear.
6. Click the `Select Supervisor` heading (level=6) trigger to open the tooltip dropdown.
7. Observe the tooltip that opens.

**Expected results (Step 1):**
- The supervisor tooltip is visible.
- The tooltip contains a `Search` textbox.
- At least one user card (Avatar + name heading + role paragraph) is listed in the tooltip.

Step 2 — Select a supervisor, then uncheck to hide the field and clear the selection:
8. Type a known name (e.g. "Aaron") into the Search textbox inside the tooltip.
9. Wait for filtered results to appear.
10. Click the first matching user card (e.g. "Aaron Patterson").
11. Verify the Select Supervisor trigger now displays the selected name.
12. Click the `Assign Supervisor` checkbox again to uncheck it.
13. Observe the Supervisor field area.

**Expected results (Step 2):**
- After unchecking, the `Select Supervisor` heading/trigger is no longer visible in the drawer.
- The checkbox returns to unchecked state (Assign Supervisor is unchecked).

---

## Verify that Contact Details section is visible with correct contact roles (Decision Maker, End User, Billing, etc.)., Verify that each Contact role dropdown opens and lists contacts correctly., Verify that each Contact role dropdown supports search and returns matching contacts., Verify that user can select contacts for multiple roles and selections are displayed correctly., Verify that selecting the same contact in multiple roles is allowed only if permitted by business rules (handled correctly).

### TC-PROP-047 | Contact Details section visible, dropdowns open and support search, multi-role selection works, same-contact rule handled

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is accessible from the Properties list page.
- The system has at least 2 contacts in the database.

**Steps:**

Step 1 — Verify the Contact Details section and role labels:
1. Navigate to `/app/sales/locations`.
2. Click the `Create Property` button.
3. Wait for the "Create Property" drawer heading to be visible.
4. Scroll down to the Contact Details section.
5. Observe the "Contact Details" heading (level=4) and the section contents.

**Expected results (Step 1):**
- The `Contact Details` heading (level=4) is visible.
- The section contains a two-column layout with headers "Contact Title" and "Users".
- All 5 role labels are visible: `Decision Maker`, `End User`, `Billing`, `Blocker`, `Influencer`.
- Each role row has a `Select a Contact` trigger (heading level=6) with a dropdown arrow.

Step 2 — Open a Contact role dropdown and verify it lists contacts:
6. Click the `Select a Contact` trigger for the `Decision Maker` row (first row).
7. Wait for the contact tooltip to appear.
8. Observe the tooltip contents.

**Expected results (Step 2):**
- The contact tooltip is visible.
- The tooltip contains a `Search by name` textbox.
- At least one contact paragraph (formatted as `Name (email@domain.com)`) is visible in the list.
- A "Create new contact" option is visible at the top of the list.

Step 3 — Verify search filters the contact list:
9. Type a partial name (e.g. "Ali") into the `Search by name` field.
10. Wait for the results to filter.
11. Observe the filtered contact list.

**Expected results (Step 3):**
- The tooltip contact list updates to show only contacts whose name contains the search term.
- At least one matching result (containing "Ali" in the name) is visible.

Step 4 — Select contacts for multiple roles and verify selections are displayed:
12. Click a matching contact result (e.g. "Ali Eng QA") to select it for `Decision Maker`.
13. Verify the Decision Maker row now shows the selected contact name (no longer shows "Select a Contact").
14. Click the `Select a Contact` trigger for the `End User` row (second row).
15. Wait for the contact tooltip to appear.
16. Click a different contact (e.g. "Margaret Demirs") to select it for `End User`.
17. Verify the End User row now shows the selected contact name.

**Expected results (Step 4):**
- The Decision Maker row displays the selected contact name (e.g. "Ali Eng QA") instead of the placeholder.
- The End User row displays the selected contact name (e.g. "Margaret Demirs") instead of the placeholder.
- Both selections are shown simultaneously in the drawer.

Step 5 — Attempt to select the same contact for a second role and verify handling:
18. Click the `Select a Contact` trigger for the `Billing` row (third row).
19. Wait for the contact tooltip to appear.
20. Type the name of the contact already selected for Decision Maker (e.g. "Ali Eng QA") into the search.
21. Click the same contact result.
22. Observe the Billing row and any UI feedback.

**Expected results (Step 5):**
- The application either:
  (a) Allows the same contact to be selected for a second role, and the Billing row displays the same contact name, OR
  (b) Prevents the selection and shows an informational message/toast indicating the contact is already assigned to another role.
- In either case, the drawer does not crash or produce an unhandled error.
- The existing Decision Maker selection remains intact.

---

## Verify that typing in the address field triggers autocomplete suggestions, Verify that the map element appears when the address section is focused, Verify that selecting an autocomplete suggestion populates the address field and updates the map

### TC-PROP-048 | Address autocomplete triggers suggestions and map appears on focus; selecting a suggestion populates the field

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is accessible from the Properties list page.
- Google Maps API is reachable from the test environment.

**Steps:**

Step 1 — Focus the address field and verify the map appears:
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Click the address combobox (wrapper around the `Type Address` textbox).
5. Observe the drawer below the address section.

**Expected results (Step 1):**
- The `region[aria-label="Map"]` element becomes visible below the address input.

Step 2 — Type a partial address and verify autocomplete suggestions appear:
6. Type `123 Main St` into the `Type Address` textbox (`id="googleAddress"`).
7. Wait for the autocomplete listbox to appear.

**Expected results (Step 2):**
- The combobox `aria-expanded` attribute becomes `true`.
- A listbox (`role="listbox"`) is visible below the input.
- At least one option (`role="option"`) is visible in the listbox.
- Each suggestion contains the typed text or a related address string.

Step 3 — Select a suggestion and verify the address field is populated:
8. Click the first autocomplete option in the listbox.
9. Observe the address input value and the listbox state.

**Expected results (Step 3):**
- The address textbox value is populated with the selected address string (non-empty).
- The autocomplete listbox is no longer visible (collapsed after selection).
- The map region remains visible and reflects the selected location.

---

## Verify that autocomplete suggestions can be navigated with keyboard arrow keys, Verify that pressing Enter on a highlighted suggestion selects it

### TC-PROP-049 | Keyboard navigation through autocomplete suggestions works and Enter selects the highlighted option

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**

Step 1 — Open autocomplete and navigate with arrow keys:
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Click the `Type Address` textbox to focus it.
5. Type `123 Main` to trigger autocomplete suggestions.
6. Wait for the listbox with at least one option to appear.
7. Press the `ArrowDown` key once.
8. Observe which option receives focus/highlight.

**Expected results (Step 1):**
- The listbox is open with at least two options visible.
- After pressing `ArrowDown`, the first option in the list is highlighted (aria-selected or visually focused).

Step 2 — Press Enter to confirm selection:
9. Press `Enter`.
10. Observe the address input value and listbox state.

**Expected results (Step 2):**
- The address textbox is populated with the text of the highlighted suggestion (non-empty string).
- The autocomplete listbox closes after selection.

---

## Verify that pressing Escape while the autocomplete dropdown is open closes the dropdown without selecting a suggestion

### TC-PROP-050 | Pressing Escape while autocomplete is open closes the dropdown without selecting

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Type `456 Oak` into the `Type Address` textbox.
5. Wait for the autocomplete listbox to appear.
6. Press `Escape`.
7. Observe the listbox state and the address input value.

**Expected results:**
- The autocomplete listbox is no longer visible after pressing Escape.
- The address textbox still contains the typed text `456 Oak` (partial input is preserved, not cleared).
- The Create Property drawer itself remains open.

---

## Verify that the Create Property drawer can be scrolled to reveal all form sections below the fold (Property Affiliation, Assignee, Contact Details, Address)

### TC-PROP-051 | Drawer is scrollable and all form sections are reachable by scrolling

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Without scrolling, observe which sections are visible.
5. Scroll the drawer container (`.MuiDrawer-paperAnchorRight`) to the bottom using JavaScript `scrollTop = scrollHeight`.
6. Wait briefly for layout to settle.
7. Observe the sections visible at the bottom of the drawer.

**Expected results:**
- Before scrolling: Company, Property Name, Property Source, Associated Franchise, and Stage sections are visible near the top.
- After scrolling: The `Property Affiliation` heading (level=5), `Select Assignee` trigger, `Assign Supervisor` checkbox, `Contact Details` heading (level=4), `Address` heading (level=5), and the `Create Property` submit button are all visible.

---

## Verify that pressing the Escape key while the Create Property drawer is open (and no dropdown is active) closes the drawer

### TC-PROP-052 | Pressing Escape with no active dropdown closes the Create Property drawer

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.
- No tooltip or dropdown is currently open inside the drawer.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Confirm no tooltip is open (snapshot confirms no `tooltip` role element present).
5. Press `Escape`.
6. Observe whether the drawer is still present.

**Expected results:**
- The "Create Property" heading (level=3) is no longer visible.
- The drawer panel (`.MuiDrawer-paperAnchorRight`) is hidden or removed from the DOM.

---

## Verify that clicking the modal backdrop (outside the Create Property drawer) closes the drawer

### TC-PROP-053 | Clicking the backdrop outside the drawer closes it

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Locate the `.MuiBackdrop-root.MuiModal-backdrop` overlay element (semi-transparent area to the left of the drawer).
5. Click the backdrop.
6. Observe whether the drawer closes.

**Expected results:**
- The "Create Property" heading (level=3) is no longer visible after the backdrop click.
- The user is returned to the Properties list page with the drawer closed.

---

## Verify that selecting 'Referral' as the Property Source reveals the Referred By section with Property and Contact dropdowns

### TC-PROP-054 | Selecting Referral as Property Source reveals the Referred By section

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**

Step 1 — Confirm Referred By is absent before any source is selected:
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Observe whether a `Referred By` heading (level=4) is present in the drawer.

**Expected results (Step 1):**
- The `Referred By` heading is NOT visible.

Step 2 — Select Referral and verify the section appears:
5. Click the `Add Property Source` heading (level=6) trigger to open the source tooltip.
6. Wait for the tooltip to appear.
7. Click the `Referral` paragraph option.
8. Observe the drawer below the Assignee section.

**Expected results (Step 2):**
- The Property Source trigger now shows `Referral` as the selected value.
- The `Referred By` heading (level=4) is now visible.
- A `Select Property / Property Name` heading (level=6) trigger is visible inside the Referred By section.
- A `Contact` heading (level=6) trigger is visible inside the Referred By section.

---

## Verify that selecting a non-Referral Property Source does not show the Referred By section, Verify that switching from Referral to another source hides the Referred By section

### TC-PROP-055 | Non-Referral source hides Referred By; switching from Referral to another source also hides it

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**

Step 1 — Select a non-Referral source and verify Referred By is absent:
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Click the `Add Property Source` trigger.
5. Click `ALN` in the tooltip.
6. Observe the drawer for the `Referred By` heading.

**Expected results (Step 1):**
- The `Referred By` heading (level=4) is NOT visible when ALN is selected.

Step 2 — Switch to Referral then back to ALN:
7. Click the Property Source trigger (now showing "ALN").
8. Click `Referral` in the tooltip.
9. Verify `Referred By` heading becomes visible.
10. Click the Property Source trigger again (showing "Referral").
11. Click `ALN` in the tooltip.
12. Observe the drawer for the `Referred By` heading.

**Expected results (Step 2):**
- After switching to Referral: `Referred By` heading is visible.
- After switching back to ALN: `Referred By` heading is no longer visible.

---

## Verify that the Referred By Property dropdown opens and lists properties, Verify that the Referred By Property dropdown supports search and returns matching results, Verify that selecting a property in the Referred By dropdown displays the selection

### TC-PROP-056 | Referred By Property dropdown opens, supports search, and displays the selected property

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open and `Referral` is selected as the Property Source.
- The system has at least one property in the database.

**Steps:**

Step 1 — Open the Referred By Property dropdown and verify it lists properties:
1. Navigate to `/app/sales/locations`.
2. Click `Create Property`, wait for the drawer heading.
3. Open the Property Source tooltip and click `Referral`.
4. Wait for the `Referred By` section to appear.
5. Click the `Select Property / Property Name` heading (level=6) trigger inside the Referred By section.
6. Wait for the property tooltip to open.

**Expected results (Step 1):**
- The tooltip is visible with a `Search` textbox.
- At least one property name paragraph is listed in the tooltip.

Step 2 — Search and verify filtered results:
7. Type a partial property name (e.g. `Apple`) into the Search textbox inside the tooltip.
8. Wait for the filtered list.

**Expected results (Step 2):**
- The list updates to show only properties matching the search term.
- At least one result matching `Apple` is visible.

Step 3 — Select a property and verify it appears in the trigger:
9. Click the first matching property paragraph.
10. Observe the `Select Property / Property Name` trigger.

**Expected results (Step 3):**
- The trigger no longer shows the placeholder text; it now displays the selected property name.

---

## Verify that the Referred By Contact dropdown opens and lists contacts, Verify that the Referred By Contact dropdown supports search and returns matching results, Verify that selecting a contact in the Referred By dropdown displays the selection

### TC-PROP-057 | Referred By Contact dropdown opens, supports search, and displays the selected contact

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open and `Referral` is selected as the Property Source.
- The system has at least one contact in the database.

**Steps:**

Step 1 — Open the Referred By Contact dropdown and verify it lists contacts:
1. Navigate to `/app/sales/locations`.
2. Click `Create Property`, wait for the drawer heading.
3. Open the Property Source tooltip and click `Referral`.
4. Wait for the `Referred By` section to appear.
5. Click the `Contact` heading (level=6) trigger inside the Referred By section.
6. Wait for the contact tooltip to open.

**Expected results (Step 1):**
- The tooltip is visible.
- A search textbox is present inside the tooltip.
- At least one contact entry is listed.

Step 2 — Search and select a contact:
7. Type a partial name (e.g. `Aaron`) into the search field inside the tooltip.
8. Wait for filtered results.
9. Click the first matching contact.
10. Observe the `Contact` trigger in the Referred By section.

**Expected results (Step 2):**
- The contact list filters to show matching results.
- After selection, the `Contact` trigger displays the selected contact's name instead of the placeholder.

---

## Verify that submitting the Create Property form with all required fields empty shows validation errors and the drawer remains open; Verify that the modal retains user input when a validation error occurs on submission

### TC-PROP-058 | Submitting form with missing required fields shows validation errors, drawer stays open, and pre-filled values are retained

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Type a distinctive value (e.g. `TC-058-RETAIN-<timestamp>`) into the Property Name field.
4. Without filling Address or other required fields, click the `Create Property` submit button.
5. Observe the drawer state and any validation feedback.
6. Verify the Property Name field still contains the value entered in step 3.

**Expected results:**
- The drawer remains open (the "Create Property" heading is still visible).
- At least one required-field error message is visible in the drawer (e.g. `Address is required.` text).
- No success toast appears.
- The Property Name field retains the value entered before the failed submit (user input is preserved).

---

## Verify that long dropdown values (company/property/address) truncate or wrap without UI break., Verify that keyboard navigation (Tab/Shift+Tab) moves focus through fields in a logical order., Verify that changing the Referred By Property refreshes the Referred By Contact list accordingly., Verify that clearing the Referred By Property clears the Referred By Contact selection (if any)., Verify that required-field validation messages are cleared once the user enters valid values., Verify that previously entered values remain intact when user opens/closes dropdowns repeatedly., Verify that the modal backdrop prevents interaction with the background page while modal is open., Verify that the modal handles slow loading of dropdown data by showing a loader/state (if applicable).

### TC-PROP-059 | Long dropdown values truncate or wrap without UI break

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is accessible from the Properties list page.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Open the Property Source dropdown (click the `Add Property Source` trigger).
5. Click `Inbound Lead - National` (the longest source option) to select it.
6. Observe the Property Source trigger row — verify the text fits within its container without overlapping adjacent elements.
7. Open the Associated Franchise dropdown, search for a franchise with a long name (e.g. `9001- Collin Franchise, NE`), select it.
8. Observe the Associated Franchise trigger row — verify the text is contained within the drawer without horizontal overflow.
9. Open the Company dropdown, type a partial name with many characters (e.g. `Regression Phase`) to search, observe the result list items for any layout overflow.
10. Verify the drawer panel itself has no horizontal scrollbar and no elements protrude outside its bounds.

**Expected results:**
- The Property Source trigger displays the selected long value (`Inbound Lead - National`) clipped or truncated within its row — the drawer does not break or scroll horizontally.
- The Associated Franchise trigger displays the long franchise name within its bounded row — no overflow outside the 796px drawer panel.
- The Company search result items are contained within the tooltip without breaking the layout.
- No horizontal scrollbar appears on the drawer panel.

---

### TC-PROP-060 | Keyboard Tab/Shift+Tab navigation moves focus through fields in logical order

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Click the `Property / Property Name` text input to place focus on it.
5. Press `Tab` once — observe which element receives focus next.
6. Press `Tab` again — observe the next focused element.
7. Press `Tab` again — observe the next focused element.
8. Press `Shift+Tab` once — observe that focus moves back to the previous element.
9. Observe that focus never jumps outside the drawer to the background page while the drawer is open.

**Expected results:**
- After step 5: Focus moves from the Property Name input forward to the next logical field (Assign Supervisor checkbox or Address input).
- After step 6: Focus continues forward in a logical top-to-bottom order.
- After step 7: Focus continues to the next field (Cancel or Create Property button).
- After Shift+Tab (step 8): Focus returns to the previous element in the sequence.
- Focus never leaves the drawer and lands on a background element (focus is trapped within the drawer while open).

---

### TC-PROP-061 | Changing the Referred By Property refreshes the Referred By Contact list

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.
- `Referral` is selected as Property Source (so the Referred By section is visible).
- The system has at least two distinct properties with associated contacts.

**Steps:**

Step 1 — Select an initial Referred By Property and then select a Contact:
1. Navigate to `/app/sales/locations`.
2. Click `Create Property`, wait for the drawer heading.
3. Open the Property Source dropdown and click `Referral`.
4. Wait for the `Referred By` section (heading level=4) to appear.
5. Open the Referred By Property dropdown (click the `Select Property / Property Name` h6 trigger).
6. Wait for the tooltip to open with a Search textbox and at least one property result.
7. Click the first available property result to select it.
8. Verify the Property trigger no longer shows the placeholder text.
9. Open the Referred By Contact dropdown (dispatch click on the Contact h6 trigger's parent).
10. Wait for the contact tooltip to open.
11. Click the first available contact result to select it.
12. Verify the Contact trigger no longer shows "Contact" as placeholder.

**Expected results (Step 1):**
- A property is selected and displayed in the Property trigger.
- A contact is selected and displayed in the Contact trigger.

Step 2 — Change the Referred By Property and verify Contact list refreshes:
13. Open the Referred By Property dropdown again.
14. Type a different search term (e.g. `Hamza`) to find a different property.
15. Select the different property from the results.
16. Observe the Referred By Contact trigger immediately after the property change.

**Expected results (Step 2):**
- The Referred By Property trigger now displays the newly selected property.
- The Referred By Contact trigger either resets to its placeholder state (`Contact`) OR shows contacts associated with the new property — in either case the previous contact selection from the first property is no longer shown (the list has refreshed).

---

### TC-PROP-062 | Clearing the Referred By Property clears the Referred By Contact selection

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.
- `Referral` is selected as Property Source.
- A Referred By Property has already been selected and a Referred By Contact has been selected.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property`, wait for the drawer heading.
3. Open the Property Source dropdown and click `Referral`.
4. Wait for the `Referred By` section (heading level=4) to appear.
5. Open the Referred By Property dropdown and select any property result.
6. Verify the Property trigger shows the selected property name.
7. Open the Referred By Contact dropdown and select any contact result.
8. Verify the Contact trigger shows the selected contact name (not the placeholder "Contact").
9. Now change the Property Source away from Referral — click the Property Source trigger (showing "Referral") and select `ALN`.
10. Verify the `Referred By` section (heading level=4) is no longer visible.
11. Now switch back to `Referral` — open the Property Source dropdown and click `Referral`.
12. Wait for the `Referred By` section to reappear.
13. Observe the Referred By Property trigger and the Referred By Contact trigger.

**Expected results:**
- After switching away from Referral and back: the Referred By Property trigger shows the placeholder `Select Property / Property Name` (previous selection cleared).
- The Referred By Contact trigger shows the placeholder `Contact` (previous selection cleared — not the previously chosen contact).

---

### TC-PROP-063 | Required-field validation messages are cleared once the user enters valid values

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.
- No fields have been filled.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Without filling any field, click the `Create Property` submit button.
5. Wait for at least one validation error message to appear in the drawer (e.g. `Address is required.`).
6. Verify the validation errors are visible.
7. Fill the `Property / Property Name` textbox with a valid value (e.g. `Test Property 123`).
8. Type a valid address into the `Type Address` field (e.g. `123 Main St, Omaha`) and wait for autocomplete.
9. Select the first autocomplete suggestion to populate the address field.
10. Observe the `Address is required.` error message.

**Expected results:**
- After step 5: At least one `is required` error message is visible inside the drawer.
- After step 9: The address-required error message is no longer visible (cleared once the address field has a valid value).
- The drawer remains open throughout.
- No "Address is required." text is visible once a valid address is selected.

---

### TC-PROP-064 | Previously entered values remain intact when user opens/closes dropdowns repeatedly

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Fill the `Property / Property Name` textbox with `Persist-Test-Value`.
5. Open the Property Source dropdown and select `ALN`.
6. Verify the Property Name input still shows `Persist-Test-Value` after the dropdown closed.
7. Open the Property Source dropdown a second time and close it with `Escape` (without selecting anything).
8. Verify the Property Name input still shows `Persist-Test-Value`.
9. Verify the Property Source trigger still shows `ALN` (the previously selected value is unchanged).
10. Open the Associated Franchise dropdown and close it with `Escape` (without selecting anything).
11. Verify the Property Name input still shows `Persist-Test-Value`.
12. Verify the Property Source trigger still shows `ALN`.

**Expected results:**
- After each dropdown open/close cycle, the Property Name text field retains `Persist-Test-Value`.
- The Property Source selection (`ALN`) is retained after opening and closing the franchise dropdown.
- No previously entered or selected value is wiped by opening or closing a different dropdown.

---

### TC-PROP-065 | Modal backdrop prevents interaction with the background page while modal is open

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Verify the `.MuiBackdrop-root.MuiModal-backdrop` overlay element is present and covers the background.
5. Attempt to click the Properties list table (a background element behind the backdrop) using `{ force: false }` (normal pointer interaction).
6. Observe whether the click is intercepted by the backdrop.

**Expected results:**
- The `.MuiBackdrop-root.MuiModal-backdrop` element is visible in the DOM and covers the background content.
- The background table is not interactable while the backdrop is present — Playwright confirms the element is covered by the backdrop (`element is outside of the viewport` or intercept error confirms backdrop is blocking).
- The drawer remains open after the attempted background click.
- The "Create Property" heading is still visible.

---

### TC-PROP-066 | Modal handles slow loading of dropdown data by showing a loader/state (if applicable)

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Click the `Search Company` trigger to open the company dropdown.
5. Observe the tooltip immediately after it opens — before any search is typed.
6. Note whether a loading spinner, skeleton, or "Loading..." text appears while the initial list loads.
7. Close the tooltip (press `Escape`).
8. Click the `Select Assignee` trigger to open the assignee dropdown.
9. Observe the tooltip immediately after it opens for any loader state.
10. Note the result.

**Expected results:**
- NOTE: This test may not be verifiable in UAT because the dropdown data loads instantly over a fast connection. If no loader state is observed, the test is marked `test.fail()` with a TODO indicating the feature is untestable in this environment.
- If a loader IS observed: a spinner element (e.g. `[role="progressbar"]` or `.MuiCircularProgress-root`) is visible briefly inside the tooltip before results appear.
- In either case, the drawer does not crash and both dropdowns eventually display results.

---

## Verify that Properties dashboard loads successfully with correct total counts, Verify that Properties by Stage chart displays correct stage-wise distribution, Verify that Qualified Properties graph renders correctly

### TC-PROP-067 | Dashboard cards load with correct totals, stage chart renders, qualified properties graph visible

**Preconditions:**
- User is logged in as HO (Home Officer).
- Properties list page is accessible at `/app/sales/locations`.

**Steps:**

Step 1 — Verify dashboard total count card:
1. Navigate to `/app/sales/locations`.
2. Wait for the page to load (URL contains `/app/sales/locations`).
3. Observe the "Properties" card in the top dashboard area.

**Expected results (Step 1):**
- The heading "Properties" (level=6) is visible.
- A level=1 heading displaying the total count (e.g. `13.54k`) is visible directly below it.
- The pie chart legend below the total shows at least one affiliation label such as `Existing •`, `New •`, `Old •`, or `Lost •` with numeric values.

Step 2 — Verify Properties by Stage chart:
4. Observe the "Properties by Stage" card in the dashboard row.

**Expected results (Step 2):**
- The heading "Properties by Stage" (level=6) is visible.
- A level=1 heading showing the total stage count (e.g. `13.54k`) is visible.
- The chart legend contains at least one stage entry such as `Approved •` with a numeric count.

Step 3 — Verify Qualified Properties graph:
5. Observe the "Qualified Properties" card in the dashboard row.

**Expected results (Step 3):**
- The heading "Qualified Properties" (level=6) is visible.
- The graph image/canvas element is visible inside the card.
- The graph contains at least one month label on the x-axis (e.g. `May' 25` or similar).

---

## Verify that property list loads with default All Affiliation filter applied, Verify that user can search property by name, ID, zip code, Verify that Approved and Rejected stage filter works correctly, Verify that All Properties dropdown filters Assigned and Unassigned properties, Verify that sorting works on Property Name column, Verify that Property Affiliation tags are displayed correctly, Verify that user can select single property using checkbox, Verify that user can select multiple properties, Verify that Bulk Assignment button becomes enabled after selection, Verify that Bulk Assignment assigns properties successfully, Verify that Review Leads button opens review leads modal, Verify that Property Stage badges display correct status, Verify that Assigned To column shows correct user, Verify that Franchise column shows correct value, Verify that Created Date and Last Modified Date are displayed correctly

### TC-PROP-068 | Property list loads with All Affiliation default, search works, stage filter and assignment dropdown function, sorting works, affiliation tags visible, checkbox selection enables Bulk Assignment, Review Leads opens modal, table columns show correct values

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Properties list page has existing properties with at least one `Approved` stage record.
- At least two properties exist in the system.

**Steps:**

Step 1 — Verify list loads with All Affiliation default filter:
1. Navigate to `/app/sales/locations`.
2. Wait for the table to render (at least one data row is visible).
3. Observe the filter toolbar above the table.

**Expected results (Step 1):**
- The "All Affiliation" heading (level=6) trigger is visible in the toolbar — confirming the default filter is active.
- The table contains at least one property row.
- The pagination text matches the format `\d+–\d+ of \d+` (e.g. `1–10 of 13544`).

Step 2 — Verify search by property name:
4. Type a known property name (e.g. `PAT 5199`) into the search input (`ID, Property, Zip Code / Postal Code`).
5. Wait for the table to update.
6. Observe the search results.

**Expected results (Step 2):**
- The table updates to show only rows matching the search term.
- At least one row with the searched property name is visible.
- Clear the search field after verification.

Step 3 — Verify Approved/Rejected filter options and apply the Approved filter:
7. Click the "All Affiliation" heading (level=6) trigger to open its tooltip.
8. Observe the available options in the tooltip.
9. Click the "Approved" option to apply it.
10. Wait for the table to update.

**Expected results (Step 3):**
- The tooltip is visible and contains `Approved` and `Rejected` options.
- After clicking `Approved`, the table updates to show the filtered results.
- Navigate back to the full list before proceeding.

Step 4 — Verify All Properties dropdown (Assigned/Unassigned):
11. Click the "All Properties" heading (level=6) trigger to open its tooltip.
12. Observe the available options.

**Expected results (Step 4):**
- The tooltip is visible.
- The tooltip contains a paragraph `All Properties`.
- The tooltip contains a paragraph `Assigned`.
- The tooltip contains a paragraph `Unassigned`.
- Close the tooltip by pressing Escape.

Step 5 — Verify Property Name column sorting (ascending order):
13. Click the "Property Name" sort button (column header button) once.
14. Wait for the table to re-render.
15. Read the first and second rows' Property Name values.

**Expected results (Step 5):**
- The table re-renders after the sort click.
- At least one row is still visible.
- The first row's Property Name value is alphabetically ≤ the second row's value (ascending order).

Step 6 — Verify Property Affiliation tags:
13. Observe the "Property Affiliation" column in the first visible data row.

**Expected results (Step 6):**
- The Property Affiliation cell contains at least one tag element (a styled badge or chip, e.g. `Managed`, `Shared`, `Owned`, `Tenant`, `Headquarters`, or `Regional Office`).
- Tags are visible and not empty.

Step 7 — Verify single checkbox selection enables Bulk Assignment:
14. Click the checkbox cell of the first data row to select it.
15. Observe the toolbar buttons.

**Expected results (Step 7):**
- The "Bulk Assignment" button becomes enabled (no longer disabled).
- A count message appears (e.g. `1 property selected.`).

Step 8 — Verify multiple property selection:
16. Click the checkbox cell of the second data row.
17. Observe the selection count.

**Expected results (Step 8):**
- The selection count message updates (e.g. `2 properties selected.`).
- The "Bulk Assignment" button remains enabled.

Step 9 — Verify Bulk Assignment dialog opens:
18. Click the "Bulk Assignment" button.
19. Wait for a dialog or modal to appear.

**Expected results (Step 9):**
- A dialog or overlay opens with a prompt "Select people to assign" (or equivalent).
- Close the dialog by pressing Escape or clicking Cancel.

Step 10 — Verify Review Leads button opens the review leads page:
20. Navigate to `/app/sales/locations`.
21. Click the "Review Leads" button (labeled `Review Leads (N)` where N is the lead count).
22. Wait for navigation.

**Expected results (Step 10):**
- The URL changes to contain `/app/sales/locations/reviews`.
- The review leads page is visible (e.g. a "New Leads Request" tab button is present).
- Navigate back to `/app/sales/locations`.

Step 11 — Verify Stage badge, Assigned To, Franchise, Created Date, Last Modified Date columns:
23. Navigate to `/app/sales/locations` and wait for the table to load.
24. Observe the first visible data row's Stage, Assigned To, Franchise, Created Date, and Last Modified Date cells.

**Expected results (Step 11):**
- The Stage cell (column index 10) contains a non-empty badge text (e.g. `Approved`, `Current Customer`, etc.).
- The `Assigned To` column header is visible in the table.
- The `Franchise` column header is visible in the table.
- The Created Date cell (column index 14) contains text matching the format `MM/DD/YYYY`.
- The Last Modified Date cell (column index 15) contains text matching the format `MM/DD/YYYY`.

---

## Verify that More Filters panel opens successfully, Verify that Property Type filter works correctly, Verify that Stage filter work correctly, Verify that Property Source filter works correctly, Verify that Country, State, City filters work correctly, Verify that Zip Code filter accepts valid values, Verify that Parent Company filter works correctly, Verify that Property ID filter works correctly, Verify that Associated Franchise filter works correctly, Verify that Assigned To filter works correctly, Verify that No. of Units filter works correctly, Verify that Lot Number filter works correctly, Verify that Created Date filter works correctly, Verify that Last Modified Date filter works correctly, Verify that Clear All resets all applied filters, Verify that Apply Filters updates property listing correctly

### TC-PROP-069 | More Filters panel opens with all filter controls; each filter control is interactive; Clear All resets filters; Apply Filters updates listing

**Preconditions:**
- User is logged in as HO (Home Officer).
- Properties list page is accessible at `/app/sales/locations`.
- The More Filters panel is accessible via the "More Filters" button in the toolbar.

**Steps:**

Step 1 — Verify More Filters panel opens with all expected controls:
1. Navigate to `/app/sales/locations`.
2. Click the "More Filters" button in the toolbar.
3. Wait for the "All Filters" heading (level=3) to become visible.
4. Observe all filter controls in the panel.

**Expected results (Step 1):**
- The "All Filters" heading (level=3) is visible.
- The following filter trigger labels are visible: "Select Property Type", "Select Stages", "Select Property Source", "Select states", "Select Company Associated", "Select Parent Company", "Add Associated Franchise", "Select Assigned to".
- The following input controls are visible: Zip Code combobox (`Add Zip Code / Postal Code and press enter`), Property ID textbox (`Add ID`), Lot Number textbox, two date range inputs (`MM/DD/YYYY - MM/DD/YYYY`).
- The "No. of Units" button is visible.
- The "Clear All" button is visible.
- The "Apply Filters" button is visible (disabled initially when no filter is set).

Step 2 — Verify Property Type filter opens:
5. Click the "Select Property Type" trigger (heading level=6).
6. Observe the tooltip that opens.

**Expected results (Step 2):**
- A tooltip becomes visible with at least one selectable Property Type option.
- Close the tooltip by pressing Escape.

Step 3 — Verify Stage filter opens:
7. Click the "Select Stages" trigger (heading level=6).
8. Observe the tooltip.

**Expected results (Step 3):**
- A tooltip becomes visible with at least one stage option (e.g. `Approved`, `Discovery`, etc.).
- Select one stage option (e.g. click `Approved`).
- Close the tooltip by pressing Escape.

Step 4 — Verify Property Source filter opens:
9. Click the "Select Property Source" trigger (heading level=6).
10. Observe the tooltip.

**Expected results (Step 4):**
- A tooltip becomes visible with at least one property source option.
- Close the tooltip by pressing Escape.

Step 5 — Verify State filter opens:
11. Click the "Select states" trigger (heading level=6).
12. Observe the tooltip.

**Expected results (Step 5):**
- A tooltip becomes visible with at least one state option.
- Close the tooltip by pressing Escape.

Step 6 — Verify Zip Code filter accepts input:
13. Click the Zip Code combobox (`Add Zip Code / Postal Code and press enter`).
14. Type `68135` into the Zip Code field.
15. Press Enter.

**Expected results (Step 6):**
- The Zip Code field accepts the input `68135`.
- After pressing Enter, a chip or tag appears representing the entered zip code.

Step 7 — Verify Parent Company filter opens:
16. Click the "Select Parent Company" trigger (heading level=6).
17. Observe the tooltip.

**Expected results (Step 7):**
- A tooltip becomes visible.
- The tooltip contains a search field or a list of company options.
- Close the tooltip by pressing Escape.

Step 8 — Verify Property ID filter accepts input:
18. Click the Property ID textbox (`Add ID`).
19. Type `1234`.

**Expected results (Step 8):**
- The textbox accepts the numeric input.
- The value `1234` is visible in the field.
- Clear the field after verification.

Step 9 — Verify Associated Franchise filter opens:
20. Click the "Add Associated Franchise" trigger (heading level=6).
21. Observe the tooltip.

**Expected results (Step 9):**
- A tooltip becomes visible with at least one franchise option or a search field.
- Close the tooltip by pressing Escape.

Step 10 — Verify Assigned To filter opens:
22. Click the "Select Assigned to" trigger (heading level=6).
23. Observe the tooltip.

**Expected results (Step 10):**
- A tooltip becomes visible with at least one user option or a search field.
- Close the tooltip by pressing Escape.

Step 11 — Verify No. of Units filter expands:
24. Click the "No. of Units" button.
25. Observe the filter area for No. of Units.

**Expected results (Step 11):**
- The No. of Units filter expands to show a range input (min and max fields or a slider).
- At least one numeric input is visible.

Step 12 — Verify Lot Number filter accepts input:
26. Click the Lot Number textbox.
27. Type `A-101`.

**Expected results (Step 12):**
- The Lot Number textbox accepts the input.
- The value `A-101` is visible in the field.
- Clear the field after verification.

Step 13 — Verify Created Date filter accepts date range input:
28. Click the first date range textbox (Created Date, labeled `MM/DD/YYYY - MM/DD/YYYY`).
29. Type `04/01/2026 - 04/30/2026`.

**Expected results (Step 13):**
- The date range textbox accepts the input.
- The entered value is visible in the field.

Step 14 — Verify Last Modified Date filter accepts date range input:
30. Click the second date range textbox (Last Modified Date, labeled `MM/DD/YYYY - MM/DD/YYYY`).
31. Type `04/01/2026 - 04/30/2026`.

**Expected results (Step 14):**
- The Last Modified Date textbox accepts the input.
- The entered value is visible in the field.

Step 15 — Verify Apply Filters becomes enabled and updates listing:
32. Observe the "Apply Filters" button state (it should be enabled after step 3 selected a stage).
33. Click "Apply Filters".
34. Wait for the filter panel to close and the table to update.

**Expected results (Step 15):**
- The "Apply Filters" button is enabled after at least one filter value is set.
- After clicking Apply Filters, the More Filters panel closes.
- The table updates and shows a valid pagination count.
- The filtered result count is ≥ 0 and ≤ the unfiltered total count captured before applying filters.

Step 16 — Verify Clear All resets filters:
35. Click the "More Filters" button to reopen the panel.
36. Wait for the "All Filters" heading (level=3) to be visible.
37. Click the "Clear All" button (it should now be enabled since filters were applied).
38. Observe all filter fields after clearing.

**Expected results (Step 16):**
- After clicking Clear All, all filter fields are reset to their empty/default state.
- The "Apply Filters" button becomes disabled.
- The "Clear All" button becomes disabled.

---

## Activity Log entries in property detail — TC-PROP-070 through TC-PROP-103

These test cases cover the Activities tab of a property detail page. The Activities tab aggregates log entries created from the Emails, Notes, Meetings, Calls, and Tasks tabs. Each log entry card shows a title (including the creator/sender username), a timestamp, a body preview, and See more / See less controls for long content.

**Test property used:** `Regression Location Phase 2` (ID 13179) at `/app/sales/locations/location/13179`. This property has existing email data and is accessible to HO users.

**Preconditions for all tests in this group:**
- User is logged in as HO (Home Officer) — username `Moiz`.
- The property `Regression Location Phase 2` is accessible and its Activities tab loads.

---

## Verify that email log title uses sender username

### TC-PROP-070 | Email log title displays sender username in Activities tab

**Preconditions:**
- User is logged in as HO.
- Property `Regression Location Phase 2` (ID 13179) has at least one email logged.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Wait for the tabpanel to load (at least one activity card is visible).
4. Locate the email log card (a card whose title contains "Email" and "by").
5. Read the title text of the first email log card.

**Expected results:**
- The Activities tab is active (`aria-selected="true"`).
- At least one activity log card is visible in the panel.
- The email log card title contains the phrase "by" followed by the sender's username (e.g. "Email logged by Moiz").
- The username portion is rendered inside a `span` element within the title paragraph.

---

## Verify that email subject matches email creation form

### TC-PROP-071 | Email log in Activities shows the same subject as entered in the New Email form

**Preconditions:**
- User is logged in as HO.
- Property `Regression Location Phase 2` (ID 13179) is open.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Emails` tab.
3. Note the subject of the first email in the list (e.g. "Bug Report").
4. Click the `Activities` tab.
5. Wait for activity cards to load.
6. Find the email log card whose body or title corresponds to the email noted in step 3.

**Expected results:**
- The email log card in the Activities tab shows the same subject text as the email in the Emails tab.
- The subject is visible in the card title or body text area.

---

## Verify that email HTML formatting: bold/italic/underline

### TC-PROP-072 | Email log body renders bold, italic, and underline HTML formatting

**Preconditions:**
- An email with bold, italic, and underlined text exists in the property.
- Property detail Activities tab is accessible.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Locate an email log card.
4. If the card shows "See more", click "See more" to expand.
5. Inspect the expanded body text area for `<strong>`, `<em>`, and `<u>` elements or equivalent styled spans.

**Expected results:**
- The body text area renders bold text with visible weight difference (or `<strong>` in DOM).
- The body text area renders italic text with visible slant (or `<em>` in DOM).
- The body text area renders underlined text (or `<u>` in DOM).
- NOTE: If no email with rich formatting exists, this test is marked `test.fail()` with a TODO pending test data creation.

---

## Verify that email HTML formatting: lists

### TC-PROP-073 | Email log body renders ordered and unordered list formatting

**Preconditions:**
- An email with list formatting (bullet points or numbered list) exists in the property.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Locate an email log card and expand it if truncated.
4. Inspect the body text area for `<ul>`, `<ol>`, `<li>` elements.

**Expected results:**
- List elements (`<ul>` or `<ol>`) are rendered within the email body.
- Individual list items (`<li>`) are visible.
- NOTE: If no email with list formatting exists, this test is marked `test.fail()` with a TODO.

---

## Verify that email HTML formatting: links

### TC-PROP-074 | Email log body renders hyperlinks as clickable anchors

**Preconditions:**
- An email containing a hyperlink in its body exists in the property.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Locate an email log card and expand it if truncated.
4. Inspect the body for an `<a href>` anchor element.
5. Verify the anchor is rendered with visible link styling (underline or color).

**Expected results:**
- At least one `<a>` element is rendered inside the email body.
- The `href` attribute is non-empty.
- The link text is visible and distinguishable from plain body text.
- NOTE: If no email with link formatting exists, this test is marked `test.fail()` with a TODO.

---

## Verify that email long body truncation threshold

### TC-PROP-075 | Email log body is truncated with "See more" when content exceeds threshold

**Preconditions:**
- An email with a body longer than the truncation threshold exists in the property (the existing "SET Regression" email has a multi-line body).

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Locate an email log card whose body ends with `...` (truncated).
4. Observe the "See more" toggle below the truncated body.

**Expected results:**
- The body text ends with an ellipsis (`...`) or is visibly cut off.
- A "See more" button/text is visible below the truncated body.
- The "See more" toggle is clickable.

---

## Verify that email See more expands without losing formatting

### TC-PROP-076 | Clicking See more on email log expands full body and preserves HTML formatting

**Preconditions:**
- A truncated email log card exists in Activities.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find an email log card with a "See more" toggle.
4. Click "See more".
5. Observe the expanded body text.

**Expected results:**
- The body expands to show the full content.
- The "See more" text changes to "See less".
- Any HTML formatting in the body (bold, italic, links, lists) is still rendered correctly after expansion.
- No plain-text dump or escaped HTML tags are visible.

---

## Verify that email See less returns to original scroll position

### TC-PROP-077 | Clicking See less on email log collapses body and restores scroll position

**Preconditions:**
- An email log card has been expanded ("See less" is visible).

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find a truncated email card and click "See more" to expand.
4. Note the scroll position of the page before clicking "See less".
5. Click "See less".
6. Observe the card and scroll position.

**Expected results:**
- The body collapses back to the truncated preview.
- The "See less" text changes back to "See more".
- The scroll position returns approximately to where it was before expansion (the card is still in view).

---

## Verify that email timestamp displays and is correct

### TC-PROP-078 | Email log card shows a correctly formatted timestamp

**Preconditions:**
- An email log card exists in the Activities tab.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Locate an email log card.
4. Read the timestamp text below the card title.

**Expected results:**
- A timestamp is visible on the card.
- The timestamp matches the format `MM/DD/YYYY HH:MM AM/PM` (e.g. `04/27/2026 08:28 AM`) OR a human-readable date-time string.
- The timestamp is not empty, "N/A", or "Invalid Date".

---

## Verify that email log ordering relative to other logs

### TC-PROP-079 | Email log entries appear in reverse-chronological order in Activities

**Preconditions:**
- The Activities tab has multiple log entries of any type (email, note, task, etc.).

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Read the timestamps of the first two visible log cards.

**Expected results:**
- The first card (topmost) has a timestamp that is equal to or more recent than the second card.
- Log entries are ordered newest-first (reverse chronological).
- Date group headings (e.g. "March, 2026") reflect the correct time period of the entries beneath them.

---

## Verify that note log title uses creator username

### TC-PROP-080 | Note log card title in Activities shows creator username

**Preconditions:**
- A note has been created on the property (or an existing one exists).

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Notes` tab, create a note with subject "AutoNote-{timestamp}" if no note exists.
3. Click the `Activities` tab.
4. Find a log card whose title contains "Note" and "by".
5. Read the username portion of the card title.

**Expected results:**
- The note log card title contains "by" followed by the creator's username (e.g. "Note created by Moiz").
- The username is correct and matches the logged-in user.

---

## Verify that note HTML formatting: bullets/links

### TC-PROP-081 | Note log body renders bullet list and link formatting correctly

**Preconditions:**
- A note with bullet list and/or link in its body exists.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find a note log card and expand it if truncated.
4. Inspect the body for `<ul>`, `<li>` (bullet list) and `<a href>` (link) elements.

**Expected results:**
- Bullet list items are rendered as list items, not as raw `•` characters or plain text.
- Hyperlinks are rendered as `<a>` elements with visible link styling.
- NOTE: If no note with formatted content exists, this test is marked `test.fail()` with a TODO.

---

## Verify that note long text truncation + See more/less

### TC-PROP-082 | Long note body is truncated with See more; clicking See more/less toggles correctly

**Preconditions:**
- A note with a body longer than the truncation threshold exists.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find a note log card with "See more" visible.
4. Click "See more" — verify body expands and toggle changes to "See less".
5. Click "See less" — verify body collapses and toggle changes back to "See more".

**Expected results:**
- Before click: body is truncated, "See more" is visible.
- After "See more": full body is shown, toggle reads "See less".
- After "See less": body collapses to truncated view, toggle reads "See more".

---

## Verify that note update reflects new content + user + timestamp

### TC-PROP-083 | Editing a note updates the log entry body, shows updater username, and refreshes timestamp

**Preconditions:**
- A note exists on the property. User can edit it.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Notes` tab.
3. Open the edit form for an existing note; update the subject to "Updated-{timestamp}".
4. Save the note.
5. Click the `Activities` tab.
6. Find the note log card (it should now reflect the updated content).

**Expected results:**
- The note log card body contains the updated note content (or subject).
- The card title or metadata shows the updater username (matching the logged-in user).
- The card timestamp reflects the update time (not the original creation time).

---

## Verify that note update without content change

### TC-PROP-084 | Saving a note edit without changing content still creates an update log entry

**Preconditions:**
- A note exists on the property.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Notes` tab.
3. Open edit form for an existing note.
4. Click Save without making any text change.
5. Click the `Activities` tab.
6. Observe whether a new "note updated" log entry appears.

**Expected results:**
- Either: a new log entry appears indicating the note was updated (even without content change), OR
- The existing note log card timestamp refreshes.
- The Activities tab does not crash or show an error.
- NOTE: The exact behaviour (new entry vs. no-op) should be captured; mark the test based on observed actual behaviour.

---

## Verify that meeting log title uses creator username

### TC-PROP-085 | Meeting log card title in Activities shows creator username

**Preconditions:**
- A meeting has been created on the property (or exists).

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Meetings` tab — verify a meeting exists, or create one.
3. Click the `Activities` tab.
4. Find a log card whose title contains "Meeting" and "by".
5. Read the username portion.

**Expected results:**
- The meeting log card title contains "by" followed by the creator's username.
- The username matches the logged-in user.

---

## Verify that meeting displays meeting title field

### TC-PROP-086 | Meeting log card body shows the meeting title

**Preconditions:**
- A meeting with a title exists on the property.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find a meeting log card and expand it if needed.
4. Look for the meeting title text in the card body.

**Expected results:**
- The meeting title is visible in the card body.
- It is non-empty and matches the title set during meeting creation.

---

## Verify that meeting link displayed and clickable

### TC-PROP-087 | Meeting log card shows a meeting link that is an active hyperlink

**Preconditions:**
- A meeting with a meeting link (URL) has been created.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find a meeting log card and expand it.
4. Look for a URL or "Join" link in the card body.
5. Verify the link is an anchor with `href`.

**Expected results:**
- A meeting URL/link is visible in the card body.
- The link is an `<a href>` element.
- The `href` is non-empty and is a valid URL.
- NOTE: If no meeting with a link exists, mark `test.fail()` with a TODO.

---

## Verify that meeting description displayed

### TC-PROP-088 | Meeting log card shows the meeting description

**Preconditions:**
- A meeting with a description has been created.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find a meeting log card and expand it.
4. Look for description text in the card body.

**Expected results:**
- The meeting description text is visible in the expanded card body.
- It matches the description entered during meeting creation.
- NOTE: If no meeting with description exists, mark `test.fail()` with TODO.

---

## Verify that meeting guests displayed as tags

### TC-PROP-089 | Meeting log card shows guest names as individual tags

**Preconditions:**
- A meeting with at least one invited guest (contact or user) has been created.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find a meeting log card and expand it.
4. Look for guest name chips/tags in the card body.

**Expected results:**
- Guest names appear as styled chips or tags (not as a plain comma-separated string).
- At least one guest tag is visible.
- Each tag contains a name.
- NOTE: If no meeting with guests exists, mark `test.fail()` with TODO.

---

## Verify that meeting missing fields show N/A individually

### TC-PROP-090 | Meeting log card shows N/A for each individually missing field

**Preconditions:**
- A meeting created with only the required title field (no link, no description, no guests).

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Meetings` tab.
3. Create a minimal meeting (title only, no link/description/guests).
4. Click the `Activities` tab.
5. Find the new meeting log card and expand it.
6. Observe the values for link, description, and guests fields.

**Expected results:**
- The link field shows "N/A" (not blank, not undefined).
- The description field shows "N/A".
- The guests field shows "N/A" or an empty tag area.
- Each field is labelled individually (not one combined "N/A").

---

## Verify that meeting expand/collapse reveals full details

### TC-PROP-091 | Meeting log card expand/collapse shows and hides full meeting details

**Preconditions:**
- A meeting log card exists in the Activities tab.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find a meeting log card. Note its initial collapsed state.
4. Click the expand control (chevron icon or "See more").
5. Verify full details appear.
6. Click the collapse control.
7. Verify the card returns to its initial collapsed state.

**Expected results:**
- Collapsed state: only title and timestamp visible; meeting details hidden.
- Expanded state: meeting title, link, description, and guests are all visible.
- Collapse: card returns to the same compact view as before expansion.

---

## Verify that meeting update reflects changes + timestamp

### TC-PROP-092 | Editing a meeting updates its log card content and refreshes the timestamp

**Preconditions:**
- A meeting exists on the property.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Meetings` tab.
3. Open an existing meeting's edit form; update the title to "Updated Meeting {timestamp}".
4. Save the changes.
5. Click the `Activities` tab.
6. Find the meeting log card (it should reflect the update).

**Expected results:**
- The meeting log card body shows the updated meeting title.
- The card timestamp reflects the update time.
- The card title contains the updater's username.

---

## Verify that call log title uses logger username

### TC-PROP-093 | Call log card title in Activities shows the logger's username

**Preconditions:**
- A call log has been created on the property.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. If no call log exists, navigate to the appropriate call-logging UI on the property and log a call.
3. Click the `Activities` tab.
4. Find a log card whose title contains "Call" and "by".
5. Read the username portion.

**Expected results:**
- The call log card title contains "by" followed by the logger's username.
- The username matches the logged-in user.
- NOTE: If no call log UI is accessible on properties, mark `test.fail()` with TODO.

---

## Verify that call long description truncation + toggle

### TC-PROP-094 | Call log with long description is truncated; See more/less toggles correctly

**Preconditions:**
- A call log with a long description exists.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find a call log card with "See more" visible (truncated body).
4. Click "See more" — verify body expands.
5. Click "See less" — verify body collapses.

**Expected results:**
- Truncated state: body ends with `...` and "See more" is visible.
- After "See more": full description shown, toggle reads "See less".
- After "See less": body collapses, toggle reads "See more".
- NOTE: If no long call description exists, mark `test.fail()` with TODO.

---

## Verify that call timestamp correctness

### TC-PROP-095 | Call log card timestamp matches the time of the logged call

**Preconditions:**
- A call log exists in the Activities tab.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab.
3. Find a call log card.
4. Read its timestamp.

**Expected results:**
- A timestamp is visible on the call log card.
- The timestamp format is `MM/DD/YYYY HH:MM AM/PM` or similar date-time string.
- It is not empty, "N/A", or "Invalid Date".
- NOTE: If no call log exists, mark `test.fail()` with TODO.

---

## Verify that task log title uses creator username

### TC-PROP-096 | Task log card title in Activities shows creator username

**Preconditions:**
- A task has been created on the property.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Tasks` tab — verify a task exists (or create one: title "AutoTask-{timestamp}", type "To-do", priority "Medium").
3. Click the `Activities` tab.
4. Find a log card whose title contains "Task" and "by".
5. Read the username portion.

**Expected results:**
- The task log card title contains "by" followed by the creator's username (e.g. "Task created by Moiz").
- The username matches the logged-in user.

---

## Verify that task fields render: title/type/priority/description/status

### TC-PROP-097 | Task log card body shows title, type, priority, description, and status fields

**Preconditions:**
- A task with all fields filled (title, type, priority, description) has been created.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Create a task with: title "Full-Task-{timestamp}", type "To-do", priority "High", description "Test description for activity log".
3. Click the `Activities` tab.
4. Find the newly created task log card and expand it.
5. Verify each field is visible.

**Expected results:**
- Task title is visible in the card body.
- Task type ("To-do") is visible.
- Task priority ("High") is visible.
- Task description text is visible.
- Task status (e.g. "Pending" or "To Do") is visible.

---

## Verify that task missing type shows N/A

### TC-PROP-098 | Task log card shows N/A for Type when task was created without a type

**Preconditions:**
- A task created without a type selection exists (type field was left blank).

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Tasks` tab. Create a task with title only (no type).
3. Click the `Activities` tab.
4. Find the new task log card and expand it.
5. Read the value in the Type field.

**Expected results:**
- The Type field in the card body shows "N/A".
- It does not show "undefined", blank, or missing.
- NOTE: If the UI prevents creating a task without a type, mark `test.fail()` with TODO.

---

## Verify that task missing priority shows N/A

### TC-PROP-099 | Task log card shows N/A for Priority when task was created without a priority

**Preconditions:**
- A task created without a priority selection exists.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Tasks` tab. Create a task with title only (no priority).
3. Click the `Activities` tab.
4. Find the new task log card and expand it.
5. Read the value in the Priority field.

**Expected results:**
- The Priority field in the card body shows "N/A".
- It does not show "undefined", blank, or missing.
- NOTE: If the UI prevents creating a task without a priority, mark `test.fail()` with TODO.

---

## Verify that task long description truncation + toggle

### TC-PROP-100 | Task log with long description is truncated; See more/less toggles correctly

**Preconditions:**
- A task with a long description (exceeding the truncation threshold) exists.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Create a task with a very long description (200+ words).
3. Click the `Activities` tab.
4. Find the task log card — verify body is truncated ("See more" visible).
5. Click "See more" → body expands.
6. Click "See less" → body collapses.

**Expected results:**
- Truncated state: body ends with `...`, "See more" is visible.
- After "See more": full description shown, toggle reads "See less".
- After "See less": body collapses, toggle reads "See more".

---

## Verify that task update reflects new content + updater + timestamp

### TC-PROP-101 | Editing a task updates its log card content, shows updater username, refreshes timestamp

**Preconditions:**
- A task exists on the property. User can edit it.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Tasks` tab.
3. Open edit form for an existing task; update the title to "Updated-Task-{timestamp}".
4. Save the task.
5. Click the `Activities` tab.
6. Find the task log card (reflects the update).

**Expected results:**
- The task log card body shows the updated task title.
- The card title or metadata shows the updater username.
- The card timestamp reflects the update time (not the original creation time).

---

## Verify that real-time update without manual refresh

### TC-PROP-102 | New activity log entries appear in Activities tab without requiring a page refresh

**Preconditions:**
- The Activities tab is open and showing existing entries.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Activities` tab. Note the current number of visible log cards.
3. Without refreshing the page, click the `Notes` tab.
4. Create a new note with subject "RT-Test-{timestamp}".
5. Save the note.
6. Click the `Activities` tab again.
7. Observe whether the new note log entry appears.

**Expected results:**
- The new note log entry appears in the Activities tab without requiring a full page reload.
- The entry count in the Activities tab is greater than before the note was created.
- NOTE: If the app requires a refresh to see the new entry, the test captures this as a bug and uses `test.fail()` with a TODO.

---

## Verify that permissions: unauthorized user cannot see logs

### TC-PROP-103 | Unauthorized user (SM role) cannot view activity log entries

**Preconditions:**
- SM user credentials are available (`SIGNAL_EMAIL_SM`).
- The property `Regression Location Phase 2` (ID 13179) is accessible to the SM role.

**Steps:**
1. Log in as SM user (`SIGNAL_EMAIL_SM` / `SIGNAL_PASSWORD_SM`).
2. Navigate to `/app/sales/locations/location/13179`.
3. Click the `Activities` tab.
4. Observe what is displayed.

**Expected results:**
- Either: the Activities tab shows an empty state or "No access" message (SM cannot see logs), OR
- The SM user is redirected away from the property detail page.
- The Activities tab does not show HO-only activity data to an SM user.
- NOTE: If SM CAN see the same logs as HO (no access restriction), the test is marked `test.fail()` with a TODO flagging a missing permission boundary.

---

## Verify that Description field is mandatory while creating a note | Verify that system shows validation error when Description is empty

### TC-PROP-104 | Description field is mandatory and validation error appears when Description is empty

**Preconditions:**
- User is logged in as HO (Home Officer).
- A property detail page is accessible (e.g., `Regression Location Phase 2` at `/app/sales/locations/location/13179`).
- The Notes tab is visible on the property detail page.

**Steps:**

Step 1 — Verify Description field has mandatory (*) indicator:
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Notes` tab.
3. Wait for the Notes tab to become active (`aria-selected="true"`).
4. Click `Create New Note` button.
5. Wait for the `Add Notes` drawer heading (level=4) to be visible.
6. Observe the Description editor section of the drawer.

**Expected results (Step 1):**
- The `Add Notes` drawer is open.
- The Description field area has a mandatory asterisk (`*`) indicator visible (`.jss325` span).
- The Description rich-text editor (`[aria-label="rdw-editor"]`) is visible and empty.

Step 2 — Verify validation error when both fields are empty and Save is clicked:
7. Without filling any field, click the `Save` button.
8. Observe the drawer and any validation feedback.

**Expected results (Step 2):**
- The `Add Notes` drawer remains open (heading still visible).
- A `Title is required.` error message is visible (`.MuiFormHelperText-root.Mui-error`).
- A `Description is required.` error message is visible (paragraph with text "Description is required.").
- No success toast appears.

Step 3 — Verify Description-only validation when Title is empty but Description is filled:
9. Click the Cancel button to close the drawer.
10. Click `Create New Note` again to reopen.
11. Leave the Title (Subject) field empty.
12. Click the Description editor and type any text (e.g., `Some description text`).
13. Click `Save`.

**Expected results (Step 3):**
- The drawer remains open.
- The `Title is required.` error is visible.
- No `Description is required.` error is shown (description was filled).

---

## Verify that empty state is shown again after deleting last note

### TC-PROP-105 | Empty state reappears after the last note is deleted

**Preconditions:**
- User is logged in as HO (Home Officer).
- A property detail page is accessible (e.g., `Regression Location Phase 2` at `/app/sales/locations/location/13179`).
- The property currently has no notes (empty state is showing), or any existing notes will be accounted for.

**Steps:**
1. Navigate to `/app/sales/locations/location/13179`.
2. Click the `Notes` tab and wait for it to become active.
3. If notes already exist, delete them all until the empty state is visible — otherwise proceed.
4. Click `Create New Note`.
5. Wait for the `Add Notes` drawer to open.
6. Fill the Subject field with a unique note title (e.g., `PAT {timestamp}`).
7. Click the Description editor and type a body (e.g., `Temporary note for delete test.`).
8. Click `Save`.
9. Wait for the drawer to close and the note to appear in the notes list.
10. Verify the created note is visible in the Notes tab panel.
11. Click the `Delete` button on that note.
12. Wait for the `Delete Note!` confirmation dialog to appear.
13. Click the `Delete Note` confirm button.
14. Wait for the success toast and dialog to close.
15. Observe the Notes tab panel.

**Expected results:**
- After step 9: The `Add Notes` drawer is closed and the newly created note appears in the list.
- After step 10: The note with the created subject is visible in the `Notes` tabpanel.
- After step 12: The `Delete Note!` confirmation dialog is visible with the text "Are you sure you want to delete this note?".
- After step 14: The note is removed from the list.
- After step 15: The `Oops, It's Empty Here!` empty state heading is visible in the Notes tab panel.
- The `Get Started and Fill It Up!` subtext is also visible.

---

## Verify that the system shows a success toast/message after property creation

### TC-PROP-106 | Success toast appears after property is created

**Preconditions:**
- User is logged in as HO (Home Officer).
- An existing company is available to link the property to (e.g., the company resolved via `readCreatedCompanyName()` or the fallback "Regression Phase 2").
- The Properties list page is accessible at `/app/sales/locations`.

**Steps:**

Step 1 — Open the Create Property drawer:
1. Navigate to `/app/sales/locations`.
2. Wait for the `Create Property` button to be visible.
3. Click `Create Property`.
4. Wait for the `Create Property` drawer heading (level=3) to be visible.

**Expected results (Step 1):**
- The Create Property drawer is open.
- The drawer heading "Create Property" (level=3) is visible.

Step 2 — Fill required fields and submit:
5. In the `Search Company` field, type the company name and select the first matching result.
6. Fill the `Property / Property Name *` field with a unique name (e.g., `PAT {timestamp}`).
7. Select a property source (e.g., click the source dropdown and pick any option).
8. Select an Associated Franchise (e.g., pick the first available franchise option).
9. Select a Stage (e.g., pick "Approved").
10. Select at least one Property Affiliation chip (e.g., click "Managed").
11. Select an Assignee.
12. Enter a valid US address in the address autocomplete and select the first suggestion.
13. Click the `Create Property` submit button.

**Expected results (Step 2):**
- The form submission triggers a POST request to the `/locations` API.
- The drawer closes after successful submission.

Step 3 — Verify success toast:
14. Wait for the success toast notification to appear.
15. Observe the toast message text.

**Expected results (Step 3):**
- A toast notification is visible with text matching `/created successfully|property created/i`.
- The toast uses the `.Toastify__toast-body[role="alert"]` element.
- The toast disappears automatically after a few seconds.

---

## Verify that Bulk Assignment assigns properties successfully

### TC-PROP-107 | Bulk Assignment dialog opens, assignee is selected, and assignment completes

**Preconditions:**
- User is logged in as HO (Home Officer).
- At least two properties exist in the system.
- The Properties list page is accessible at `/app/sales/locations`.

**Steps:**

Step 1 — Select properties and open Bulk Assignment:
1. Navigate to `/app/sales/locations`.
2. Wait for the table to render (at least one data row visible).
3. Click the checkbox cell of the first data row to select it.
4. Verify `1 property selected.` message and `Bulk Assignment` button is enabled.
5. Click the checkbox cell of the second data row.
6. Verify the count updates to `2 properties selected.`.
7. Click the `Bulk Assignment` button.
8. Wait for the Bulk Assignment overlay/dialog to appear.

**Expected results (Step 1):**
- The Bulk Assignment overlay opens.
- The overlay contains a `Select people to assign` prompt (or equivalent assignee search UI).

Step 2 — Select an assignee and confirm assignment:
9. In the Bulk Assignment overlay, type a known assignee name (e.g., `Moiz SM UAT`) into the search input.
10. Wait for search results to appear.
11. Click the first matching assignee result.
12. Click the `Assign` (or `Save` / `Confirm`) button in the overlay.
13. Wait for the overlay to close and for a success indicator.

**Expected results (Step 2):**
- The overlay closes after the assignment is confirmed.
- A success toast or confirmation indicator is visible (e.g., `/assigned successfully|assignment complete/i`).

---

## Verify that activities logs load for different record types

### TC-PROP-108 | Activities tab loads log entries for different record types (property, note, task, meeting, call, email)

**Preconditions:**
- User is logged in as HO (Home Officer).
- A property detail page is accessible (use `Regression Location Phase 2` at `/app/sales/locations/location/13179` — this property has multiple activity types).
- The property has existing activity log entries covering multiple record types.

**Steps:**

Step 1 — Open Activities tab:
1. Navigate to `/app/sales/locations/location/13179`.
2. Wait for the property detail page to load (stage bar is visible).
3. Click the `Activities` tab.
4. Wait for the `Activities` tabpanel to become active (`aria-selected="true"`).

**Expected results (Step 1):**
- The Activities tabpanel is visible.
- At least one dated group heading (e.g., "March, 2026") is visible in the panel.
- At least one activity card is rendered.

Step 2 — Verify activity cards for different record types:
5. Scroll through the activities list and observe the log entry cards.
6. Identify at least 3 different activity types present (e.g., property creation, note, task, email, meeting, call).

**Expected results (Step 2):**
- At least one "property created" log entry is visible (card paragraph contains "property created").
- The total count of activity cards is greater than 0.
- Activity entries are grouped by date with a date heading visible above each group.
- Each card shows: a title paragraph with creator username, a timestamp, and a body paragraph.

---

## Verify that Task Description field is mandatory while creating a task, Verify that Type field is mandatory while creating a task, Verify that Priority field is mandatory while creating a task, Verify that Due Date field is mandatory while creating a task

### TC-PROP-109 | Task Description, Type, Priority, and Due Date fields are mandatory — validation errors appear when form is submitted empty

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Tasks listing page is accessible at `/app/sales/tasks`.
- The `New Task` button is visible.

**Steps:**

Step 1 — Open Create New Task drawer and submit empty form:
1. Navigate to `/app/sales/tasks`.
2. Wait for the `New Task` button to be visible.
3. Click `New Task`.
4. Wait for the `Create New Task` drawer heading (level=3) to be visible.
5. Do NOT fill any fields.
6. Click the `Save` button.

**Expected results (Step 1 — all required-field errors appear):**
- The drawer remains open (heading "Create New Task" level=3 is still visible).
- `Task For is required.` error message is visible.
- `Task Title is required.` error message is visible.
- `Task Description is required.` error message is visible.
- `Task Type is required.` error message is visible.
- `Task Priority is required.` error message is visible.

Step 2 — Verify Task Description field is mandatory:
7. Fill the `Task Title` field with a non-empty value.
8. Do NOT fill the Task Description editor.
9. Select "Property" for the "Create task for" radio.
10. Open the Type dropdown and select "To-do".
11. Open the Priority dropdown and select "High".
12. Click `Save`.

**Expected results (Step 2):**
- The drawer remains open.
- `Task Description is required.` error message is visible.
- No `Task Title is required.` error (title was filled).
- No `Task Type is required.` error.
- No `Task Priority is required.` error.

Step 3 — Verify Due Date field is mandatory when cleared:
13. Click `Cancel` to close and reopen the drawer by clicking `New Task`.
14. Clear the Due Date field (select all content and delete).
15. Click `Save`.

**Expected results (Step 3):**
- The drawer remains open.
- `Due Date is required.` error message is visible.

---

## Verify that user can filter tasks by Type, Verify that user can filter tasks by Priority, Verify that user can filter tasks by Status, Verify that user can filter tasks by Due Date range

### TC-PROP-110 | Task list filters by Type, Priority, Status, and Due Date range each narrow the results correctly

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Tasks listing page is accessible at `/app/sales/tasks`.
- At least one task of each type (To-do, Email, Call, LinkedIn) exists in the system.
- At least one High priority task exists.
- At least one Completed task exists.

**Steps:**

Step 1 — Filter by Type (To-do):
1. Navigate to `/app/sales/tasks`.
2. Wait for the table to render (at least one row visible).
3. Note the current total record count from pagination (e.g., `1–10 of 2594`).
4. Click the `All Types` filter trigger (heading level=6).
5. Wait for the tooltip to appear containing `All Types`, `To-do`, `Email`, `Call`, `LinkedIn`.
6. Click `To-do` in the tooltip.
7. Wait for the table to update.

**Expected results (Step 1):**
- After selection, the table updates.
- Each visible row in the Type column shows "To-do".
- The pagination count may differ from the original total.
- Navigate back to reset: click `All Types` → `All Types` to clear.

Step 2 — Filter by Priority (High):
8. Click the `Priority` filter trigger (heading level=6).
9. Wait for the tooltip containing `All Priority`, `High`, `Medium`, `Low`.
10. Click `High`.
11. Wait for the table to update.

**Expected results (Step 2):**
- The table updates.
- Each visible row in the Priority column shows `High`.
- Reset: click `Priority` → `All Priority`.

Step 3 — Filter by Status (Completed):
12. Click the `To-do` status filter trigger (heading level=6).
13. Wait for the tooltip containing `All Status`, `To-do`, `Completed`.
14. Click `Completed`.
15. Wait for the table to update.

**Expected results (Step 3):**
- The table updates.
- Each visible row in the Type column shows a completed-state badge.
- The pagination total updates.
- Reset: click the status filter → `All Status`.

Step 4 — Filter by Due Date range:
16. Compute the current month's date range (e.g., `04/01/2026 - 04/30/2026`).
17. Fill the Due Date range textbox (`MM/DD/YYYY - MM/DD/YYYY`) with the computed range.
18. Wait for the table to update.

**Expected results (Step 4):**
- The table updates to show tasks with due dates within the entered range.
- The pagination total may change.
- Clear the date range field after verification.

---

## Verify that pagination works correctly in task listing, Verify that tasks are sorted correctly by Due Date

### TC-PROP-111 | Task list pagination navigates pages correctly and Due Date column sorts ascending/descending

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Tasks listing page is accessible at `/app/sales/tasks`.
- More than 10 tasks exist in the system (total > 10 to enable next-page navigation).

**Steps:**

Step 1 — Verify pagination controls and navigate to next page:
1. Navigate to `/app/sales/tasks`.
2. Wait for the table to render (at least one row visible).
3. Read the pagination info text (e.g., `1–10 of 2594`).
4. Verify the `Go to previous page` button is disabled (first page).
5. Verify the `Go to next page` button is enabled.
6. Click `Go to next page`.
7. Wait for the table to update.

**Expected results (Step 1):**
- After step 3: Pagination text matches `/\d+–\d+ of \d+/` and total > 10.
- After step 4: Previous page button is disabled.
- After step 6–7: Pagination text updates to show the second page range (e.g., `11–20 of 2594`).
- The table still has at least one visible row.

Step 2 — Navigate back to first page:
8. Click `Go to previous page`.
9. Wait for the table to update.

**Expected results (Step 2):**
- Pagination text returns to first-page range (e.g., `1–10 of 2594`).
- The `Go to previous page` button is disabled again.

Step 3 — Change rows per page:
10. Click the `Rows per page` combobox and select `25`.
11. Wait for the table to update.

**Expected results (Step 3):**
- Pagination text shows up to 25 rows (e.g., `1–25 of 2594`).
- The table has up to 25 visible rows.
- Reset rows per page back to 10.

Step 4 — Sort by Due Date ascending:
12. Click the `Due Date` column header sort button.
13. Wait for the table to re-render.
14. Read the Due Date values from the first two visible rows.

**Expected results (Step 4):**
- The table re-renders after the sort click.
- At least one row is visible.
- The first row's Due Date is chronologically ≤ the second row's Due Date (ascending order, parsed as Date objects from `MM/DD/YYYY`).

Step 5 — Sort by Due Date descending:
15. Click the `Due Date` column header sort button again.
16. Wait for the table to re-render.
17. Read the Due Date values from the first two visible rows.

**Expected results (Step 5):**
- The table re-renders.
- The first row's Due Date is chronologically ≥ the second row's Due Date (descending order).

---

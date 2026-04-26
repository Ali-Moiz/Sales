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
- It enters a temporary property name.
- It clicks `Cancel`.
- It verifies that the drawer closes.

Expected result:
- The drawer closes successfully.
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
- It verifies that the Property Name field is already filled.
- It verifies that the `Save` button is disabled before any change is made.
- It closes the edit drawer.

Expected result:
- The edit form opens correctly.
- Existing property data is pre-filled.
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

## Verify that submitting the Create Property form with all required fields empty shows validation errors and the drawer remains open

### TC-PROP-058 | Submitting empty Create Property form shows validation errors and drawer stays open

**Preconditions:**
- User is logged in as HO (Home Officer).
- The Create Property drawer is open.
- No fields have been filled.

**Steps:**
1. Navigate to `/app/sales/locations`.
2. Click `Create Property` to open the drawer.
3. Wait for the "Create Property" heading (level=3) to be visible.
4. Without filling any field, click the `Create Property` submit button (the last button in the drawer footer).
5. Observe the drawer state and any validation feedback.

**Expected results:**
- The drawer remains open (the "Create Property" heading is still visible).
- At least one required-field error message is visible in the drawer (e.g. `Address is required.` text).
- No success toast appears.

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

Step 3 — Verify Approved/Rejected stage filter options:
7. Click the "All Affiliation" heading (level=6) trigger to open its tooltip.
8. Observe the available options in the tooltip.

**Expected results (Step 3):**
- The tooltip is visible.
- The tooltip contains the option `Approved` (with a count).
- The tooltip contains the option `Rejected` (with a count).
- Close the tooltip by pressing Escape.

Step 4 — Verify All Properties dropdown (Assigned/Unassigned):
9. Click the "All Properties" heading (level=6) trigger to open its tooltip.
10. Observe the available options.

**Expected results (Step 4):**
- The tooltip is visible.
- The tooltip contains a paragraph `All Properties`.
- The tooltip contains a paragraph `Assigned`.
- The tooltip contains a paragraph `Unassigned`.
- Close the tooltip by pressing Escape.

Step 5 — Verify Property Name column sorting:
11. Click the "Property Name" sort button (column header button) once.
12. Wait for the table to re-render.

**Expected results (Step 5):**
- The table re-renders after the sort click.
- At least one row is still visible.
- The "Property Name" column header sort button is still present and clickable.

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
- A dialog or modal opens (a dialog role element or visible overlay content becomes visible).
- Close the dialog/modal by pressing Escape or clicking Cancel.

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
- The Stage cell contains a non-empty badge text (e.g. `Approved`, `Current Customer`, etc.).
- The Assigned To cell contains either a user name or `N/A`.
- The Franchise cell contains a text value or `N/A`.
- The Created Date cell contains text matching the format `MM/DD/YYYY`.
- The Last Modified Date cell contains text matching the format `MM/DD/YYYY`.

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
- The table updates (may show a different count or filtered rows).
- The pagination count updates to reflect the filtered results.

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

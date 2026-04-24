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

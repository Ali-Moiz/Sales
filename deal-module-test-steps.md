# Deal Module Test Cases

This document explains the Deal Module test flow in simple NLP-style language.
It is based on:

- [deal-module.spec.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/tests/e2e/deal-module.spec.js)
- [deal-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/deal-module.js)
- [register-notes-tasks-suite.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/tests/helpers/register-notes-tasks-suite.js)

## Execution Model

- The suite logs in only one time in `beforeAll`.
- All deal test cases run in the same browser session.
- The suite is serial, so later cases depend on the deal created earlier.
- Before every test case, the script opens the Deals listing page again.
- A deal is created once in `TC-DEAL-002`.
- The same created deal is reused in search, detail, edit, notes, and tasks flows.
- When the deal name is edited in `TC-DEAL-020`, the updated name becomes the new shared reference for all later cases.

## Dependency Resolution Flow

- The suite first tries to use an already known property name from runtime state or environment variables.
- It also resolves the company linked with that property from runtime state or falls back to a standalone company.
- Before creating a deal, the suite validates that both resolved company and resolved property are selectable in the Create Deal drawer.
- If that company-property pair is not valid, the suite creates a brand-new property dynamically under the resolved company.
- The newly created property name and its company are stored in `.tmp/shared-run-state.json`.
- The suite then returns to Deals and continues the deal creation flow with the corrected dependency pair.

## Dynamic Test Data

- Deal name format: `A-D ####`
- Edited deal name format: `A-D Edited ####`
- Standalone fallback company: `Regression Phase 2`
- Standalone fallback property: `Regression Location Phase 2`
- Runtime state file: `.tmp/shared-run-state.json`
- The created deal name is also stored in runtime state for downstream suites.

## High-Level End-to-End Flow

1. Open Deals page and verify basic list UI.
2. Open Create Deal drawer and verify required inputs.
3. Validate company search and company selection behavior.
4. Validate property search behavior after selecting a company.
5. Create a deal with dynamic company and property linkage.
6. Search that deal from the list and open its detail page.
7. Validate detail sidebar, stage bar, tabs, notes entry points, and tasks entry points.
8. Validate edit-deal behavior including disabled save, cancel, and successful rename.
9. Run reusable Notes and Tasks CRUD smoke coverage on the same deal detail page.

## Core Deal Test Cases

### TC-DEAL-001 | Deals module opens successfully

Execution steps:
- The script opens the Deals module from the sidebar.
- It waits for the page load to settle.
- It verifies that the URL contains `/app/sales/deals`.
- It checks that the `Create Deal` button is visible.

Expected result:
- The Deals listing page opens successfully.
- The `Create Deal` button is visible.

### TC-DEAL-002 | User can create a deal successfully

Execution steps:
- The script generates a unique deal name in the format `A-D ####`.
- It validates that a usable company and property pair exists.
- If the resolved property is not selectable for the resolved company, the script creates a fresh property first.
- It opens the `Create Deal` drawer.
- It enters the generated deal name.
- It selects the company from the searchable dropdown.
- It waits briefly for the property dependency to refresh.
- It selects the property from the searchable dropdown.
- It clicks the drawer-level `Create Deal` button.
- It waits for the success toast.
- It stores the created deal name in runtime state.

Expected result:
- A new deal is created successfully.
- The success toast `Deal has been created` becomes visible.

### TC-DEAL-003 | Deals table displays all expected column headers

Execution steps:
- The script stays on the Deals listing page.
- It checks the table headers one by one.
- It verifies `Deal Name`, `Amount`, `Deal Owner`, `Stage`, `Deal Type`, `Property`, `Address`, `Created Date`, and `Last Modified Date`.

Expected result:
- All required deal table headers are visible.

### TC-DEAL-004 | Pagination is visible with correct format

Execution steps:
- The script reads the pagination section below the deal table.
- It verifies that the text matches the format `X–Y of Z`.

Expected result:
- Pagination is visible.
- The pagination text follows the expected numeric format.

### TC-DEAL-005 | Create Deal drawer opens with all required fields

Execution steps:
- The script clicks the list-page `Create Deal` button.
- It waits for the drawer to open.
- It checks the `Create Deal` heading.
- It verifies the `Deal Name` field.
- It verifies the `Select Company` control.
- It verifies the `Select Property / Property Name` control.
- It verifies the `Cancel` button.

Expected result:
- The Create Deal drawer opens correctly.
- All required create-deal fields are visible.

### TC-DEAL-006 | Company dropdown searches and shows matching results

Execution steps:
- The script opens the `Create Deal` drawer.
- It clicks the Company selector.
- It waits for the tooltip dropdown to appear.
- It enters the resolved company name in the shared search box.
- It waits for results to load.
- It verifies that at least one matching company result is visible.
- It closes the dropdown with `Escape`.

Expected result:
- Company search works correctly.
- A matching company result is visible in the dropdown.

### TC-DEAL-007 | Property dropdown searches and shows matching results

Execution steps:
- The script opens the `Create Deal` drawer.
- It first selects the resolved company because property options depend on company selection.
- It waits for the property dependency to refresh.
- It opens the Property selector.
- It searches the resolved property name.
- It waits for results to load.
- It verifies that a matching property result is visible.
- It closes the dropdown with `Escape`.

Expected result:
- Property search works correctly after selecting a company.
- A matching property result is visible in the dropdown.

### TC-DEAL-008 | Cancel Create Deal closes drawer without creating record

Execution steps:
- The script opens the `Create Deal` drawer.
- It enters a temporary deal name.
- It clicks `Cancel`.
- It verifies that the drawer closes.
- It searches the temporary name from the list page.
- It verifies that no result is returned.
- It clears the search.

Expected result:
- The drawer closes successfully.
- The cancelled deal name does not create any record.

### TC-DEAL-009 | Created deal linked to dynamic company and property is searchable

Execution steps:
- The script searches the created deal name on the Deals listing page.
- It waits for the search state to update.
- It verifies that the created deal appears in the results.
- It clears the search.

Expected result:
- The created deal is searchable from the Deals list.

### TC-DEAL-010 | User can search and open an existing deal

Execution steps:
- The script searches the created deal name.
- It waits for the matching row.
- It clicks the deal row.
- It waits for the detail page to load.
- It verifies that the deal detail heading matches the created deal name.

Expected result:
- The deal detail page opens successfully for the created deal.

### TC-DEAL-011 | Deal detail page shows all sidebar sections

Execution steps:
- The script opens the created deal detail page.
- It verifies the sidebar section buttons one by one.
- It checks `About this Deal`.
- It checks `Company`.
- It checks `Property Details`.
- It checks `Contact`.
- It checks `Franchise Associated`.
- It checks `Attachments`.

Expected result:
- All major sidebar sections are visible on the deal detail page.

### TC-DEAL-012 | Deal detail shows stages bar and all overview tabs

Execution steps:
- The script opens the created deal detail page.
- It checks that the `Deal Stages` heading is visible.
- It verifies that `Proposal Creation` is visible in the stage bar.
- It verifies that the overview tabs are visible.
- It checks `Contract & Terms`.
- It checks `Activities`.
- It checks `Notes`.
- It checks `Tasks`.

Expected result:
- The stage bar is visible.
- All main overview tabs are visible.

### TC-DEAL-013 | Activities tab loads with at least one dated entry

Execution steps:
- The script opens the created deal detail page.
- It clicks the `Activities` tab.
- It verifies that the tab becomes active through `aria-selected="true"`.
- It checks for at least one date-grouped activity heading in the format `Month, YYYY`.

Expected result:
- The Activities tab opens successfully.
- At least one dated activity group is visible.

### TC-DEAL-014 | Notes tab visible; Create New Note drawer opens with correct fields

Execution steps:
- The script opens the created deal detail page.
- It verifies that the `Notes` tab is visible.
- It opens the `Notes` tab.
- It verifies that the `Create New Note` button is visible.
- It clicks `Create New Note`.
- It waits for the `Add Notes` drawer to open.
- It checks the Subject field.
- It checks the rich text editor.
- It checks the character counter.
- It checks the `Save` button.
- It checks the `Cancel` button.
- It closes the drawer.

Expected result:
- The Notes drawer opens with all expected fields.
- The drawer can be closed successfully.

### TC-DEAL-015 | Tasks tab shows correct columns and New Task button

Execution steps:
- The script opens the created deal detail page.
- It verifies that the `Tasks` tab is visible.
- It opens the `Tasks` tab.
- It checks the task table columns.
- It verifies `Task Title`, `Task Description`, `Created By`, `Due Date`, `Priority`, and `Type`.
- It verifies that the `New Task` button is visible.

Expected result:
- The Tasks tab loads correctly.
- All expected task columns are visible.
- The `New Task` button is visible.

### TC-DEAL-016 | Create New Task drawer opens with all required fields

Execution steps:
- The script opens the created deal detail page.
- It opens the `Tasks` tab.
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

### TC-DEAL-017 | Searching with non-existent deal name returns no results

Execution steps:
- The script enters a random non-existent deal name in the list search field.
- It waits for the search state to update.
- It verifies that the result state becomes empty or zero-results.
- It clears the search field.

Expected result:
- No deal records are returned for the invalid search term.
- The search state shows no matching deal.

### TC-DEAL-018 | Edit Deal form opens pre-filled; Save disabled without changes

Execution steps:
- The script opens the created deal detail page.
- It clicks the `Edit` button.
- It waits for the `Edit Deal` drawer to open.
- It verifies that the `Deal Name` field is pre-filled with the current deal name.
- It verifies that the Save or Update button is disabled before any modification.
- It verifies that the `Cancel` button is visible.
- It closes the edit drawer.

Expected result:
- The Edit Deal drawer opens correctly.
- Existing deal data is pre-filled.
- Save remains disabled until a change is made.

### TC-DEAL-019 | Cancel Edit Deal closes drawer without saving changes

Execution steps:
- The script opens the created deal detail page.
- It opens the `Edit Deal` drawer.
- It enters a temporary replacement deal name.
- It clicks `Cancel`.
- It verifies that the edit drawer closes.
- It verifies that the original deal name still appears on the detail page.
- It verifies that the temporary name does not appear.

Expected result:
- The edit drawer closes successfully.
- No cancelled edit is persisted.

### TC-DEAL-020 | User can edit deal name and verify updated name on detail page

Execution steps:
- The script generates a unique edited deal name in the format `A-D Edited ####`.
- It opens the created deal detail page.
- It opens the `Edit Deal` drawer.
- It clears the current deal name.
- It enters the edited deal name.
- It submits the edit form.
- It waits for the drawer to close and the detail page to refresh.
- It verifies that the detail heading now shows the updated deal name.
- It updates the shared runtime reference to use the edited name for the remaining suite.

Expected result:
- The deal name is updated successfully.
- The updated deal name becomes the new shared deal reference.

## Reusable Notes And Tasks CRUD Coverage

After `TC-DEAL-020`, the deal suite also registers the reusable Notes and Tasks smoke suite for the Deal detail page. These cases run by reopening the same deal detail before each test.

### Deal Notes coverage

- `NT-Deal-N001`: Notes tab is visible and clickable.
- `NT-Deal-N002`: Notes empty state or existing notes list is visible.
- `NT-Deal-N003`: `Add Notes` drawer shows all required fields.
- `NT-Deal-N004`: User can create a note successfully and the note appears in the list.
- `NT-Deal-N005`: Validation holds when Subject is empty.
- `NT-Deal-N006`: Cancel Create Note closes the drawer without saving.
- `NT-Deal-N007`: Character counter updates while typing description.
- `NT-Deal-N008`: Edit Note drawer opens with existing values pre-filled.
- `NT-Deal-N009`: User can edit note subject and save successfully.
- `NT-Deal-N010`: Cancel Edit Note keeps the original note unchanged.
- `NT-Deal-N011`: Delete Note confirmation dialog opens correctly.
- `NT-Deal-N012`: Cancel Delete Note keeps the note in the list.
- `NT-Deal-N013`: Confirm Delete Note removes the note from the list.

### Deal Tasks coverage

- `NT-Deal-T001`: Tasks tab is visible and clickable.
- `NT-Deal-T002`: Tasks tab shows all expected table columns.
- `NT-Deal-T003`: Tasks empty state or existing task rows are visible.
- `NT-Deal-T004`: `Create New Task` drawer shows all required fields.
- `NT-Deal-T005`: Task Type dropdown shows `To-do`, `Email`, `Call`, and `LinkedIn`.
- `NT-Deal-T006`: Task Priority dropdown shows `High`, `Medium`, and `Low`.
- `NT-Deal-T007`: User can create a task successfully and it appears in the table.
- `NT-Deal-T008`: Cancel Create Task closes the drawer without saving.
- `NT-Deal-T009`: Validation holds when Task Title is empty.
- `NT-Deal-T010`: Task search filters the table by title.
- `NT-Deal-T011`: Non-matching task search shows empty state.
- `NT-Deal-T012`: Edit Task drawer opens with pre-filled data.
- `NT-Deal-T013`: User can edit task title and save successfully.
- `NT-Deal-T014`: Cancel Edit Task keeps the original task unchanged.
- `NT-Deal-T015`: Task can be marked complete via checkbox.
- `NT-Deal-T016`: Completed task can be unchecked and returned to pending state.
- `NT-Deal-T017`: Delete Task confirmation dialog opens correctly.
- `NT-Deal-T018`: Cancel Delete Task keeps the task in the table.
- `NT-Deal-T019`: Confirm Delete Task removes the task from the table.

### Cross-tab coverage

- `NT-Deal-X001`: Switching between Notes and Tasks tabs works correctly.
- `NT-Deal-X002`: A newly created note and a newly created task both persist in the same session.

## Page Object Summary

The page object in [deal-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/deal-module.js) handles:

- Deals page navigation
- Deals list search state handling
- Table and pagination assertions
- Create Deal drawer open, fill, select, submit, and cancel actions
- Company and property dropdown interaction with shared tooltip search
- Deal detail opening and validation
- Activities, Notes, and Tasks tab entry helpers
- Note drawer and task drawer assertions
- Edit Deal drawer open, validate, cancel, and submit flows

## Recommended Execution Commands

Full Deal suite:

```bash
npx playwright test tests/e2e/deal-module.spec.js --project=chrome
```

Headed mode:

```bash
HEADLESS=false npx playwright test tests/e2e/deal-module.spec.js --project=chrome
```

Single case example:

```bash
HEADLESS=false npx playwright test tests/e2e/deal-module.spec.js --project=chrome --grep "TC-DEAL-020"
```

Single reusable Notes/Tasks example:

```bash
HEADLESS=false npx playwright test tests/e2e/deal-module.spec.js --project=chrome --grep "NT-Deal-T007"
```

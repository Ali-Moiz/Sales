# Company Module Test Cases

This document explains the Company Module test flow in simple NLP-style language.
It is based on:

- [company-module.spec.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/tests/e2e/company-module.spec.js)
- [company-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/company-module.js)
- [register-notes-tasks-suite.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/tests/helpers/register-notes-tasks-suite.js)

## Execution Model

- The suite logs in only one time in `beforeAll`.
- All company test cases run in the same browser session.
- The suite is serial, so later cases depend on earlier state.
- The suite uses one fixed existing company for target-detail verification: `A-C 6548`.
- The suite also creates one new company dynamically for reusable Notes and Tasks CRUD coverage.
- The created company name is stored in `.tmp/shared-run-state.json` for downstream reuse.

## Runtime References

- Fixed target company for search/detail/edit checks: `A-C 6548`
- Create-company address used by the suite: `S 9th St, Omaha, NE 68102, USA`
- Dynamic created company name format: `A-C ####`
- Runtime state file: `.tmp/shared-run-state.json`

## High-Level End-to-End Flow

1. Open Companies page and verify list UI.
2. Search and open the fixed target company detail.
3. Validate activities and company detail sidebar sections on that target company.
4. Validate create-company modal behavior and negative search behavior on the list page.
5. Validate market vertical filter options.
6. Validate notes and tasks entry points on the fixed target company.
7. Validate edit-company drawer behavior and successful update of target company details.
8. Create a new company dynamically for reusable Notes and Tasks CRUD tests.
9. Reopen that created company detail before every helper case and run full Notes/Tasks smoke coverage.

## Core Company Test Cases

### TC-COMP-001 | Companies module opens successfully

Execution steps:
- The script opens the Companies module from the sidebar.
- It waits for the page load to settle.
- It verifies that the URL contains `/app/sales/companies`.
- It verifies that the `Create Company` button is visible.

Expected result:
- The Companies page opens successfully.
- The `Create Company` button is visible.

### TC-COMP-002 | User can search and open an existing company successfully

Execution steps:
- The script opens the Companies list page.
- It searches for the fixed target company `A-C 6548`.
- It waits for the matching result to appear.
- It clicks the company result.
- It waits for the detail page to load.
- It verifies that the company detail heading matches `A-C 6548`.

Expected result:
- The target company detail page opens successfully.

### TC-COMP-003 | Activities tab shows company creation activity for the searched company

Execution steps:
- The script stays on the target company detail page.
- It opens the `Activities` tab.
- It waits for network activity to settle.
- It verifies that a creation activity entry for the same company is visible.

Expected result:
- The Activities tab shows the company creation activity for the searched company.

### TC-COMP-004 | User can edit the searched company and verify updated values in About this Company

Execution steps:
- The script generates random numeric edit values for Sub Market Vertical, NAICS Codes, Employee Count, Revenue, Property Count, and Year Founded.
- It opens the target company detail page.
- It clicks the `Edit` button.
- It waits for the `Edit Company` drawer to open.
- It replaces the editable fields with generated values.
- It verifies that the `Update Company` button becomes enabled.
- It submits the update.
- It opens the `About this Company` section.
- It verifies that the updated values are visible on the detail page.

Expected result:
- The target company is updated successfully.
- The `About this Company` section reflects the updated values.

### TC-COMP-005 | Companies table displays all expected column headers

Execution steps:
- The script opens the Companies list page.
- It checks the table headers one by one.
- It verifies `Company Name`, `Parent Company`, `Company Owner`, `Market Vertical`, `Sub Market Vertical`, `Revenue`, `Created Date`, and `Last Modified Date`.

Expected result:
- All required company table headers are visible.

### TC-COMP-006 | Create Company modal opens with all required fields visible

Execution steps:
- The script opens the Companies list page.
- It clicks the `Create Company` button.
- It waits for the `Create a New Company` modal to open.
- It verifies the Company Name field.
- It verifies the Market Vertical selector `Select Industry`.
- It verifies the Address field.
- It verifies that the modal is open and usable.

Expected result:
- The Create Company modal opens successfully.
- All required create-company fields are visible.

### TC-COMP-007 | Create Company submit button is disabled without required fields

Execution steps:
- The script keeps the Create Company modal open.
- It does not fill any required field.
- It inspects the modal `Create Company` submit button.

Expected result:
- The submit button remains disabled until required fields are filled.

### TC-COMP-008 | Cancel on Create Company modal closes it without creating a record

Execution steps:
- The script keeps the Create Company modal open.
- It enters a temporary company name.
- It clicks `Cancel`.
- It verifies that the modal closes.

Expected result:
- The modal closes successfully.
- No company is created from the cancelled attempt.

### TC-COMP-009 | Searching with a non-existent company name returns no results

Execution steps:
- The script opens the Companies list page.
- It searches for a random non-existent company name.
- It waits for the search state to update.
- It verifies that the searched company is not visible in the results.
- It clears the search field.

Expected result:
- No matching company result is returned for the invalid search term.

### TC-COMP-010 | Market Vertical filter dropdown shows all correct options

Execution steps:
- The script opens the Companies list page.
- It clicks the `Market Vertical` filter heading.
- It waits for the tooltip dropdown to open.
- It verifies the visible options.
- It checks `Commercial`.
- It checks `Distribution`.
- It checks `Industrial`.
- It checks `Manufacturing`.
- It checks `Residential`.
- It closes the dropdown with `Escape`.

Expected result:
- The Market Vertical filter dropdown opens correctly.
- All expected market vertical options are visible.

### TC-COMP-011 | Company detail page shows all sidebar sections

Execution steps:
- The script opens the target company detail page.
- It verifies the sidebar sections one by one.
- It checks `About this Company`.
- It checks `Properties`.
- It checks `Deals`.
- It checks `Contacts`.
- It checks `Attachments`.

Expected result:
- All required sidebar sections are visible on the company detail page.

### TC-COMP-012 | Notes tab is visible and Create New Note drawer opens with correct fields

Execution steps:
- The script opens the target company detail page.
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

### TC-COMP-013 | Tasks tab shows correct columns, New Task button, and empty state

Execution steps:
- The script opens the target company detail page.
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

### TC-COMP-014 | Create New Task drawer opens with all required fields

Execution steps:
- The script opens the target company detail page.
- It opens the `Tasks` tab.
- It clicks the `New Task` button.
- It waits for the `Create New Task` drawer to open.
- It verifies the `Task Title` field.
- It verifies the description editor.
- It verifies the `Select Type` control.
- It verifies the `Select Priority` control.
- It verifies the `Save` button.
- It verifies the `Cancel` button.
- It closes the drawer.

Expected result:
- The Create Task drawer opens correctly.
- All required task fields are visible.

### TC-COMP-015 | Edit Company form opens with pre-filled data and Update button is disabled without changes

Execution steps:
- The script opens the target company detail page.
- It clicks the `Edit` button.
- It waits for the `Edit Company` drawer to open.
- It verifies that editable fields are already filled with existing data.
- It verifies the presence of `Sub Market Vertical`, `NAICS Codes`, `Revenue`, and `Year Founded` fields.
- It verifies that the `Update Company` button is disabled before any modification.
- It clicks `Cancel`.
- It verifies that the edit drawer closes.

Expected result:
- The Edit Company drawer opens correctly.
- Existing company data is pre-filled.
- `Update Company` remains disabled until a change is made.

## Reusable Notes And Tasks CRUD Coverage

After `TC-COMP-015`, the company suite registers the reusable Notes and Tasks smoke suite for a newly created company detail page. If no created company exists yet, the suite creates one dynamically with the fixed Omaha address before helper coverage begins.

### Company Notes coverage

- `NT-Company-N001`: Notes tab is visible and clickable.
- `NT-Company-N002`: Notes empty state or existing notes list is visible.
- `NT-Company-N003`: `Add Notes` drawer shows all required fields.
- `NT-Company-N004`: User can create a note successfully and the note appears in the list.
- `NT-Company-N005`: Validation holds when Subject is empty.
- `NT-Company-N006`: Cancel Create Note closes the drawer without saving.
- `NT-Company-N007`: Character counter updates while typing description.
- `NT-Company-N008`: Edit Note drawer opens with existing values pre-filled.
- `NT-Company-N009`: User can edit note subject and save successfully.
- `NT-Company-N010`: Cancel Edit Note keeps the original note unchanged.
- `NT-Company-N011`: Delete Note confirmation dialog opens correctly.
- `NT-Company-N012`: Cancel Delete Note keeps the note in the list.
- `NT-Company-N013`: Confirm Delete Note removes the note from the list.

### Company Tasks coverage

- `NT-Company-T001`: Tasks tab is visible and clickable.
- `NT-Company-T002`: Tasks tab shows all expected table columns.
- `NT-Company-T003`: Tasks empty state or existing task rows are visible.
- `NT-Company-T004`: `Create New Task` drawer shows all required fields.
- `NT-Company-T005`: Task Type dropdown shows `To-do`, `Email`, `Call`, and `LinkedIn`.
- `NT-Company-T006`: Task Priority dropdown shows `High`, `Medium`, and `Low`.
- `NT-Company-T007`: User can create a task successfully and it appears in the table.
- `NT-Company-T008`: Cancel Create Task closes the drawer without saving.
- `NT-Company-T009`: Validation holds when Task Title is empty.
- `NT-Company-T010`: Task search filters the table by title.
- `NT-Company-T011`: Non-matching task search shows empty state.
- `NT-Company-T012`: Edit Task drawer opens with pre-filled data.
- `NT-Company-T013`: User can edit task title and save successfully.
- `NT-Company-T014`: Cancel Edit Task keeps the original task unchanged.
- `NT-Company-T015`: Task can be marked complete via checkbox.
- `NT-Company-T016`: Completed task can be unchecked and returned to pending state.
- `NT-Company-T017`: Delete Task confirmation dialog opens correctly.
- `NT-Company-T018`: Cancel Delete Task keeps the task in the table.
- `NT-Company-T019`: Confirm Delete Task removes the task from the table.

### Cross-tab coverage

- `NT-Company-X001`: Switching between Notes and Tasks tabs works correctly.
- `NT-Company-X002`: A newly created note and a newly created task both persist in the same session.

## Page Object Summary

The page object in [company-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/company-module.js) handles:

- Companies page navigation
- Company table and search assertions
- Market Vertical filter validation
- Create Company modal open, fill, submit, cancel, and disabled-state checks
- Company detail opening and sidebar validation
- Activities tab and company creation activity validation
- Notes and Tasks tab entry helpers
- Edit Company drawer open, fill, submit, cancel, and detail assertions

## Recommended Execution Commands

Full Company suite:

```bash
npx playwright test tests/e2e/company-module.spec.js --project=chrome
```

Headed mode:

```bash
HEADLESS=false npx playwright test tests/e2e/company-module.spec.js --project=chrome
```

Single case example:

```bash
HEADLESS=false npx playwright test tests/e2e/company-module.spec.js --project=chrome --grep "TC-COMP-015"
```

Single reusable Notes/Tasks example:

```bash
HEADLESS=false npx playwright test tests/e2e/company-module.spec.js --project=chrome --grep "NT-Company-T007"
```

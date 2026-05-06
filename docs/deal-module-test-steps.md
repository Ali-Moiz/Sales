# Deal Module Test Cases

This document explains the Deal Module test flow in simple NLP-style language.
It is based on:

- [deal-module.spec.js](../../tests/e2e/deal-module.spec.js)
- [deal-module.js](../../pages/deal-module.js)
- [register-notes-tasks-suite.js](../../tests/helpers/register-notes-tasks-suite.js)

## Execution Model

- The suite logs in only one time in `beforeAll`.
- All deal test cases run in the same browser session.
- The suite is serial, so later cases depend on the deal created earlier.
- Before every test case, the script opens the Deals listing page again.
- A deal is created once in `TC-DEAL-003`.
- The same created deal is reused in search, detail, edit, notes, and tasks flows.
- When the deal name is edited in `TC-DEAL-027`, the updated name becomes the new shared reference for all later cases.

## Dependency Resolution Flow

- The suite first tries to use an already known property name from runtime state or environment variables.
- It also resolves the company linked with that property from runtime state or falls back to a standalone company.
- Before creating a deal, the suite validates that both resolved company and resolved property are selectable in the Create Deal drawer.
- If that company-property pair is not valid, the suite creates a brand-new property dynamically under the resolved company.
- The newly created property name and its company are stored in `.tmp/shared-run-state.json`.
- The suite then returns to Deals and continues the deal creation flow with the corrected dependency pair.

## Dynamic Test Data

- Deal name format: `PAT ####`
- Edited deal name format: `PAT Edited ####`
- Runtime state file: `.tmp/shared-run-state.json`
- The created deal name is also stored in runtime state for downstream suites.

---

## Describe: Deal Creation Workflow

> Tests in this group cover the end-to-end Create Deal drawer flow.

### 1. TC-DEAL-001 | Verify that Create Deal modal opens successfully

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

### 2. TC-DEAL-002 | Verify that mandatory field validation works correctly

Preconditions:

- User is logged in and on the Deals listing page.
- No prior deal creation state is needed.

Execution steps:

- The script clicks the list-page `Create Deal` button.
- It waits for the Create Deal drawer to open.
- It does NOT fill in any fields (Deal Name, Company, Property, Deal Owner are all left empty).
- Pipeline and Mapping Stage have default values so they are not empty.
- It clicks the drawer-level `Create Deal` submit button.
- It waits for validation messages to appear.

Expected results / Assertion points:

- After clicking submit: The Create Deal drawer heading remains visible (drawer is NOT dismissed).
- After clicking submit: The validation message `Deal Name is required.` is visible below the Deal Name field.
- After clicking submit: The validation message `Company is required.` is visible below the Company dropdown.
- After clicking submit: The validation message `Property Name is required.` is visible below the Property dropdown.
- After clicking submit: The validation message `Deal Owner is required.` is visible below the Deal Owner dropdown.
- After clicking submit: The success toast `Deal has been created` is NOT visible (no deal was created).

### 3. TC-DEAL-003 | Verify that deal is created with valid inputs

Execution steps:

- The script generates a unique deal name in the format `PAT ####`.
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

### 4. TC-DEAL-004 | Verify that newly created deal appears in listing

Execution steps:

- The script searches the created deal name on the Deals listing page.
- It waits for the search state to update.
- It verifies that the created deal appears in the results.
- It clears the search.

Expected result:

- The created deal is searchable from the Deals list.

### 5. TC-DEAL-005 | Verify that Company dropdown searches and shows matching results

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

### 6. TC-DEAL-006 | Verify that Property dropdown searches and shows matching results

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

### 7. TC-DEAL-007 | Verify that Cancel Create Deal closes drawer without creating a record

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

---

## Describe: Deals Dashboard & Listing

> Tests in this group cover the Deals listing page, filters, sorting, and search.

### 8. TC-DEAL-008 | Verify that Deals dashboard loads correctly

Execution steps:

- The script opens the Deals module from the sidebar.
- It waits for the page load to settle.
- It verifies that the URL contains `/app/sales/deals`.
- It checks that the `Create Deal` button is visible.

Expected result:

- The Deals listing page opens successfully.
- The `Create Deal` button is visible.

### 9. TC-DEAL-009 | Verify that Deals charts render correct data

**Preconditions:** User is logged in and on the Deals listing page.

**Steps:**

1. Observe the charts section above the deals table.
2. Check for the "Deals Breakdown by Verticals" chart heading (h6).
3. Check for the "Total Deals" value heading (h1) containing a numeric count.
4. Check for the "Total Deal Amount" chart heading (h6).
5. Check for the "Deals Won vs Lost" chart heading (h6).
6. Verify each chart has a rendered image element (SVG chart).

**Expected results / Assertion points:**

- After step 2: The heading "Deals Breakdown by Verticals" (level 6) is visible.
- After step 3: An h1 heading containing "Total Deals" is visible and includes a numeric value.
- After step 4: The heading "Total Deal Amount" (level 6) is visible.
- After step 5: The heading "Deals Won vs Lost" (level 6) is visible.
- After step 6: At least one chart image element is present in each chart container.

### 10. TC-DEAL-010 | Verify that total deal amount displays correctly

**Preconditions:** User is logged in and on the Deals listing page.

**Steps:**

1. Observe the "Total Deal Amount" chart section.
2. Read the h1 heading value (e.g., "$ 127.74M").
3. Verify the value starts with "$" and contains a numeric amount.

**Expected results / Assertion points:**

- After step 1: The heading "Total Deal Amount" (level 6) is visible.
- After step 2: The h1 value heading is visible and not empty.
- After step 3: The displayed value matches the pattern `$ [number]` (contains "$" followed by a numeric string).

### 11. TC-DEAL-011 | Verify that search by Deal Name works correctly

**Preconditions:** User is logged in and on the Deals listing page with existing deals.

**Steps:**

1. Read the name of the first deal visible in the table (e.g., "Test09").
2. Type that deal name into the search box ("ID, Deal").
3. Press Enter or wait for search to apply.
4. Observe the filtered table results.
5. Clear the search box and wait for the full list to reload.

**Expected results / Assertion points:**

- After step 3: The pagination text updates to show a filtered count (different from initial "1-10 of 8970").
- After step 4: At least one row in the table body contains the searched deal name.
- After step 5: The pagination text returns to the original unfiltered count.

### 12. TC-DEAL-012 | Verify that All Deals filter shows all records

**Preconditions:** User is logged in and on the Deals listing page.

**Steps:**

1. Record the current pagination text (e.g., "1-10 of 8970").
2. Click the "All Deals" filter dropdown heading (h6).
3. In the tooltip that opens, select the "Assigned" option to change the filter.
4. Wait for the table to reload with the filtered data.
5. Click the filter dropdown again and select "All Deals" to reset.
6. Wait for the table to reload.
7. Read the pagination text again.

**Expected results / Assertion points:**

- After step 3: The tooltip containing "All Deals", "Assigned", "Unassigned" is visible.
- After step 4: The table reloads and shows only assigned deals (pagination count changes).
- After step 7: The pagination text matches or exceeds the initial total count, confirming all records are shown again.

### 13. TC-DEAL-013 | Verify that Assigned filter shows assigned deals only

**Preconditions:** User is logged in and on the Deals listing page.

**Steps:**

1. Record the initial pagination total (e.g., 8970).
2. Click the "All Deals" filter dropdown heading.
3. Select "Assigned" from the tooltip options.
4. Wait for the table to reload.
5. Read the new pagination text.
6. Check that the Deal Owner column for visible rows is not empty / not "N/A".
7. Reset the filter back to "All Deals".

**Expected results / Assertion points:**

- After step 3: The filter heading text changes to "Assigned".
- After step 5: The pagination total is less than or equal to the initial total.
- After step 6: At least one visible row has a non-empty Deal Owner value.
- After step 7: The filter heading returns to "All Deals".

### 14. TC-DEAL-014 | Verify that Unassigned filter shows unassigned deals only

**Preconditions:** User is logged in and on the Deals listing page.

**Steps:**

1. Record the initial pagination total.
2. Click the "All Deals" filter dropdown heading.
3. Select "Unassigned" from the tooltip options.
4. Wait for the table to reload.
5. Read the new pagination text.
6. Reset the filter back to "All Deals".

**Expected results / Assertion points:**

- After step 3: The filter heading text changes to "Unassigned".
- After step 5: The pagination total is less than or equal to the initial total.
- After step 5: The pagination text is visible and shows a valid count format.
- After step 6: The filter heading returns to "All Deals".

### 15. TC-DEAL-015 | Verify that multiple filters work together

**Preconditions:** User is logged in and on the Deals listing page.

**Steps:**

1. Record the initial pagination total.
2. Click the "More Filters" button.
3. Wait for the "All Filters" drawer (h3 heading) to open.
4. Select a Deal Type filter (e.g., click "Select Deal Type" and choose "New").
5. Select a Stages filter (e.g., click "Select Stages" and choose "Proposal Creation").
6. Click "Apply Filters".
7. Wait for the table to reload with the combined filter results.
8. Read the new pagination text.
9. Click "More Filters" again to verify the applied filters are still shown.

**Expected results / Assertion points:**

- After step 3: The "All Filters" heading (level 3) is visible.
- After step 6: The "Apply Filters" button is enabled (not disabled) after selecting filters.
- After step 8: The pagination total is less than the initial total, confirming filters reduced the result set.
- After step 9: The previously selected filter values are still reflected in the filter drawer.

### 16. TC-DEAL-016 | Verify that Clear All resets applied filters

**Preconditions:** User is logged in and on the Deals listing page with active filters applied from TC-DEAL-015 or a prior filter action.

**Steps:**

1. Ensure at least one filter is active (pagination shows a filtered count).
2. Click the "More Filters" button.
3. Wait for the "All Filters" drawer to open.
4. Click the "Clear All" button.
5. Click "Apply Filters" (or observe that the drawer closes / filters reset).
6. Wait for the table to reload.
7. Read the pagination text.

**Expected results / Assertion points:**

- After step 2: The "All Filters" drawer heading is visible.
- After step 4: The "Clear All" button is clickable (enabled).
- After step 7: The pagination total returns to the full unfiltered count (matching the initial "All Deals" total).

### 17. TC-DEAL-017 | Verify that deal listing columns show correct values

Execution steps:

- The script stays on the Deals listing page.
- It checks the table headers one by one.
- It verifies `Deal Name`, `Amount`, `Deal Owner`, `Stage`, `Deal Type`, `Property`, `Address`, `Created Date`, and `Last Modified Date`.

Expected result:

- All required deal table headers are visible.

### 18. TC-DEAL-018 | Verify that sorting works on Deal Name

**Preconditions:** User is logged in and on the Deals listing page with multiple deals visible.

**Steps:**

1. Read the Deal Name of the first visible row in the table.
2. Click the "Deal Name" sort button in the column header.
3. Wait for the table to reload / re-sort.
4. Read the Deal Name of the first visible row after sorting.
5. Click the "Deal Name" sort button again to reverse the sort order.
6. Wait for the table to reload.
7. Read the Deal Name of the first visible row after the second sort.

**Expected results / Assertion points:**

- After step 2: The "Deal Name" sort button is clickable.
- After step 4: The first row's Deal Name has changed from the initial value (sort was applied).
- After step 7: The first row's Deal Name has changed again from step 4 (reverse sort was applied).

### 19. TC-DEAL-019 | Verify that sorting works on deal listing grid

**Preconditions:** User is logged in and on the Deals listing page with multiple deals visible.

**Steps:**

1. Identify sortable columns: Deal Name, Amount, Stage, Deal Type, Renewal / End Date, Created Date, Last Activity, Last Modified Date.
2. For each sortable column, click the column header sort button.
3. Wait for the table to reload after each sort click.
4. Verify that the sort button is interactive (clickable) and the table data reloads.

**Expected results / Assertion points:**

- After step 2: Each sortable column header button is visible and clickable.
- After step 3: The table re-renders after each sort action (pagination text remains valid).
- After step 4: At least one column sort changes the order of the first visible row's data.

### 20. TC-DEAL-020 | Verify that pagination works correctly

Execution steps:

- The script reads the pagination section below the deal table.
- It verifies that the text matches the format `X-Y of Z`.

Expected result:

- Pagination is visible.
- The pagination text follows the expected numeric format.

### 21. TC-DEAL-021 | Verify that bulk assignment works correctly

**Preconditions:** User is logged in and on the Deals listing page with at least one deal visible.

**Steps:**

1. Verify the "Bulk Assignment" button is initially disabled.
2. Click the checkbox on the first data row in the table.
3. Observe that the "Bulk Assignment" button becomes enabled.
4. Click the checkbox on a second data row.
5. Verify the "Bulk Assignment" button is still enabled.
6. Uncheck both row checkboxes.
7. Verify the "Bulk Assignment" button returns to disabled state.

**Expected results / Assertion points:**

- After step 1: The "Bulk Assignment" button is visible and disabled.
- After step 2: The first row's checkbox is checked.
- After step 3: The "Bulk Assignment" button becomes enabled (not disabled).
- After step 6: Both row checkboxes are unchecked.
- After step 7: The "Bulk Assignment" button is disabled again.

### 22. TC-DEAL-022 | Verify that searching with a non-existent deal name returns no results

Execution steps:

- The script enters a random non-existent deal name in the list search field.
- It waits for the search state to update.
- It verifies that the result state becomes empty or zero-results.
- It clears the search field.

Expected result:

- No deal records are returned for the invalid search term.
- The search state shows no matching deal.

---

## Describe: Deal Details & Management

> Tests in this group cover opening, viewing, and editing deal detail pages.

### 23. TC-DEAL-023 | Verify that Deal Details page opens correctly

Execution steps:

- The script searches the created deal name.
- It waits for the matching row.
- It clicks the deal row.
- It waits for the detail page to load.
- It verifies that the deal detail heading matches the created deal name.

Expected result:

- The deal detail page opens successfully for the created deal.

### 24. TC-DEAL-024 | Verify that deal overview data is accurate

> Not yet automated.

### 25. TC-DEAL-025 | Verify that stage update persists after refresh

> Not yet automated.

### 26. TC-DEAL-026 | Verify that proposal creation starts successfully

> Not yet automated.

### 27. TC-DEAL-027 | Verify that deal can be edited successfully

Execution steps:

- The script generates a unique edited deal name in the format `PAT Edited ####`.
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

### 28. TC-DEAL-028 | Verify that closing deal as Won updates status

> Not yet automated.

### 29. TC-DEAL-029 | Verify that closing deal as Lost updates status

> Not yet automated.

### 30. TC-DEAL-030 | Verify that closed deals are handled correctly

> Not yet automated.

### 31. TC-DEAL-031 | Verify that Deal detail page shows all sidebar sections

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

### 32. TC-DEAL-032 | Verify that Deal detail page shows the stages bar and all overview tabs

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

### 33. TC-DEAL-033 | Verify that Edit Deal form opens pre-filled and Save remains disabled without changes

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

### 34. TC-DEAL-034 | Verify that Cancel Edit Deal closes drawer without saving changes

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

### 35. TC-DEAL-035 | Verify that permissions restrict unauthorized actions

> Not yet automated.

### 36. TC-DEAL-036 | Verify that UI remains responsive under load

> Not yet automated.

---

## Describe: Activities & Logs

> Tests in this group cover the Activities tab on deal detail pages.

### 37. TC-DEAL-037 | Verify that activities logs load for different record types

> Not yet automated.

### 38. TC-DEAL-038 | Verify that note log title uses creator username

> Not yet automated.

### 39. TC-DEAL-039 | Verify that note HTML formatting: bullets/links

> Not yet automated.

### 40. TC-DEAL-040 | Verify that note long text truncation + See more/less

> Not yet automated.

### 41. TC-DEAL-041 | Verify that note update reflects new content + user + timestamp

> Not yet automated.

### 42. TC-DEAL-042 | Verify that task log title uses creator username

> Not yet automated.

### 43. TC-DEAL-043 | Verify that task fields render: title/type/priority/description

> Not yet automated.

### 44. TC-DEAL-044 | Verify that task missing type shows N/A

> Not yet automated.

### 45. TC-DEAL-045 | Verify that task missing priority shows N/A

> Not yet automated.

### 46. TC-DEAL-046 | Verify that task long description truncation + toggle

> Not yet automated.

### 47. TC-DEAL-047 | Verify that task update reflects new content + updater + timestamp

> Not yet automated.

### 48. TC-DEAL-048 | Verify that permissions: unauthorized user cannot see logs

> Not yet automated.

### 49. TC-DEAL-049 | Verify that performance: large number of logs

> Not yet automated.

### 50. TC-DEAL-050 | Verify that Activities tab loads with at least one dated entry

Execution steps:

- The script opens the created deal detail page.
- It clicks the `Activities` tab.
- It verifies that the tab becomes active through `aria-selected="true"`.
- It checks for at least one date-grouped activity heading in the format `Month, YYYY`.

Expected result:

- The Activities tab opens successfully.
- At least one dated activity group is visible.

---

## Describe: Notes Management

> Tests in this group cover Notes tab functionality on deal detail pages.

### 51. TC-DEAL-051 | Verify that Subject field is mandatory while creating a note

> Not yet automated.

### 52. TC-DEAL-052 | Verify that system shows validation error when Subject is empty

> Not yet automated.

### 53. TC-DEAL-053 | Verify that system shows validation error when Description is empty

> Not yet automated.

### 54. TC-DEAL-054 | Verify that note count updates after adding a note

> Not yet automated.

### 55. TC-DEAL-055 | Verify that edited note shows updated content in listing

> Not yet automated.

### 56. TC-DEAL-056 | Verify that delete confirmation modal appears before deleting note

> Not yet automated.

### 57. TC-DEAL-057 | Verify that note is not deleted when cancel is clicked on confirmation modal

> Not yet automated.

### 58. TC-DEAL-058 | Verify that empty state is shown again after deleting last note

> Not yet automated.

### 59. TC-DEAL-059 | Verify that user cannot save note when required fields are missing

> Not yet automated.

### 60. TC-DEAL-060 | Verify that Notes tab is visible and Create New Note drawer opens with correct fields

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

### Reusable Notes CRUD Coverage (via registerNotesTasksSuite)

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

---

## Describe: Tasks Management

> Tests in this group cover Tasks tab functionality on deal detail pages.

### 61. TC-DEAL-061 | Verify that Task Title field is mandatory while creating a task

> Not yet automated.

### 62. TC-DEAL-062 | Verify that Task Description field is mandatory while creating a task

> Not yet automated.

### 63. TC-DEAL-063 | Verify that Type field is mandatory while creating a task

> Not yet automated.

### 64. TC-DEAL-064 | Verify that Priority field is mandatory while creating a task

> Not yet automated.

### 65. TC-DEAL-065 | Verify that Due Date field is mandatory while creating a task

> Not yet automated.

### 66. TC-DEAL-066 | Verify that system shows validation error when required fields are missing

> Not yet automated.

### 67. TC-DEAL-067 | Verify that user can filter tasks by Type

> Not yet automated.

### 68. TC-DEAL-068 | Verify that user can filter tasks by Priority

> Not yet automated.

### 69. TC-DEAL-069 | Verify that user can filter tasks by Status

> Not yet automated.

### 70. TC-DEAL-070 | Verify that user can filter tasks by Due Date range

> Not yet automated.

### 71. TC-DEAL-071 | Verify that user can search tasks using Search by Title

> Not yet automated.

### 72. TC-DEAL-072 | Verify that user can edit an existing task

> Not yet automated.

### 73. TC-DEAL-073 | Verify that edited task details are updated in listing

> Not yet automated.

### 74. TC-DEAL-074 | Verify that user can delete a task after confirmation

> Not yet automated.

### 75. TC-DEAL-075 | Verify that task is not deleted when delete action is cancelled

> Not yet automated.

### 76. TC-DEAL-076 | Verify that completed task is shown under Completed status filter

> Not yet automated.

### 77. TC-DEAL-077 | Verify that unchecking completed checkbox marks task as To-Do again

> Not yet automated.

### 78. TC-DEAL-078 | Verify that pagination works correctly in task listing

> Not yet automated.

### 79. TC-DEAL-079 | Verify that tasks are sorted correctly by Due Date

> Not yet automated.

### 80. TC-DEAL-080 | Verify that Tasks tab shows expected columns and New Task button

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

### 81. TC-DEAL-081 | Verify that Create New Task drawer opens with all required fields

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

### Reusable Tasks CRUD Coverage (via registerNotesTasksSuite)

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

---

## Page Object Summary

The page object in [deal-module.js](../../pages/deal-module.js) handles:

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
HEADLESS=false npx playwright test tests/e2e/deal-module.spec.js --project=chrome --grep "TC-DEAL-027"
```

Single reusable Notes/Tasks example:

```bash
HEADLESS=false npx playwright test tests/e2e/deal-module.spec.js --project=chrome --grep "NT-Deal-T007"
```

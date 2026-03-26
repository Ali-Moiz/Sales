# Deal Module Test Cases

This document explains the Deal Module test cases in simple NLP-style language.
It is based on:

- [deal-module.spec.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/tests/e2e/deal-module.spec.js)
- [deal-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/deal-module.js)

## Execution Model

- The suite logs in only one time in `beforeAll`.
- All deal test cases run in the same browser session.
- Before every test case, the script opens the Deals page again.
- A deal is created once in `TC-DEAL-002`.
- The same created deal is reused in the downstream detail/search cases.

## Dynamic Test Data

- Deal name format: `A-D ####`
- Company used for standalone runs: `Regression Phase 2`
- Property used for standalone runs: `Regression Location Phase 2`
- The created deal name is stored in runtime state and reused in later cases.

## Test Cases

### TC-DEAL-001 | Deals module opens successfully

Execution steps:
- The script opens the Deals module from the left sidebar.
- It waits for the Deals page to load completely.
- It checks that the URL contains the Deals route.
- It verifies that the `Create Deal` button is visible.

Expected result:
- The Deals page opens successfully.
- The user can see the `Create Deal` button.

### TC-DEAL-002 | User can create a deal successfully

Execution steps:
- The script generates a unique deal name in the format `A-D ####`.
- It opens the `Create Deal` drawer.
- It enters the generated deal name.
- It opens the Company dropdown.
- It searches the target company.
- It selects the matching company result.
- It waits for 2 seconds so the property dependency can load.
- It opens the Property dropdown.
- It searches the target property.
- It selects the matching property result.
- It clicks the `Create Deal` button.
- It waits for the success toast.

Expected result:
- A new deal is created successfully.
- The text `Deal has been created` becomes visible.

### TC-DEAL-003 | Deals table displays all expected column headers

Execution steps:
- The script stays on the Deals listing page.
- It checks the table headers one by one.
- It verifies headers such as Deal Name, Amount, Deal Owner, Stage, Deal Type, Property, Address, Created Date, and Last Modified Date.

Expected result:
- All required deal table headers are visible.

### TC-DEAL-004 | Pagination is visible with correct format

Execution steps:
- The script looks at the pagination area below the deal table.
- It reads the pagination text.
- It verifies that the format matches `X–Y of Z`.

Expected result:
- Pagination is visible.
- The pagination text follows the expected numeric format.

### TC-DEAL-005 | Create Deal drawer opens with all required fields

Execution steps:
- The script clicks the `Create Deal` button.
- It waits for the drawer heading to appear.
- It checks the presence of the Deal Name field.
- It checks the presence of the Company selector.
- It checks the presence of the Property selector.
- It checks the presence of the Cancel button.

Expected result:
- The `Create Deal` drawer opens correctly.
- All required fields are visible.

### TC-DEAL-006 | Company dropdown searches and shows matching results

Execution steps:
- The script opens the `Create Deal` drawer.
- It clicks the Company selector.
- It waits for the tooltip dropdown to appear.
- It enters the target company name in the search field.
- It waits for the results to load.
- It verifies that at least one matching company result is shown.
- It closes the dropdown.

Expected result:
- The Company search works correctly.
- The matching company result becomes visible.

### TC-DEAL-007 | Property dropdown searches and shows matching results

Execution steps:
- The script opens the `Create Deal` drawer.
- It first selects the target company because the property list depends on company selection.
- It waits for the property dropdown to become usable.
- It clicks the Property selector.
- It enters the target property name in the search field.
- It waits for the results to load.
- It verifies that a matching property result is visible.
- It closes the dropdown.

Expected result:
- The Property search works correctly.
- The matching property result becomes visible.

### TC-DEAL-008 | Cancel Create Deal closes drawer without creating record

Execution steps:
- The script opens the `Create Deal` drawer.
- It enters a temporary deal name.
- It clicks the `Cancel` button.
- It verifies that the drawer closes.

Expected result:
- The drawer closes successfully.
- No new deal is created.

### TC-DEAL-009 | Created deal linked to dynamic company and property is searchable

Execution steps:
- The script searches the created deal name on the Deals listing page.
- It waits for the matching result to appear.
- It verifies that the created deal is visible in the search results.
- It clears the search.

Expected result:
- The created deal is searchable from the Deals list.

### TC-DEAL-010 | User can search and open an existing deal

Execution steps:
- The script enters the created deal name in the deal search box.
- It waits for the matching row.
- It clicks the deal row.
- It waits for the detail page to open.
- It verifies that the deal detail heading matches the created deal name.

Expected result:
- The deal detail page opens successfully for the created deal.

### TC-DEAL-011 | Deal detail page shows all sidebar sections

Execution steps:
- The script opens the created deal detail page.
- It verifies that the sidebar sections are visible.
- It checks `About this Deal`.
- It checks `Company`.
- It checks `Property Details`.
- It checks `Contact`.
- It checks `Franchise Associated`.
- It checks `Attachments`.

Expected result:
- All major sidebar sections are visible on the deal detail page.

### TC-DEAL-012 | Deal detail page shows stages bar and all overview tabs

Execution steps:
- The script opens the created deal detail page.
- It checks that the `Deal Stages` heading is visible.
- It verifies that the `Proposal Creation` stage is visible.
- It verifies that the overview tabs are visible.
- It checks `Contract & Terms`.
- It checks `Activities`.
- It checks `Notes`.
- It checks `Tasks`.

Expected result:
- The stages bar is visible.
- All overview tabs are visible.

### TC-DEAL-013 | Activities tab loads with at least one dated entry

Execution steps:
- The script opens the created deal detail page.
- It clicks the `Activities` tab.
- It verifies that the tab becomes active.
- It checks for at least one date-grouped activity heading such as `March, 2026`.

Expected result:
- The Activities tab opens successfully.
- At least one dated activity section is visible.

### TC-DEAL-014 | Notes tab visible; Create New Note drawer opens with correct fields

Execution steps:
- The script opens the created deal detail page.
- It clicks the `Notes` tab.
- It verifies that the `Create New Note` button is visible.
- It clicks `Create New Note`.
- It waits for the `Add Notes` drawer to open.
- It checks the Subject field.
- It checks the rich text editor.
- It checks the character counter.
- It checks the Save button.
- It checks the Cancel button.
- It closes the drawer.

Expected result:
- The Notes drawer opens with all expected fields.
- The drawer can be closed successfully.

### TC-DEAL-015 | Tasks tab shows correct columns and New Task button

Execution steps:
- The script opens the created deal detail page.
- It clicks the `Tasks` tab.
- It checks that the tab is visible.
- It verifies the task table columns.
- It checks Task Title.
- It checks Task Description.
- It checks Created By.
- It checks Due Date.
- It checks Priority.
- It checks Type.
- It verifies that the `New Task` button is visible.

Expected result:
- The Tasks tab loads correctly.
- All expected task columns are visible.
- The `New Task` button is visible.

### TC-DEAL-016 | Create New Task drawer opens with all required fields

Execution steps:
- The script opens the created deal detail page.
- It navigates to the `Tasks` tab.
- It clicks the `New Task` button.
- It waits for the `Create New Task` drawer to open.
- It checks the Task Title field.
- It checks the description editor.
- It checks the Type selector.
- It checks the Priority selector.
- It checks the Save button.
- It checks the Cancel button.
- It closes the drawer.

Expected result:
- The Create Task drawer opens correctly.
- All required task fields are visible.

### TC-DEAL-017 | Searching with non-existent deal name returns no results

Execution steps:
- The script enters a random non-existent deal name in the search field.
- It waits for the search results to update.
- It checks the pagination text.
- It verifies that the pagination shows `0–0 of 0`.
- It clears the search input.

Expected result:
- No deal records are returned for the invalid search term.
- Pagination shows `0–0 of 0`.

## Page Object Summary

The page object in [deal-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/deal-module.js) handles:

- Deals page navigation
- Deals table and pagination assertions
- Deal creation workflow
- Dynamic company/property dropdown selection
- Deal detail opening and validation
- Activities, Notes, and Tasks tab helpers
- Note drawer and task drawer assertions

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
HEADLESS=false npx playwright test tests/e2e/deal-module.spec.js --project=chrome --grep "TC-DEAL-010"
```

# Property Module Test Cases

This document explains the Property Module test cases in simple NLP-style language.
It is based on:

- [property-module.spec.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/tests/e2e/property-module.spec.js)
- [property-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/property-module.js)

## Execution Model

- The suite logs in only one time in `beforeAll`.
- All property test cases run in the same browser session.
- The suite is serial, so later test cases depend on earlier state.
- A property is created once in `TC-PROP-007`.
- The same created property is reused in the detail, edit, notes, and tasks cases.
- When the property name is updated in `TC-PROP-013`, the updated name becomes the new shared reference for the remaining cases.

## Dynamic Test Data

- Property name format: `S-P ####`
- Edited property name format: `S-P ####`
- Standalone fallback company: `Regression Phase`
- Create-property flow uses an Omaha address strategy to avoid duplicate-address failures.
- Duplicate-address negative case uses a known blocked address on purpose.

## Test Cases

### TC-PROP-001 | Properties module opens successfully

Execution steps:
- The script opens the Properties module from the sidebar.
- It waits for the Properties page to load.
- It checks that the URL contains the Properties route.
- It verifies that the `Create Property` button is visible.

Expected result:
- The Properties page opens successfully.
- The `Create Property` button is visible.

### TC-PROP-002 | Properties table displays all expected column headers

Execution steps:
- The script stays on the Properties listing page.
- It checks the table headers one by one.
- It verifies Property Name, Property Affiliation, Lot Number, Deal Count, Stage, Type, Created Date, and Last Modified Date.

Expected result:
- All required property table headers are visible.

### TC-PROP-003 | Pagination is visible with correct format

Execution steps:
- The script looks at the pagination section below the table.
- It reads the pagination text.
- It verifies that the text matches the format `X–Y of Z`.

Expected result:
- Pagination is visible.
- The pagination text follows the correct numeric format.

### TC-PROP-004 | Create Property drawer opens with all required fields

Execution steps:
- The script clicks the `Create Property` button.
- It waits for the drawer to open.
- It verifies the Company field.
- It verifies the Property Name field.
- It verifies the Property Source field.
- It verifies the Stage field.
- It verifies the Assignee field.
- It verifies the Address field.
- It verifies the Cancel button.

Expected result:
- The `Create Property` drawer opens successfully.
- All required fields are visible.

### TC-PROP-005 | Company dropdown searches and shows matching results

Execution steps:
- The script keeps the `Create Property` drawer open.
- It clicks the `Search Company` field.
- It waits for the tooltip dropdown.
- It enters the target company name in the search field.
- It waits for matching results to load.
- It verifies that a matching company result is visible.
- It closes the dropdown.

Expected result:
- The company search works correctly.
- A matching company result is shown.

### TC-PROP-006 | Cancel Create Property closes drawer without creating record

Execution steps:
- The script opens the `Create Property` drawer.
- It enters a temporary property name.
- It clicks the `Cancel` button.
- It verifies that the drawer closes.

Expected result:
- The drawer closes successfully.
- No new property is created.

### TC-PROP-007 | User can create a new property linked to existing company

Execution steps:
- The script generates a unique property name in the format `S-P ####`.
- It opens the Properties page.
- It opens the `Create Property` drawer.
- It selects the company.
- It fills the property name.
- It selects the property source.
- It selects the associated franchise.
- It selects the stage.
- It selects property affiliations.
- It selects the assignee.
- It selects the contact affiliation.
- It fills a unique Omaha address.
- It submits the form.
- It goes back to the Properties list.
- It searches the created property name.
- It verifies that the property is present in the results.

Expected result:
- A new property is created successfully.
- The created property is searchable from the list page.

### TC-PROP-008 | User can search and open an existing property

Execution steps:
- The script opens the Properties page.
- It searches the created property name.
- It clicks the matching property row.
- It waits for the detail page to open.
- It verifies that the property detail heading matches the created property name.

Expected result:
- The property detail page opens successfully for the created property.

### TC-PROP-009 | Property detail page shows all sidebar sections

Execution steps:
- The script stays on the created property detail page.
- It checks the left sidebar sections.
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
- It verifies visible stage buttons.
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
- The script clicks the `Activities` tab.
- It verifies that the Activities tab becomes active.
- It checks for at least one date-grouped activity entry, such as `March, 2026`.

Expected result:
- The Activities tab loads successfully.
- At least one dated activity entry is visible.

### TC-PROP-012 | Edit Property form opens pre-filled; Save disabled without changes

Execution steps:
- The script clicks the `Edit` button on the property detail page.
- It waits for the `Edit Property` drawer to open.
- It verifies that the Property Name field is already filled.
- It checks that the `Save` button is disabled before any change is made.
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
- It waits for the detail page to refresh.
- It verifies that the property detail heading shows the updated name.
- It updates the runtime reference so the remaining tests use the new property name.

Expected result:
- The property name is updated successfully.
- The updated name is visible on the detail page.

### TC-PROP-014 | Notes tab visible; Create New Note drawer opens correctly

Execution steps:
- The script opens the `Notes` tab on the property detail page.
- It checks that the `Create New Note` button is visible.
- It clicks `Create New Note`.
- It waits for the `Add Notes` drawer to open.
- It verifies the Subject field.
- It verifies the rich text editor.
- It verifies the character counter.
- It verifies the Save button.
- It verifies the Cancel button.
- It closes the drawer.

Expected result:
- The Notes drawer opens with all expected fields.
- The drawer closes successfully.

### TC-PROP-015 | Tasks tab shows correct columns and New Task button

Execution steps:
- The script opens the `Tasks` tab on the property detail page.
- It verifies that the tab is visible.
- It checks the task table columns.
- It verifies Task Title.
- It verifies Task Description.
- It verifies Created By.
- It verifies Due Date.
- It verifies Priority.
- It verifies Type.
- It verifies the `New Task` button.
- It checks the empty-state message for tasks.

Expected result:
- The Tasks tab loads correctly.
- All expected columns are visible.
- The `New Task` button is visible.
- The task empty state is visible.

### TC-PROP-016 | Create New Task drawer opens with all required fields

Execution steps:
- The script stays on the `Tasks` tab.
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

### TC-PROP-017 | Searching with non-existent name returns no results

Execution steps:
- The script opens the Properties list page.
- It types a random non-existent property name in the search box.
- It waits for the search results to update.
- It verifies that no matching results are returned.
- It checks that the pagination or table state indicates no records.
- It clears the search field.

Expected result:
- No property record is returned for the invalid search term.

### TC-PROP-018 | Duplicate address is rejected with geocoordinate error

Execution steps:
- The script opens the Properties list page.
- It opens the `Create Property` drawer.
- It generates a unique property name so only the address is treated as duplicate.
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
- It waits for the duplicate-address error toast.
- It verifies that the drawer stays open.
- It closes the drawer.
- It goes back to the Properties page.
- It searches the generated property name.
- It verifies that no property was created.

Expected result:
- The app rejects the duplicate geocoded address.
- The duplicate-address error message appears.
- No new property is created.

## Page Object Summary

The page object in [property-module.js](/Users/tk-lpt-1156/Desktop/Automations/SignalSalesAutomation/pages/property-module.js) handles:

- Properties page navigation
- Table and pagination assertions
- Create Property drawer workflow
- Company, source, stage, franchise, assignee, and contact selection
- Unique Omaha address generation strategy
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
HEADLESS=false npx playwright test tests/e2e/property-module.spec.js --project=chrome --grep "TC-PROP-013"
```

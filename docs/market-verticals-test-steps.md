# Market Verticals Module — Test Steps

## Describe: Create & Edit Question Workflow

### TC-MV-001 | Verify that Add Question form shows required fields (Question Statement, Answer Type, Market Verticals)

**Precondition:** User is logged in and on a Market Verticals detail page.

**Steps:**
1. Click the `Add Question` button.
2. Observe the create question form.

**Expected:**
- `Question Statement` text input is visible.
- `Answer Type` dropdown is visible.
- `Market Verticals` dropdown is visible.
- `Instructions` field is visible.
- `Required` toggle/checkbox is visible.
- `Save` and `Cancel` buttons are visible.

---

### TC-MV-002 | Verify that Save button is disabled or shows validation when required fields are empty

**Precondition:** User is on the Add Question form with all fields empty.

**Steps:**
1. Leave all fields empty.
2. Click the `Save` button.

**Expected:**
- Validation errors appear for required fields (Question Statement, Answer Type, Market Verticals).
- Question is NOT saved; user remains on the form.

---

### TC-MV-003 | Verify that Question Statement field does not allow saving blank/whitespace-only values

**Precondition:** User is on the Add Question form.

**Steps:**
1. Enter only whitespace (spaces) in the `Question Statement` field.
2. Fill other required fields with valid values.
3. Click `Save`.

**Expected:**
- Validation error appears for Question Statement.
- Question is NOT saved.

---

### TC-MV-004 | Verify that Instructions field is optional and can be left empty without validation error

**Precondition:** User is on the Add Question form.

**Steps:**
1. Fill `Question Statement` with a valid value.
2. Select an `Answer Type`.
3. Select at least one `Market Vertical`.
4. Leave `Instructions` field empty.
5. Add at least one option (if Answer Type requires options).
6. Click `Save`.

**Expected:**
- No validation error appears for Instructions.
- Question is saved successfully.

---

### TC-MV-005 | Verify that Answer Type dropdown contains options (Multiple Selection, Radio Buttons (Single Selection), DropDown)

**Precondition:** User is on the Add Question form.

**Steps:**
1. Click the `Answer Type` dropdown.
2. Observe the available options.

**Expected:**
- `Multiple Selection` option is visible.
- `Radio Buttons (Single Selection)` option is visible.
- `DropDown` option is visible.
- No other unexpected options are present.

---

### TC-MV-006 | Verify that Market Verticals dropdown supports multi-select of industries and shows selected items correctly

**Precondition:** User is on the Add Question form.

**Steps:**
1. Click the `Market Verticals` dropdown.
2. Select `Commercial`.
3. Select `Industrial`.
4. Close or click away from the dropdown.
5. Observe selected items.

**Expected:**
- Both `Commercial` and `Industrial` appear as selected chips/tags.
- Dropdown allows selecting multiple industries simultaneously.

---

### TC-MV-007 | Verify that Market Verticals dropdown search filters industries and allows selecting from filtered results

**Precondition:** User is on the Add Question form with Market Verticals dropdown open.

**Steps:**
1. Click the `Market Verticals` dropdown.
2. Type `Comm` in the dropdown search input.
3. Observe filtered results.
4. Select `Commercial` from filtered results.

**Expected:**
- Only `Commercial` (matching `Comm`) is visible in dropdown.
- Non-matching industries are hidden.
- Selecting from filtered results works correctly.

---

### TC-MV-008 | Verify that Required checkbox toggles the required status and persists after saving

**Precondition:** User is on the Add Question form.

**Steps:**
1. Fill all required fields with valid values.
2. Toggle the `Required` checkbox ON.
3. Save the question.
4. Open the saved question via Edit.
5. Observe the `Required` checkbox state.

**Expected:**
- Required checkbox is checked/ON after saving.
- The persisted state matches what was set before save.

---

### TC-MV-009 | Verify that Add option button adds an option input row and allows multiple options to be added

**Precondition:** User is on the Add Question form.

**Steps:**
1. Click the `Add option` button once.
2. Observe the new option row.
3. Click the `Add option` button again.
4. Observe a second option row.

**Expected:**
- Each click adds a new option row with `Option Label` input and points spinbutton.
- Multiple option rows can be added.

---

### TC-MV-010 | Verify that user cannot save a question with Answer Type requiring options when no options are added (if applicable)

**Precondition:** User is on the Add Question form.

**Steps:**
1. Fill `Question Statement` with a valid value.
2. Select `Multiple Selection` as Answer Type.
3. Select at least one Market Vertical.
4. Do NOT add any options.
5. Click `Save`.

**Expected:**
- Validation error appears indicating options are required.
- Question is NOT saved.
- (If app allows saving without options, document actual behavior.)

---

### TC-MV-011 | Verify that duplicate options are prevented or handled gracefully with validation (if rules exist)

**Precondition:** User is on the Add Question form with at least two option rows.

**Steps:**
1. Add two options.
2. Enter the same label (e.g., `Option A`) in both option rows.
3. Click `Save`.

**Expected:**
- If duplicate validation exists: error message appears, question is NOT saved.
- If no validation: document actual behavior (both options saved with same label).

---

### TC-MV-012 | Verify that clicking Cancel on Add/Edit form returns to previous page without saving changes

**Precondition:** User is on the Add Question form with some fields filled.

**Steps:**
1. Fill `Question Statement` with a value.
2. Click `Cancel`.
3. Observe the page navigation.
4. Check the questions list.

**Expected:**
- User navigates back to the questions list.
- The unsaved question does NOT appear in the list.

---

### TC-MV-013 | Verify that saving a new question shows success feedback and displays the question in the list

**Precondition:** User is on the Add Question form.

**Steps:**
1. Fill `Question Statement` with a unique value (e.g., `PAT Auto Test Question <timestamp>`).
2. Select `Multiple Selection` as Answer Type.
3. Select at least one Market Vertical.
4. Add at least one option with a label and points.
5. Click `Save`.
6. Observe feedback and questions list.

**Expected:**
- Success toast/notification appears.
- User navigates back to the questions list.
- The newly created question is visible in the list.

---

### TC-MV-014 | Verify that clicking Edit from the menu navigates to edit form with existing values prefilled

**Precondition:** A question exists in the questions list.

**Steps:**
1. Click the three-dot menu on a question row.
2. Click `Edit`.
3. Observe the edit form.

**Expected:**
- Edit form opens with the question's existing values prefilled.
- `Question Statement` input contains the current statement.
- `Answer Type`, `Market Verticals`, and options reflect current saved values.

---

### TC-MV-015 | Verify that editing a question updates Last Edited By and Last Edited On correctly after save

**Precondition:** A question exists in the questions list. User knows the current Last Edited By/On values.

**Steps:**
1. Click the three-dot menu on a question row.
2. Click `Edit`.
3. Modify the `Question Statement` (e.g., append ` - edited`).
4. Click `Save`.
5. Observe the questions list for the edited question.

**Expected:**
- `Last Edited By` updates to the current logged-in user's name.
- `Last Edited On` updates to today's date.
- The modified Question Statement is reflected in the list.

---

## Describe: Market Verticals & Industry Management

### TC-MV-016 | Verify that Market Verticals page shows a graceful error state when industries API fails

**Precondition:** User is logged in. Network interception is available (Playwright `route`).

**Steps:**
1. Intercept the industries API (`/api/*/industries*` or equivalent) and abort/return 500.
2. Navigate to the Market Verticals list page.
3. Observe the page state.

**Expected results / Assertion points:**
- After step 2: Page does not crash (no unhandled JS error overlay).
- After step 3: Either an error message/empty state is displayed, or the table renders with no rows. The page remains interactive (header, nav still visible).

---

### TC-MV-017 | Verify that Search by Industry supports partial matches and is case-insensitive

**Precondition:** User is logged in and on the Market Verticals list page. At least one industry (e.g., "Commercial") exists.

**Steps:**
1. Type `comm` (lowercase partial) in the "Search by Industry" input.
2. Observe the filtered table rows.
3. Clear the search and type `COMM` (uppercase).
4. Observe the filtered table rows again.

**Expected results / Assertion points:**
- After step 1: Only industries matching `comm` (e.g., "Commercial") appear in the table.
- After step 2: Non-matching industries (e.g., "Industrial", "Residential") are not visible.
- After step 4: Same results as step 1 — search is case-insensitive.

---

### TC-MV-018 | Verify that entering special characters in Search by Industry does not crash UI and returns valid results or none

**Precondition:** User is logged in and on the Market Verticals list page.

**Steps:**
1. Type `<script>alert(1)</script>` in the "Search by Industry" input.
2. Observe the page.
3. Clear the search and type `@#$%^&*`.
4. Observe the page.

**Expected results / Assertion points:**
- After step 1: No JS error overlay or crash. Table shows zero rows or an empty state.
- After step 3: No JS error overlay or crash. Table shows zero rows or an empty state.
- After step 4: Page remains functional; search input is clearable.

---

### TC-MV-019 | Verify that clearing Search by Industry resets the grid to default results

**Precondition:** User is logged in and on the Market Verticals list page with all industries visible.

**Steps:**
1. Note the number of industry rows displayed (default state).
2. Type `Comm` in the "Search by Industry" input to filter results.
3. Verify fewer rows are shown.
4. Clear the search input (select all + delete or click clear icon).
5. Observe the table.

**Expected results / Assertion points:**
- After step 2: Filtered rows appear (e.g., only "Commercial").
- After step 5: All original industry rows are restored. Row count matches the default count from step 1.

---

### TC-MV-020 | Verify that each industry row is clickable and opens the correct industry questions page

**Precondition:** User is logged in and on the Market Verticals list page.

**Steps:**
1. Click on the "Commercial" row in the industries table.
2. Observe the page navigation and content.

**Expected results / Assertion points:**
- After step 1: URL changes to `/marketVerticals/{id}/questions`.
- After step 2: The detail page heading (h1) shows "Commercial".
- After step 2: The "Add Question" button is visible on the right panel.
- After step 2: The left sidebar lists all industries with "Commercial" selected/highlighted.

---

### TC-MV-021 | Verify that industries with zero deals/companies display 0 values (not blank)

**Precondition:** User is logged in and on the Market Verticals list page. All industries are visible.

**Steps:**
1. Read the "No. of Deals" and "No. of Companies" cell values for each industry row.
2. Check if any values are blank or missing.

**Expected results / Assertion points:**
- After step 1: Every industry row has a numeric value (including `0`) in both "No. of Deals" and "No. of Companies" columns.
- After step 2: No cell is blank or contains only whitespace.

---

### TC-MV-022 | Verify that Synced From value displays correct source (e.g., HubSpot) and does not overflow UI

**Precondition:** User is logged in and on the Market Verticals list page.

**Steps:**
1. Read the "Synced From" cell value for the first industry row.
2. Verify the text content is a recognized source name (e.g., "HubSpot").
3. Check that the cell text is not truncated or overflowing.

**Expected results / Assertion points:**
- After step 1: "Synced From" cell is not empty.
- After step 2: Value is a non-empty string (e.g., "HubSpot").
- After step 3: Cell is visible and text does not overflow (element is within viewport bounds).

---

### TC-MV-023 | Verify that Last Synced On displays correct date format and handles missing dates as N/A

**Precondition:** User is logged in and on the Market Verticals list page.

**Steps:**
1. Read the "Last Synced On" cell values for all visible industry rows.
2. Verify each value matches date format `MM/DD/YYYY` or is `N/A`.

**Expected results / Assertion points:**
- After step 1: Each "Last Synced On" cell contains a non-empty value.
- After step 2: Each value matches the pattern `/^\d{2}\/\d{2}\/\d{4}$/` or equals `N/A`.

---

### TC-MV-024 | Verify that left panel lists all industries and displays No. of Companies for each industry

**Precondition:** User is logged in and on a Market Verticals detail page (e.g., Commercial).

**Steps:**
1. Observe the left sidebar panel.
2. Read all industry names and their "No. of Companies" values.

**Expected results / Assertion points:**
- After step 1: All known industries (Commercial, Distribution, Industrial, Manufacturing, Residential) appear in the sidebar.
- After step 2: Each industry button shows a "No. of Companies: {number}" label with a numeric value.

---

### TC-MV-025 | Verify that switching industry from left panel loads the questions for the newly selected industry

**Precondition:** User is logged in and on the Commercial detail page.

**Steps:**
1. Note the current heading is "Commercial".
2. Click "Distribution" in the left sidebar.
3. Observe the right panel content.

**Expected results / Assertion points:**
- After step 2: URL changes to include the Distribution industry ID.
- After step 3: The detail page heading (h1) updates to "Distribution".
- After step 3: The questions table reloads with Distribution-specific questions.

---

### TC-MV-026 | Verify that selected industry remains highlighted after page refresh (if deep link supports it)

**Precondition:** User is logged in and on a Market Verticals detail page.

**Steps:**
1. Click "Industrial" in the left sidebar.
2. Note the URL.
3. Reload the page (F5 or `page.reload()`).
4. Observe the left sidebar and heading.

**Expected results / Assertion points:**
- After step 3: The page reloads to the same URL.
- After step 4: The heading (h1) still shows "Industrial".
- After step 4: The "Industrial" button in the sidebar is still the active/selected item.

---

### TC-MV-027 | Verify that Search in left panel filters industries list correctly

**Precondition:** User is logged in and on a Market Verticals detail page.

**Steps:**
1. Type `Dist` in the left sidebar search input.
2. Observe the sidebar list.

**Expected results / Assertion points:**
- After step 1: Only industries matching `Dist` (e.g., "Distribution") remain visible in the sidebar.
- After step 2: Non-matching industries (e.g., "Commercial", "Residential") are hidden.

---

### TC-MV-028 | Verify that clearing left-panel Search restores the full industries list

**Precondition:** User is logged in and on a Market Verticals detail page with a search term entered in the sidebar.

**Steps:**
1. Type `Dist` in the sidebar search input (to filter).
2. Verify only matching industries appear.
3. Clear the sidebar search input.
4. Observe the sidebar list.

**Expected results / Assertion points:**
- After step 2: Filtered results shown (e.g., only "Distribution").
- After step 4: All industries are restored in the sidebar list.

---

### TC-MV-029 | Verify that deep link to an industry questions page loads correctly when opened in a new tab

**Precondition:** User is logged in. A valid industry detail URL is known (e.g., `/app/sales/marketVerticals/84550/questions`).

**Steps:**
1. Navigate directly to an industry questions URL (e.g., the Commercial industry URL obtained from a prior click).
2. Observe the page content.

**Expected results / Assertion points:**
- After step 1: Page loads without errors; URL matches the expected pattern `/marketVerticals/\d+/questions`.
- After step 2: The detail page heading (h1) shows the correct industry name (e.g., "Commercial").
- After step 2: The left sidebar is visible with all industries listed.
- After step 2: The "Add Question" button is visible.

---

## Describe: Questions Listing & Interaction

### TC-MV-030 | Verify that questions list shows expected columns (Question Statement, Last Edited By, Last Edited On, Answer Type)

**Precondition:** User is logged in and on a Market Verticals detail page (e.g., Commercial) with at least one question.

**Steps:**
1. Observe the questions table header row.
2. Read all visible column header texts.

**Expected results / Assertion points:**
- After step 1: The table header row is visible.
- After step 2: Column headers include "Question Statement", "Last Edited By", "Last Edited On", and "Answer Type".
- After step 2: There are exactly 6 column headers (drag-handle, Question Statement, Last Edited By, Last Edited On, Answer Type, actions menu).

---

### TC-MV-031 | Verify that questions list supports vertical scrolling without header/row misalignment

**Precondition:** User is logged in and on a Market Verticals detail page with enough questions to require scrolling (e.g., Commercial with 31 questions).

**Steps:**
1. Note the number of question rows visible in the table.
2. Scroll the questions table to the bottom.
3. Observe the last row's column alignment relative to the header.

**Expected results / Assertion points:**
- After step 1: Multiple question rows are visible.
- After step 2: The last question row is visible after scrolling.
- After step 3: The last row's cells align with the header columns (bounding boxes overlap horizontally).

---

### TC-MV-032 | Verify that Search by Question filters questions by statement keywords

**Precondition:** User is logged in and on a Market Verticals detail page with questions. A known question keyword exists (e.g., "security").

**Steps:**
1. Type a keyword (e.g., "security") in the "Search by Question" input.
2. Observe the filtered table rows.

**Expected results / Assertion points:**
- After step 1: The table updates to show only questions matching the keyword.
- After step 2: Every visible question statement contains the search keyword (case-insensitive).
- After step 2: At least one question row is visible.

---

### TC-MV-033 | Verify that invalid Search by Question shows an empty state message without showing stale results

**Precondition:** User is logged in and on a Market Verticals detail page with questions.

**Steps:**
1. Type a nonsensical string (e.g., "zzzznonexistent99999") in the "Search by Question" input.
2. Observe the table area.

**Expected results / Assertion points:**
- After step 1: No question rows are displayed in the table body.
- After step 2: Either an empty state message is shown (e.g., "No questions found") or the table body has zero data rows.
- After step 2: No stale/previous question rows remain visible.

---

### TC-MV-034 | Verify that question statement text truncates with ellipsis when long and does not break layout

**Precondition:** User is logged in and on a Market Verticals detail page containing at least one question with a long statement (e.g., "Have you experienced theft, vandalism, or another security incident in the past year?").

**Steps:**
1. Locate the long question statement cell in the table.
2. Read the visible text and check for text-overflow style.
3. Check the cell's bounding box does not exceed the column width.

**Expected results / Assertion points:**
- After step 1: The long question row is visible.
- After step 2: The visible text ends with "..." (ellipsis) if truncated, or the CSS text-overflow property is "ellipsis".
- After step 3: The cell width is bounded and does not cause horizontal scroll.

---

### TC-MV-035 | Verify that Last Edited By and Last Edited On show correct values and handle missing values as N/A

**Precondition:** User is logged in and on a Market Verticals detail page with questions.

**Steps:**
1. Read the "Last Edited By" and "Last Edited On" values for all visible question rows.
2. Verify each "Last Edited By" contains a non-empty name or "N/A".
3. Verify each "Last Edited On" matches date format MM/DD/YYYY or is "N/A".

**Expected results / Assertion points:**
- After step 1: Every question row has values in both columns.
- After step 2: "Last Edited By" is a non-empty string for each row.
- After step 3: "Last Edited On" matches `/^\d{2}\/\d{2}\/\d{4}$/` or equals "N/A".

---

### TC-MV-036 | Verify that Answer Type displays correct label (Dropdown/Radio/Multiselect) based on saved configuration

**Precondition:** User is logged in and on a Market Verticals detail page with questions of varying answer types.

**Steps:**
1. Read the "Answer Type" column value for each visible question row.
2. Verify each value is one of the expected labels.

**Expected results / Assertion points:**
- After step 1: Every question row has a non-empty Answer Type value.
- After step 2: Each Answer Type value is one of "Dropdown", "Radio", or "Multiselect".

---

### TC-MV-037 | Verify that clicking a question row opens the question details panel showing Associated Industries, Question Statement, Answer Type, and options

**Precondition:** User is logged in and on a Market Verticals detail page with at least one question.

**Steps:**
1. Click the question statement cell for the first question row.
2. Observe the side panel that opens.

**Expected results / Assertion points:**
- After step 1: The question detail panel opens with heading "Question" (h2).
- After step 2: "Associated Industries" heading (h3) is visible with at least one industry chip.
- After step 2: The question statement is displayed as an h3 heading.
- After step 2: "Answer Type" heading (h3) is visible.
- After step 2: At least one option row is visible with a label and points value.

---

### TC-MV-038 | Verify that question details panel can be closed using the close (X) icon without page refresh

**Precondition:** User is logged in and a question detail panel is open.

**Steps:**
1. Open a question detail panel by clicking a question row.
2. Note the current URL.
3. Click the close (X) icon button in the panel header.
4. Observe the page state.

**Expected results / Assertion points:**
- After step 1: The question detail panel heading "Question" (h2) is visible.
- After step 3: The panel heading "Question" (h2) is no longer visible.
- After step 4: The URL remains unchanged (no page refresh occurred).
- After step 4: The questions table is still visible.

---

### TC-MV-039 | Verify that Associated Industries chips display all linked industries correctly

**Precondition:** User is logged in and a question detail panel is open for a question associated with multiple industries.

**Steps:**
1. Open the detail panel for a question known to be linked to multiple industries (e.g., the first question "What security services are you currently using?").
2. Read all chips under "Associated Industries".

**Expected results / Assertion points:**
- After step 1: The "Associated Industries" section is visible.
- After step 2: At least one industry chip is displayed.
- After step 2: Each chip text matches a known industry name (Commercial, Distribution, Industrial, Manufacturing, Residential).

---

### TC-MV-040 | Verify that options list in question details shows each option with its points value correctly

**Precondition:** User is logged in and a question detail panel is open for a question with multiple options.

**Steps:**
1. Open the detail panel for a question with known options.
2. Read all option labels and their points values.

**Expected results / Assertion points:**
- After step 1: The options section is visible in the detail panel.
- After step 2: At least 2 options are displayed.
- After step 2: Each option has a non-empty label text.
- After step 2: Each option shows a "N Points" value where N is a non-negative integer.

---

### TC-MV-041 | Verify that question details panel supports long content and remains scrollable without UI overlap

**Precondition:** User is logged in and a question detail panel is open for a question with many options (e.g., the first question with 11 options).

**Steps:**
1. Open the detail panel for a question known to have many options.
2. Scroll within the detail panel to the last option.
3. Verify the last option is fully visible without overlapping the panel header.

**Expected results / Assertion points:**
- After step 1: The detail panel is open and the first option is visible.
- After step 2: The last option is visible after scrolling.
- After step 3: The panel header ("Question" h2) and the last option do not overlap (bounding boxes do not intersect vertically).

---

### TC-MV-042 | Verify that three-dot menu opens for a question row and shows Edit and Delete options

**Precondition:** User is logged in and on a Market Verticals detail page with at least one question.

**Steps:**
1. Click the three-dot (kebab) menu button on the last cell of a question row.
2. Observe the popup menu.

**Expected results / Assertion points:**
- After step 1: A popup menu appears.
- After step 2: The menu contains an "Edit" option (heading level 6).
- After step 2: The menu contains a "Delete" option (heading level 6).

---

### TC-MV-043 | Verify that clicking Delete from the menu opens a confirmation prompt (if implemented) before deletion

**Precondition:** User is logged in and on a Market Verticals detail page. A test question exists for deletion.

**Steps:**
1. Create a test question (PAT timestamp).
2. Click the three-dot menu on the test question row.
3. Click "Delete" from the menu.
4. Observe the dialog that appears.

**Expected results / Assertion points:**
- After step 3: A confirmation dialog appears with role "dialog" and name "Delete Question".
- After step 4: The dialog contains confirmation text ("Are you sure you want to delete this question?").
- After step 4: "Delete Question" and "Cancel" buttons are visible in the dialog.

---

### TC-MV-044 | Verify that deleting a question removes it from the list and updates total questions count

**Precondition:** User is logged in and a test question exists (created in TC-MV-043 or fresh).

**Steps:**
1. Note the current "No. of Questions" count.
2. Create a test question if one does not exist.
3. Note the updated "No. of Questions" count.
4. Delete the test question via three-dot menu > Delete > Confirm.
5. Observe the questions list and count.

**Expected results / Assertion points:**
- After step 4: The deleted question no longer appears in the table.
- After step 5: The "No. of Questions" count decreases by 1 compared to step 3.

---

### TC-MV-045 | Verify that menu closes when clicking outside the menu

**Precondition:** User is logged in and on a Market Verticals detail page with at least one question.

**Steps:**
1. Click the three-dot menu on a question row to open it.
2. Verify the menu is visible (Edit and Delete headings visible).
3. Click outside the menu (e.g., on the page body or press Escape).
4. Observe the menu state.

**Expected results / Assertion points:**
- After step 1: The menu popup is visible.
- After step 3: The "Edit" and "Delete" headings are no longer visible.
- After step 4: The questions table remains visible and interactive.

---

### TC-MV-046 | Verify that clicking Back returns to questions list and retains previous filters/search (if state retention is expected)

**Precondition:** User is logged in and on a Market Verticals detail page.

**Steps:**
1. Type a search keyword in "Search by Question" to filter questions.
2. Click the "Add Question" button to navigate to the create form.
3. Click the "Back" button on the create form.
4. Observe the questions list page state.

**Expected results / Assertion points:**
- After step 2: The create question form is visible (Question Statement input visible).
- After step 3: The user navigates back to the questions list page (Add Question button visible).
- After step 4: The questions table is visible and functional.

---

### TC-MV-047 | Verify that API failure on questions list shows a non-blocking error message and allows retry/navigation

**Precondition:** User is logged in. Network interception is available (Playwright route).

**Steps:**
1. Intercept the questions API endpoint and return 500.
2. Navigate to a Market Verticals detail page.
3. Observe the page state.
4. Unroute the intercepted API.
5. Navigate away and back (or reload) to verify page recovers.

**Expected results / Assertion points:**
- After step 2: The page does not crash (header and sidebar remain visible).
- After step 3: The questions table area shows zero data rows or an error/empty state.
- After step 5: After unrouting, the page recovers and shows questions normally.

---

### TC-MV-048 | Verify that rapid switching between industries does not crash and always loads correct questions

**Precondition:** User is logged in and on a Market Verticals detail page.

**Steps:**
1. Click "Distribution" in the left sidebar.
2. Immediately click "Industrial" in the left sidebar (without waiting for Distribution to fully load).
3. Wait for the page to stabilize.
4. Observe the heading and questions table.

**Expected results / Assertion points:**
- After step 3: The page does not crash or show an error overlay.
- After step 4: The heading (h1) shows "Industrial" (the last clicked industry).
- After step 4: The questions table is visible and loaded.
- After step 4: The "Add Question" button is visible.

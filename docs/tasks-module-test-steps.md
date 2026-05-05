# Tasks Module -- Manual Test Steps

> Generated: 2026-05-04 | Selectors live-verified via Playwright MCP
> Spec file: `tests/e2e/tasks-module.spec.js`
> POM file: `pages/tasks-module.js`

---

## Describe: Task Creation & Configuration

### TC-TASK-001 | Verify that New Task button opens Create New Task drawer.
**Preconditions:** User is logged in and on the Tasks list page (`/app/sales/tasks`).
**Steps:**
1. Click the "New Task" button.
**Expected results / Assertion points:**
- After step 1: "Create New Task" heading (h3) is visible.
- After step 1: "Task Title" textbox is visible.
- After step 1: "Save" button is visible.
- After step 1: "Cancel" button is visible.

---

### TC-TASK-002 | Verify that Create Task shows required field validation when all fields are empty.
**Preconditions:** User is on the Tasks list page. Create New Task drawer is open.
**Steps:**
1. Click "New Task" to open drawer.
2. Without filling any field, click "Save".
**Expected results / Assertion points:**
- After step 2: "Task For is required." error message is visible.
- After step 2: "Task Title is required." error message is visible.
- After step 2: "Task Description is required." error message is visible.
- After step 2: "Task Type is required." error message is visible.
- After step 2: "Task Priority is required." error message is visible.

---

### TC-TASK-003 | Verify that Create Task requires Company selection when Company is chosen as association.
**Preconditions:** User is on the Tasks list page. Create New Task drawer is open.
**Steps:**
1. Click "New Task" to open drawer.
2. Select "Company" radio button.
3. Fill Task Title, Description, Type, Priority.
4. Click "Save" without selecting a Company.
**Expected results / Assertion points:**
- After step 2: "Company" radio is checked.
- After step 4: "Company is required." error message is visible.

---

### TC-TASK-004 | Verify that Create Task requires Deal selection when Deal is chosen as association.
**Preconditions:** User is on the Tasks list page. Create New Task drawer is open.
**Steps:**
1. Click "New Task" to open drawer.
2. Select "Deal" radio button.
3. Fill Task Title, Description, Type, Priority.
4. Click "Save" without selecting a Deal.
**Expected results / Assertion points:**
- After step 2: "Deal" radio is checked.
- After step 4: "Deal is required." error message is visible.

---

### TC-TASK-005 | Verify that changing the association radio switches the association field correctly.
**Preconditions:** User is on the Tasks list page. Create New Task drawer is open.
**Steps:**
1. Click "New Task" to open drawer.
2. Select "Company" radio button.
3. Observe the association field label changes to Company-related.
4. Select "Deal" radio button.
5. Observe the association field label changes to Deal-related.
6. Select "Property" radio button.
7. Observe the association field label changes to Property-related.
8. Select "Contacts" radio button.
9. Observe the association field label changes to Contacts-related.
**Expected results / Assertion points:**
- After step 2: "Company" radio is checked.
- After step 4: "Deal" radio is checked, "Company" radio is unchecked.
- After step 6: "Property" radio is checked, "Deal" radio is unchecked.
- After step 8: "Contacts" radio is checked, "Property" radio is unchecked.

---

### TC-TASK-006 | Verify that Type dropdown shows To-Do, Email, Call, and LinkedIn options.
**Preconditions:** User is on the Tasks list page. Create New Task drawer is open.
**Steps:**
1. Click "New Task" to open drawer.
2. Click the "Select Type" dropdown trigger.
**Expected results / Assertion points:**
- After step 2: Popper/tooltip is visible with options: "To-do", "Email", "Call", "LinkedIn".

---

### TC-TASK-007 | Verify that Priority dropdown shows High, Medium, and Low options.
**Preconditions:** User is on the Tasks list page. Create New Task drawer is open.
**Steps:**
1. Click "New Task" to open drawer.
2. Click the "Select Priority" dropdown trigger.
**Expected results / Assertion points:**
- After step 2: Popper/tooltip is visible with options: "High", "Medium", "Low".

---

### TC-TASK-008 | Verify that Task Description character counter updates while typing.
**Preconditions:** User is on the Tasks list page. Create New Task drawer is open.
**Steps:**
1. Click "New Task" to open drawer.
2. Verify character counter shows "0 / 500".
3. Type "Hello World" in the description editor.
**Expected results / Assertion points:**
- After step 2: Counter text contains "0 / 500".
- After step 3: Counter text updates to reflect typed character count (e.g., "11 / 500").

---

### TC-TASK-009 | Verify that user can create a task successfully from Deal context.
**Preconditions:** User is logged in. A deal exists in the system.
**Steps:**
1. Navigate to Deals list page.
2. Click on a deal to open deal detail.
3. Click "Tasks" tab.
4. Click "New Task" button.
5. Fill Task Title with unique name (PAT {timestamp}).
6. Fill Task Description.
7. Select Type "To-do".
8. Select Priority "High".
9. Click "Save".
**Expected results / Assertion points:**
- After step 4: "Create New Task" heading is visible.
- After step 4: No radio group ("Create task for") is visible.
- After step 9: Success toast notification is visible.

---

### TC-TASK-010 | Verify that Deal-context Create Task drawer opens without association radio buttons.
**Preconditions:** User is on a Deal detail page, Tasks tab is selected.
**Steps:**
1. Click "New Task" button on the Deal's Tasks tab.
**Expected results / Assertion points:**
- After step 1: "Create New Task" heading is visible.
- After step 1: Radio group (Company/Property/Deal/Contacts) is NOT visible.
- After step 1: Task Title, Description, Type, Priority, Due Date fields are visible.

---

## Describe: Task Listing & Management

### TC-TASK-011 | Verify that user can navigate to Tasks module from left navigation.
**Preconditions:** User is logged in and on any page.
**Steps:**
1. Click "Tasks" link in the left sidebar navigation.
**Expected results / Assertion points:**
- After step 1: URL contains `/app/sales/tasks`.
- After step 1: Page title paragraph shows "Tasks".

---

### TC-TASK-012 | Verify that Tasks list page loads with all expected UI elements.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Observe the Tasks list page.
**Expected results / Assertion points:**
- "New Task" button is visible.
- "Search by Title" searchbox is visible.
- Table with column headers (Task Title, Due Date, Priority, Type) is visible.
- "All Types" filter dropdown is visible.
- "Priority" filter dropdown is visible.
- Status filter dropdown is visible.
- Pagination info text (e.g., "1-10 of X") is visible.
- "Rows per page" combobox is visible.

---

### TC-TASK-013 | Verify that Tasks list empty state is shown when no tasks exist.
**Preconditions:** User is on a context (e.g., Deal Tasks tab) with no tasks.
**Steps:**
1. Navigate to a deal that has no tasks.
2. Click "Tasks" tab.
**Expected results / Assertion points:**
- After step 2: "No tasks Added." heading (h2) is visible.

---

### TC-TASK-014 | Verify that task detail panel opens when a task row is clicked.
**Preconditions:** User is on the Tasks list page with at least one task.
**Steps:**
1. Click on a task row's title cell.
**Expected results / Assertion points:**
- After step 1: Detail panel with `[active]` class is visible.
- After step 1: Task title heading (h3) is visible in the panel.
- After step 1: "Date & Time" label is visible.
- After step 1: "Type" label is visible.
- After step 1: "Priority" label is visible.
- After step 1: "Task Description" label is visible.

---

### TC-TASK-015 | Verify that task detail panel closes successfully.
**Preconditions:** Task detail panel is open.
**Steps:**
1. Click on a task row to open detail panel.
2. Click the close button (X icon) in the detail panel header.
**Expected results / Assertion points:**
- After step 1: Detail panel is visible.
- After step 2: Detail panel is no longer visible.

---

### TC-TASK-016 | Verify that Edit Task option opens the update form with pre-filled values.
**Preconditions:** User is on the Tasks list page. A PAT-prefixed task exists (created in TC-TASK-009 or via setup).
**Steps:**
1. Click on the PAT task row to open the detail panel.
2. Click the three-dot actions button in the detail panel.
3. Click "Edit" menu item.
**Expected results / Assertion points:**
- After step 3: "Update This Task" heading is visible.
- After step 3: Task Title input contains the existing task title.

---

### TC-TASK-017 | Verify that user can edit task title and save successfully.
**Preconditions:** Edit Task drawer is open with pre-filled values.
**Steps:**
1. Open Edit Task drawer for a PAT task.
2. Clear and type a new title (append " (EDITED)").
3. Click "Save".
**Expected results / Assertion points:**
- After step 3: Success toast notification is visible.
- After step 3: Edit drawer closes.

---

### TC-TASK-018 | Verify that Cancel on Edit Task closes drawer without saving.
**Preconditions:** Edit Task drawer is open.
**Steps:**
1. Open Edit Task drawer for a task.
2. Modify the title.
3. Click "Cancel".
**Expected results / Assertion points:**
- After step 3: Edit drawer heading "Update This Task" is no longer visible.

---

### TC-TASK-019 | Verify that task can be marked complete via checkbox.
**Preconditions:** User is on Tasks list page. A To-do task exists.
**Steps:**
1. Locate a task row with status "To-do".
2. Click the checkbox in that row.
**Expected results / Assertion points:**
- After step 2: Success toast is visible OR the task row moves/updates to reflect "Completed" status.

---

### TC-TASK-020 | Verify that completed task can be toggled back to To-do.
**Preconditions:** User is on Tasks list page. A completed task exists.
**Steps:**
1. Switch status filter to "Completed" to find completed tasks.
2. Click the checkbox on a completed task row.
**Expected results / Assertion points:**
- After step 2: Success toast is visible OR the task status updates back to "To-do".

---

### TC-TASK-021 | Verify that Delete Task action opens confirmation dialog.
**Preconditions:** User is on the Tasks list page. A task detail panel is open.
**Steps:**
1. Click on a PAT task row to open detail panel.
2. Click the three-dot actions button.
3. Click "Delete" menu item.
**Expected results / Assertion points:**
- After step 3: Delete confirmation dialog is visible.
- After step 3: Dialog contains text "Are you sure you want to delete this task?".
- After step 3: "Delete" and "Cancel" buttons are visible in dialog.

---

### TC-TASK-022 | Verify that cancelling task deletion keeps the task intact.
**Preconditions:** Delete confirmation dialog is open.
**Steps:**
1. Open delete confirmation dialog for a task.
2. Click "Cancel" in the dialog.
**Expected results / Assertion points:**
- After step 2: Dialog closes (no longer visible).
- After step 2: Task still appears in the list.

---

### TC-TASK-023 | Verify that confirming task deletion removes the task successfully.
**Preconditions:** Delete confirmation dialog is open for a PAT task.
**Steps:**
1. Open delete confirmation dialog for the PAT task.
2. Click "Delete" to confirm.
**Expected results / Assertion points:**
- After step 2: Success toast notification is visible.
- After step 2: The deleted task no longer appears in the list.

---

### TC-TASK-024 | Verify that sorting works on Task Title column.
**Preconditions:** User is on the Tasks list page with multiple tasks.
**Steps:**
1. Click the "Task Title" column header sort button.
2. Note the first task title.
3. Click the "Task Title" column header again to reverse sort.
4. Note the first task title.
**Expected results / Assertion points:**
- After step 1: Table rows are sorted (first title changes or is alphabetically first).
- After step 3: Sort order reverses (first title differs from step 2).

---

### TC-TASK-025 | Verify that sorting works on Due Date column.
**Preconditions:** User is on the Tasks list page with multiple tasks.
**Steps:**
1. Click the "Due Date" column header sort button.
2. Note the first row's due date.
3. Click the "Due Date" column header again.
4. Note the first row's due date.
**Expected results / Assertion points:**
- After step 1: Table rows are sorted by due date.
- After step 3: Sort order reverses.

---

### TC-TASK-026 | Verify that Tasks tab opens correctly on Deal detail page.
**Preconditions:** User is logged in. A deal exists.
**Steps:**
1. Navigate to Deals list page.
2. Click on a deal to open detail.
3. Click "Tasks" tab.
**Expected results / Assertion points:**
- After step 3: Tasks tab is selected (aria-selected="true").
- After step 3: Tasks tab panel content is visible (search input, New Task button).

---

### TC-TASK-027 | Verify that changing Rows per page updates task listing pagination.
**Preconditions:** User is on the Tasks list page with more than 10 tasks.
**Steps:**
1. Note the current pagination text (e.g., "1-10 of 2979").
2. Change "Rows per page" combobox from 10 to 25.
**Expected results / Assertion points:**
- After step 2: Pagination text updates to show 25 rows (e.g., "1-25 of 2979").
- After step 2: Table displays up to 25 rows.

---

## Describe: Filters & Search Functionality

### TC-TASK-028 | Verify that Type filter shows only To-Do tasks when selected.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Click "All Types" filter dropdown.
2. Select "To-do" option.
**Expected results / Assertion points:**
- After step 2: All visible task rows in the "Type" column show "To-do".

---

### TC-TASK-029 | Verify that Type filter shows only Email tasks when selected.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Click "All Types" filter dropdown.
2. Select "Email" option.
**Expected results / Assertion points:**
- After step 2: All visible task rows in the "Type" column show "Email", OR empty state is shown if no Email tasks exist.

---

### TC-TASK-030 | Verify that Type filter shows only Call tasks when selected.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Click "All Types" filter dropdown.
2. Select "Call" option.
**Expected results / Assertion points:**
- After step 2: All visible task rows in the "Type" column show "Call", OR empty state is shown if no Call tasks exist.

---

### TC-TASK-031 | Verify that Type filter shows only LinkedIn tasks when selected.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Click "All Types" filter dropdown.
2. Select "LinkedIn" option.
**Expected results / Assertion points:**
- After step 2: All visible task rows in the "Type" column show "LinkedIn", OR empty state is shown if no LinkedIn tasks exist.

---

### TC-TASK-032 | Verify that Priority filter shows only High tasks when selected.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Click "Priority" filter dropdown.
2. Select "High" option.
**Expected results / Assertion points:**
- After step 2: All visible task rows in the "Priority" column show "High".

---

### TC-TASK-033 | Verify that Priority filter shows only Medium tasks when selected.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Click "Priority" filter dropdown.
2. Select "Medium" option.
**Expected results / Assertion points:**
- After step 2: All visible task rows in the "Priority" column show "Medium", OR empty state is shown.

---

### TC-TASK-034 | Verify that Priority filter shows only Low tasks when selected.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Click "Priority" filter dropdown.
2. Select "Low" option.
**Expected results / Assertion points:**
- After step 2: All visible task rows in the "Priority" column show "Low", OR empty state is shown.

---

### TC-TASK-035 | Verify that Status filter shows only To-do tasks when selected.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Click the Status filter dropdown (shows "To-do" by default).
2. Select "All Status" first to reset, then select "To-do".
**Expected results / Assertion points:**
- After step 2: All visible task rows in the "Type" column area show "To-do" status indicator.

---

### TC-TASK-036 | Verify that Status filter shows only Completed tasks when selected.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Click the Status filter dropdown.
2. Select "Completed".
**Expected results / Assertion points:**
- After step 2: All visible task rows show "Completed" status, OR empty state if no completed tasks exist.

---

### TC-TASK-037 | Verify that Due Date range filter works correctly in Tasks module.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Enter a date range in the "MM/DD/YYYY - MM/DD/YYYY" textbox (e.g., "09/01/2025 - 09/30/2025").
2. Press Enter to apply.
**Expected results / Assertion points:**
- After step 2: Displayed tasks have due dates within the specified range.
- After step 2: Pagination count changes to reflect filtered results.

---

### TC-TASK-038 | Verify that Search by Title filters task list correctly.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Type a known task title (e.g., "Finalize") in the "Search by Title" searchbox.
**Expected results / Assertion points:**
- After step 1: Displayed tasks contain the search term in the Task Title column.
- After step 1: Pagination count changes.

---

### TC-TASK-039 | Verify that searching with a non-matching title shows no task results.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Type a random non-matching string (e.g., "XYZNONEXISTENT99999") in the "Search by Title" searchbox.
**Expected results / Assertion points:**
- After step 1: "No tasks Added." empty state heading is visible, OR table shows zero rows.

---

### TC-TASK-040 | Verify that combining Type and Priority filters works correctly.
**Preconditions:** User is on the Tasks list page.
**Steps:**
1. Click "All Types" filter and select "To-do".
2. Click "Priority" filter and select "High".
**Expected results / Assertion points:**
- After step 2: All visible task rows show "To-do" in Type column AND "High" in Priority column.

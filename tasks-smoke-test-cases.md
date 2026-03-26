# Signal CRM – Tasks Module: Smoke Test Cases

**Application:** Signal CRM
**Module:** Tasks
**Base URL:** `https://proud-desert-02abf6a10.1.azurestaticapps.net/app/sales/tasks`
**Credentials:** `moiz.qureshi+ho@camp1.tkxel.com` / `Admin@123`
**Explored By:** Live MCP exploration (2026-03-25)
**Test Type:** Smoke Testing

---

## Module Overview

The Tasks module allows users to create, view, edit, complete, and delete tasks linked to CRM entities (Company, Property, Deal, or Contact). Tasks are accessible from the global left nav under "Tasks" and also from within individual Deal detail pages under the "Tasks" tab.

### Key Flows Explored
- Tasks List page (search, filter, sort, paginate)
- Create Task (from global Tasks page and from Deal context)
- View Task Detail (slide-in panel)
- Edit Task
- Mark Task as Complete / Incomplete (toggle)
- Delete Task (with confirmation dialog)
- Form validation (required field errors)
- Filter combinations (Type, Priority, Status, Date range)

---

## Test Cases

---

### TC-TASK-001: Navigate to Tasks Module from Left Navigation

| Field | Details |
|-------|---------|
| **Priority** | P0 – Critical |
| **Preconditions** | User is logged in to Signal CRM |
| **Steps** | 1. Click the "Tasks" icon in the left navigation sidebar |
| **Test Data** | N/A |
| **Expected Result** | User is navigated to `/app/sales/tasks`. Page title shows "Tasks". Tasks list page loads with search bar, filter dropdowns, "New Task" button, and the data table. |

---

### TC-TASK-002: Tasks List Page – Verify UI Elements

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | User is on `/app/sales/tasks` |
| **Steps** | 1. Observe the page layout without taking any action |
| **Test Data** | N/A |
| **Expected Result** | The following elements are visible: Search bar (placeholder "Search by Title"), "All Types" dropdown filter, "Property/Company/Deals" dropdown filter, "Priority" dropdown filter, "Status" dropdown (shows "To-do" by default), date range input (MM/DD/YYYY - MM/DD/YYYY), "New Task" button. Table with column headers: Task Title, Property/Company/Deals, Task Description, Created By, Due Date, Priority, Type. Pagination row at the bottom. |

---

### TC-TASK-003: Tasks List Empty State

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | User is on `/app/sales/tasks` and no tasks exist for the logged-in user |
| **Steps** | 1. Navigate to `/app/sales/tasks` with no tasks in the system |
| **Test Data** | N/A |
| **Expected Result** | Table body shows an empty state illustration with heading "No tasks Added." and message "No tasks at the moment – great time to plan your next move!". Pagination shows "0–0 of 0". |

---

### TC-TASK-004: Open Create New Task Drawer

| Field | Details |
|-------|---------|
| **Priority** | P0 – Critical |
| **Preconditions** | User is on the Tasks list page |
| **Steps** | 1. Click the "New Task" button |
| **Test Data** | N/A |
| **Expected Result** | A right-side drawer opens with heading "Create New Task". The drawer contains: "Create task for" label with four radio buttons (Company, Property, Deal, Contacts), Task Title textbox, Task Description rich text editor (with Bold/Italic/List/H1/H2 toolbar), Type dropdown (default: "Select Type"), Priority dropdown (default: "Select Priority"), Due Date datetime picker (default: current date/time), Cancel and Save buttons. |

---

### TC-TASK-005: Create Task – Required Field Validation (All Empty)

| Field | Details |
|-------|---------|
| **Priority** | P0 – Critical |
| **Preconditions** | "Create New Task" drawer is open |
| **Steps** | 1. Leave all fields empty 2. Click "Save" |
| **Test Data** | All fields empty |
| **Expected Result** | Validation errors appear: "Task For is required.", "Task Title is required.", "Task Description is required.", "Task Type is required.", "Task Priority is required." Drawer remains open. Task is not created. |

---

### TC-TASK-006: Create Task – Association Field Required Validation (Company)

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | "Create New Task" drawer is open |
| **Steps** | 1. Select "Company" radio button 2. Do not select a company 3. Fill all other required fields 4. Click "Save" |
| **Test Data** | Task Title: "Test Task", Description: "Test", Type: To-Do, Priority: High |
| **Expected Result** | Validation error: "Company is required." appears below the Company dropdown. Task is not created. |

---

### TC-TASK-007: Create Task – Association Field Required Validation (Deal)

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | "Create New Task" drawer is open |
| **Steps** | 1. Select "Deal" radio button 2. Do not select a deal 3. Fill all other fields 4. Click "Save" |
| **Test Data** | Task Title: "Test Task", Description: "Test", Type: To-Do, Priority: High |
| **Expected Result** | Validation error: "Deal is required." appears below the Deal dropdown. Task is not created. |

---

### TC-TASK-008: Create Task – Radio Button Switches Association Field

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | "Create New Task" drawer is open |
| **Steps** | 1. Select "Company" radio → observe field 2. Select "Property" radio → observe field 3. Select "Deal" radio → observe field 4. Select "Contacts" radio → observe field |
| **Test Data** | N/A |
| **Expected Result** | Each radio selection renders a different association dropdown: Company → "Select A Company", Property → "Select Property/Property Name", Deal → "Select A Deal", Contacts → "Select A Contact". Only one association field is visible at a time. |

---

### TC-TASK-009: Create Task – Verify Type Dropdown Options

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | "Create New Task" drawer is open |
| **Steps** | 1. Click the "Type" dropdown |
| **Test Data** | N/A |
| **Expected Result** | Dropdown opens showing exactly four options: To-Do, Email, Call, LinkedIn. |

---

### TC-TASK-010: Create Task – Verify Priority Dropdown Options

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | "Create New Task" drawer is open |
| **Steps** | 1. Click the "Priority" dropdown |
| **Test Data** | N/A |
| **Expected Result** | Dropdown opens showing exactly three options: High, Medium, Low. |

---

### TC-TASK-011: Create Task – Task Description Character Counter

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | "Create New Task" drawer is open |
| **Steps** | 1. Click in the Task Description editor 2. Type a 41-character string |
| **Test Data** | "Smoke test task for automation validation" (41 chars) |
| **Expected Result** | Character counter below the editor shows "41 / 459" (500 max − 41 used = 459 remaining). Counter updates in real time as user types. |

---

### TC-TASK-012: Create Task Successfully from Deal Context

| Field | Details |
|-------|---------|
| **Priority** | P0 – Critical |
| **Preconditions** | User is on a Deal detail page (e.g., `/app/sales/deals/deal/18596`), Tasks tab is selected |
| **Steps** | 1. Click "New Task" button 2. Enter Task Title 3. Enter Task Description 4. Select Type: "To-Do" 5. Select Priority: "High" 6. Click "Save" |
| **Test Data** | Title: "TC-TASK-SMOKE-001 Automation Test Task", Description: "This is a smoke test task for automation validation.", Type: To-Do, Priority: High |
| **Expected Result** | Drawer closes. Success toast notification appears. Task appears in the deal's Tasks tab table with correct Title, Description, Created By (current user), Due Date, Priority (High), and Type (To-do). Tasks tab counter increments by 1. |

---

### TC-TASK-013: View Task Detail Panel

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | At least one task exists in the Tasks tab of a Deal |
| **Steps** | 1. Click on any task row (Task Title cell or Description cell) |
| **Test Data** | Any existing task |
| **Expected Result** | A right-side detail panel slides open showing: Task title as heading, Date & Time field, Type (displayed as a labeled badge, e.g., "To-Do"), Priority (displayed with colored dot and label, e.g., "High"), Task Description text, ⋮ three-dot action menu button, and an X close button. |

---

### TC-TASK-014: Close Task Detail Panel

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | Task detail panel is open |
| **Steps** | 1. Click the X (close) button in the task detail panel |
| **Test Data** | N/A |
| **Expected Result** | The task detail panel closes. The tasks list remains visible and unchanged. |

---

### TC-TASK-015: Edit Task – Open Edit Form from Detail Panel

| Field | Details |
|-------|---------|
| **Priority** | P0 – Critical |
| **Preconditions** | Task detail panel is open |
| **Steps** | 1. Click the ⋮ (three-dot) menu in the task detail panel 2. Select "Edit" |
| **Test Data** | N/A |
| **Expected Result** | An "Update This Task" drawer opens. All fields are pre-populated with the task's existing values: Task Title, Task Description, Type, Priority, Due Date. Cancel and Save buttons are visible. |

---

### TC-TASK-016: Edit Task – Update Title and Save

| Field | Details |
|-------|---------|
| **Priority** | P0 – Critical |
| **Preconditions** | "Update This Task" drawer is open with an existing task |
| **Steps** | 1. Clear the Task Title field 2. Enter new task title 3. Click "Save" |
| **Test Data** | New Title: "TC-TASK-SMOKE-001 Automation Test Task (EDITED)" |
| **Expected Result** | Drawer closes. Success toast appears. The task row in the table updates to show the new title immediately. Task detail panel (if re-opened) reflects the updated title. |

---

### TC-TASK-017: Edit Task – Cancel Without Saving

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | "Update This Task" drawer is open |
| **Steps** | 1. Modify the Task Title 2. Click "Cancel" |
| **Test Data** | Any modification |
| **Expected Result** | Drawer closes without saving changes. Original task data remains unchanged in the task list. |

---

### TC-TASK-018: Mark Task as Complete via Checkbox

| Field | Details |
|-------|---------|
| **Priority** | P0 – Critical |
| **Preconditions** | At least one task with status "To-do" exists in the task list |
| **Steps** | 1. Locate a task in "To-do" status 2. Click the checkbox in the leftmost column of that task's row |
| **Test Data** | Any To-do task |
| **Expected Result** | Checkbox becomes checked (filled blue). Task title text shows strikethrough styling. Row appears visually greyed/dimmed to indicate completion. Success notification appears. |

---

### TC-TASK-019: Unmark Task as Complete (Toggle Back to To-do)

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | At least one task with status "Completed" (checked checkbox) exists |
| **Steps** | 1. Locate a completed task 2. Click the checked checkbox |
| **Test Data** | Any completed task |
| **Expected Result** | Checkbox becomes unchecked. Strikethrough styling is removed from the task title. Row returns to normal (active) appearance, indicating status reverted to "To-do". |

---

### TC-TASK-020: Delete Task – Confirmation Dialog Appears

| Field | Details |
|-------|---------|
| **Priority** | P0 – Critical |
| **Preconditions** | Task detail panel is open |
| **Steps** | 1. Click ⋮ three-dot menu 2. Select "Delete" |
| **Test Data** | N/A |
| **Expected Result** | A modal confirmation dialog appears with: heading "Delete Task", message "Are you sure you want to delete this task? This action cannot be undone!", and two buttons: "Cancel" and "Delete". |

---

### TC-TASK-021: Delete Task – Cancel Deletion

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | Delete confirmation dialog is open |
| **Steps** | 1. Click "Cancel" in the confirmation dialog |
| **Test Data** | N/A |
| **Expected Result** | Dialog closes. Task is NOT deleted. Task remains in the task list with all original data intact. |

---

### TC-TASK-022: Delete Task – Confirm Deletion

| Field | Details |
|-------|---------|
| **Priority** | P0 – Critical |
| **Preconditions** | Delete confirmation dialog is open |
| **Steps** | 1. Click "Delete" in the confirmation dialog |
| **Test Data** | N/A |
| **Expected Result** | Dialog closes. Task detail panel closes. Task is removed from the task list immediately. Success toast notification appears. Task count in tab badge decrements by 1. If the deleted task was the only task, empty state "No tasks Added." is shown. |

---

### TC-TASK-023: Filter Tasks by Type – To-Do

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | Tasks list page has tasks of multiple types |
| **Steps** | 1. Click the "All Types" filter dropdown 2. Select "To-Do" |
| **Test Data** | N/A |
| **Expected Result** | Task list refreshes to show only tasks with Type = "To-Do". Other type tasks (Email, Call, LinkedIn) are hidden. Filter button label updates to "To-Do". |

---

### TC-TASK-024: Filter Tasks by Type – Email

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | Tasks list page has email-type tasks |
| **Steps** | 1. Click "All Types" filter 2. Select "Email" |
| **Test Data** | N/A |
| **Expected Result** | Only tasks with Type = "Email" are shown. |

---

### TC-TASK-025: Filter Tasks by Type – Call

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | Tasks list page has call-type tasks |
| **Steps** | 1. Click "All Types" filter 2. Select "Call" |
| **Test Data** | N/A |
| **Expected Result** | Only tasks with Type = "Call" are shown. |

---

### TC-TASK-026: Filter Tasks by Type – LinkedIn

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | Tasks list page has LinkedIn-type tasks |
| **Steps** | 1. Click "All Types" filter 2. Select "LinkedIn" |
| **Test Data** | N/A |
| **Expected Result** | Only tasks with Type = "LinkedIn" are shown. |

---

### TC-TASK-027: Filter Tasks by Priority – High

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | Tasks list page has tasks with different priorities |
| **Steps** | 1. Click the "Priority" filter dropdown 2. Select "High" |
| **Test Data** | N/A |
| **Expected Result** | Only tasks with Priority = "High" are shown. Priority column in the table shows "High" for all visible rows. |

---

### TC-TASK-028: Filter Tasks by Priority – Medium

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | Tasks list page has medium-priority tasks |
| **Steps** | 1. Click "Priority" filter 2. Select "Medium" |
| **Test Data** | N/A |
| **Expected Result** | Only tasks with Priority = "Medium" are shown. |

---

### TC-TASK-029: Filter Tasks by Priority – Low

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | Tasks list page has low-priority tasks |
| **Steps** | 1. Click "Priority" filter 2. Select "Low" |
| **Test Data** | N/A |
| **Expected Result** | Only tasks with Priority = "Low" are shown. |

---

### TC-TASK-030: Filter Tasks by Status – To-do

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | Tasks list page with mixed completed and pending tasks |
| **Steps** | 1. Click the "Status" filter dropdown 2. Select "To-do" |
| **Test Data** | N/A |
| **Expected Result** | Only tasks with Status = "To-do" (unchecked/not completed) are displayed. Completed tasks (with strikethrough) are hidden. |

---

### TC-TASK-031: Filter Tasks by Status – Completed

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | Tasks list page with at least one completed task |
| **Steps** | 1. Click the "Status" filter dropdown 2. Select "Completed" |
| **Test Data** | N/A |
| **Expected Result** | Only tasks with Status = "Completed" are shown. All visible tasks have strikethrough text indicating completion. |

---

### TC-TASK-032: Filter Tasks by Date Range

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | Tasks list page with tasks on various due dates |
| **Steps** | 1. Click the date range input field 2. Enter start date: 03/01/2026 3. Enter end date: 03/31/2026 |
| **Test Data** | Start: 03/01/2026, End: 03/31/2026 |
| **Expected Result** | Task list filters to show only tasks with Due Date within the specified range. Tasks outside the range are not displayed. |

---

### TC-TASK-033: Search Tasks by Title

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | Tasks list page with multiple tasks |
| **Steps** | 1. Click the search bar 2. Type a partial task title string |
| **Test Data** | Search term: "Automation" |
| **Expected Result** | Task list filters in real-time to show only tasks whose title contains "Automation". Tasks not matching the search term disappear. Search is case-insensitive. |

---

### TC-TASK-034: Search Tasks – No Results

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | Tasks list page is visible |
| **Steps** | 1. Type a search term that matches no task titles |
| **Test Data** | Search term: "zzznomatch99999" |
| **Expected Result** | Task list shows empty state or "No tasks Added." message. Pagination shows 0–0 of 0. |

---

### TC-TASK-035: Sort Tasks by Task Title

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | Tasks list with multiple tasks |
| **Steps** | 1. Click the "Task Title" column header sort button 2. Click again to toggle sort direction |
| **Test Data** | N/A |
| **Expected Result** | First click: tasks sort alphabetically A→Z by title. Second click: tasks sort Z→A. Sort arrow indicator changes direction accordingly. |

---

### TC-TASK-036: Sort Tasks by Due Date

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | Tasks list with multiple tasks having different due dates |
| **Steps** | 1. Click the "Due Date" column header sort button |
| **Test Data** | N/A |
| **Expected Result** | Tasks sort by due date ascending (earliest first). Second click sorts descending (latest first). |

---

### TC-TASK-037: Tasks Tab in Deal Detail Page

| Field | Details |
|-------|---------|
| **Priority** | P0 – Critical |
| **Preconditions** | User navigates to any Deal detail page |
| **Steps** | 1. Navigate to a Deal detail page 2. Click the "Tasks" tab in the Overview section |
| **Test Data** | Deal ID: 18596 (or any valid deal) |
| **Expected Result** | Tasks tab becomes active. A task-specific sub-table appears with columns: Task Title, Task Description, Created By, Due Date, Priority, Type, and a checkbox column. Local filters: Type, Priority, Status. "New Task" button visible. |

---

### TC-TASK-038: Deal-Context Task Creation – No Association Radio Required

| Field | Details |
|-------|---------|
| **Priority** | P1 – High |
| **Preconditions** | User is in a Deal's Tasks tab |
| **Steps** | 1. Click "New Task" in the deal's Tasks tab 2. Observe the drawer fields |
| **Test Data** | N/A |
| **Expected Result** | Create Task drawer opens WITHOUT the "Create task for" radio button group. The form only shows Task Title, Task Description, Type, Priority, Due Date. The task is automatically linked to the current deal. |

---

### TC-TASK-039: Rows Per Page – Change Pagination Size

| Field | Details |
|-------|---------|
| **Priority** | P3 – Low |
| **Preconditions** | Tasks list has more than 10 tasks |
| **Steps** | 1. Click the "Rows per page" dropdown (default: 10) 2. Select a different value (e.g., 25) |
| **Test Data** | N/A |
| **Expected Result** | Table refreshes to display 25 rows per page. Pagination counter updates accordingly (e.g., "1–25 of X"). |

---

### TC-TASK-040: Combine Filters – Type + Priority

| Field | Details |
|-------|---------|
| **Priority** | P2 – Medium |
| **Preconditions** | Tasks list with varied task types and priorities |
| **Steps** | 1. Select "Type" filter → "To-Do" 2. Select "Priority" filter → "High" |
| **Test Data** | N/A |
| **Expected Result** | Only tasks that are BOTH Type = "To-Do" AND Priority = "High" are displayed. Both filters apply simultaneously. |

---

## Summary Table

| TC ID | Test Case Name | Priority |
|-------|---------------|----------|
| TC-TASK-001 | Navigate to Tasks Module | P0 |
| TC-TASK-002 | Verify UI Elements | P1 |
| TC-TASK-003 | Empty State Display | P2 |
| TC-TASK-004 | Open Create New Task Drawer | P0 |
| TC-TASK-005 | Required Field Validation (All Empty) | P0 |
| TC-TASK-006 | Association Field Required – Company | P1 |
| TC-TASK-007 | Association Field Required – Deal | P1 |
| TC-TASK-008 | Radio Button Switches Association Field | P1 |
| TC-TASK-009 | Type Dropdown Options | P1 |
| TC-TASK-010 | Priority Dropdown Options | P1 |
| TC-TASK-011 | Description Character Counter | P2 |
| TC-TASK-012 | Create Task Successfully (Deal Context) | P0 |
| TC-TASK-013 | View Task Detail Panel | P1 |
| TC-TASK-014 | Close Task Detail Panel | P2 |
| TC-TASK-015 | Edit Task – Open Edit Form | P0 |
| TC-TASK-016 | Edit Task – Update and Save | P0 |
| TC-TASK-017 | Edit Task – Cancel Without Saving | P2 |
| TC-TASK-018 | Mark Task as Complete | P0 |
| TC-TASK-019 | Unmark Task (Toggle Back to To-do) | P1 |
| TC-TASK-020 | Delete – Confirmation Dialog | P0 |
| TC-TASK-021 | Delete – Cancel Deletion | P1 |
| TC-TASK-022 | Delete – Confirm Deletion | P0 |
| TC-TASK-023 | Filter by Type – To-Do | P1 |
| TC-TASK-024 | Filter by Type – Email | P2 |
| TC-TASK-025 | Filter by Type – Call | P2 |
| TC-TASK-026 | Filter by Type – LinkedIn | P2 |
| TC-TASK-027 | Filter by Priority – High | P1 |
| TC-TASK-028 | Filter by Priority – Medium | P2 |
| TC-TASK-029 | Filter by Priority – Low | P2 |
| TC-TASK-030 | Filter by Status – To-do | P1 |
| TC-TASK-031 | Filter by Status – Completed | P1 |
| TC-TASK-032 | Filter by Date Range | P1 |
| TC-TASK-033 | Search by Title | P1 |
| TC-TASK-034 | Search – No Results | P2 |
| TC-TASK-035 | Sort by Task Title | P2 |
| TC-TASK-036 | Sort by Due Date | P2 |
| TC-TASK-037 | Tasks Tab in Deal Detail | P0 |
| TC-TASK-038 | Deal-Context – No Radio Required | P1 |
| TC-TASK-039 | Rows Per Page Change | P3 |
| TC-TASK-040 | Combine Filters (Type + Priority) | P2 |

**Total: 40 Smoke Test Cases**
**P0 (Critical): 12 | P1 (High): 15 | P2 (Medium): 12 | P3 (Low): 1**

---

## Observed Bugs / Notes

1. **Date field rendering bug**: The Due Date in the task detail panel and edit form shows "un3efine3" instead of the actual date value — this is a UI rendering defect with the datetime field.
2. **Success toast i18n keys**: All success/error notifications show raw translation keys instead of human-readable messages (e.g., `"Translation missing: en.api.v1.shared.tasks.success.create"`). This indicates missing i18n entries.
3. **Deal context task form date placeholder**: Date field placeholder shows "undefined - undefined" in the deal Tasks tab context.
4. **Global Tasks page – API dependency**: The "Select A Deal" / "Select A Company" etc. dropdowns in the global Create Task drawer depend on backend API calls that may fail in certain environments (DNS resolution issues for `uat.s...teamsignal.com`), showing "No Record Found".

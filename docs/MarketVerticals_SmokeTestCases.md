# Market Verticals Module — Smoke Test Cases
**Application:** Signal Sales Automation
**Module:** Market Verticals
**URL:** `/app/sales/marketVerticals`
**Tested By:** QA Automation (MCP Exploration)
**Date:** 2026-03-26

---

## Module Overview (Explored Behavior)

The Market Verticals module has **two layers**:

1. **List Page** (`/marketVerticals`) — table view of all industry verticals with search
2. **Detail Page** (`/marketVerticals/:id/questions`) — split view: left sidebar (verticals) + right panel (questions per vertical)

### Key UI Elements Discovered

| Area | Element | Type |
|---|---|---|
| List Page | Search by Industry | Searchbox |
| List Page | Industries Table | Table (Industries, No. of Deals, No. of Companies, Synced From, Last Synced On) |
| List Page | Rows per page | Combobox (default 10) |
| List Page | Pagination | Previous / Next buttons |
| Detail Page (Left) | Search verticals | Searchbox with clear (X) button |
| Detail Page (Left) | Vertical list items | Clickable buttons (name + company count) |
| Detail Page (Right) | Vertical name heading | H1 |
| Detail Page (Right) | Question count | Text |
| Detail Page (Right) | Search by Question | Searchbox with clear (X) button |
| Detail Page (Right) | Add Question button | Primary button |
| Detail Page (Right) | Questions table | Drag handle, Question Statement, Last Edited By, Last Edited On, Answer Type, 3-dot menu |
| Detail Page (Right) | 3-dot menu | Edit, Delete options |
| Add/Edit Question | Question Statement | Required text input |
| Add/Edit Question | Instructions | Optional textarea |
| Add/Edit Question | Answer Type | Dropdown (Multiple Selection, Radio Buttons, DropDown) |
| Add/Edit Question | Market Verticals | Multi-select with search (Commercial, Distribution, Industrial, Manufacturing, Residential) |
| Add/Edit Question | Add option | Button (generates Option Label + Points rows) |
| Add/Edit Question | Required | Checkbox |
| Add/Edit Question | Save | Primary button |
| Add/Edit Question | Cancel | Secondary button |
| Add/Edit Question | Back | Navigation button |
| Delete Confirmation | Dialog | "Delete Question" + Cancel + Delete Question buttons |
| Question Detail Panel | Side drawer | Associated Industries chips, Question Statement, Answer options with points |

### Verticals Present (5 total)
- Commercial (2595 companies)
- Distribution (83 companies)
- Industrial (180 companies)
- Manufacturing (203 companies)
- Residential (5859 companies)

### Answer Types Available
- Multiple Selection (Multiselect)
- Radio Buttons (Single Selection) (Radio)
- DropDown (Dropdown)

---

## Smoke Test Cases

---

### TC-MV-001 — Navigate to Market Verticals Module

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-001 |
| **Test Case Name** | Verify Market Verticals module is accessible from sidebar |
| **Priority** | High |
| **Preconditions** | User is logged in and on the Dashboard |
| **Steps** | 1. Click "Market Verticals" in left sidebar navigation |
| **Test Data** | N/A |
| **Expected Result** | Page navigates to `/app/sales/marketVerticals`. Title shows "Market Verticals". Table displays the list of industry verticals. |

---

### TC-MV-002 — Verify Market Verticals List Table Columns

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-002 |
| **Test Case Name** | Verify all table columns are visible on Market Verticals list page |
| **Priority** | High |
| **Preconditions** | User is on Market Verticals list page |
| **Steps** | 1. Navigate to Market Verticals 2. Observe the table header row |
| **Test Data** | N/A |
| **Expected Result** | Table shows 5 columns: Industries, No. of Deals, No. of Companies, Synced From, Last Synced On |

---

### TC-MV-003 — Verify All 5 Industry Verticals Are Listed

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-003 |
| **Test Case Name** | Verify all 5 industry verticals appear in the list |
| **Priority** | High |
| **Preconditions** | User is on Market Verticals list page |
| **Steps** | 1. Navigate to Market Verticals 2. Count rows in the table |
| **Test Data** | N/A |
| **Expected Result** | Table shows 5 rows: Commercial, Distribution, Industrial, Manufacturing, Residential. Pagination shows "1–5 of 5". |

---

### TC-MV-004 — Search by Industry on List Page

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-004 |
| **Test Case Name** | Verify search filters industry verticals on list page |
| **Priority** | High |
| **Preconditions** | User is on Market Verticals list page |
| **Steps** | 1. Click "Search by Industry" search box 2. Type "Commercial" |
| **Test Data** | Search term: `Commercial` |
| **Expected Result** | Table filters to show only the "Commercial" row. Other rows are hidden. |

---

### TC-MV-005 — Search No Results on List Page

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-005 |
| **Test Case Name** | Verify search shows empty state when no match found |
| **Priority** | Medium |
| **Preconditions** | User is on Market Verticals list page |
| **Steps** | 1. Type a non-existent value in "Search by Industry" (e.g., "XYZABC") |
| **Test Data** | Search term: `XYZABC` |
| **Expected Result** | Table shows no rows / empty state message. |

---

### TC-MV-006 — Navigate to Vertical Detail Page

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-006 |
| **Test Case Name** | Verify clicking a vertical row navigates to detail/questions page |
| **Priority** | High |
| **Preconditions** | User is on Market Verticals list page |
| **Steps** | 1. Click on "Commercial" row in the table |
| **Test Data** | Vertical: `Commercial` |
| **Expected Result** | URL changes to `/marketVerticals/84550/questions`. Page shows "Commercial" heading in right panel. Left sidebar lists all 5 verticals. Questions table is visible with 10 questions. |

---

### TC-MV-007 — Verify Left Sidebar Lists All Verticals on Detail Page

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-007 |
| **Test Case Name** | Verify left sidebar shows all industry verticals with company counts |
| **Priority** | Medium |
| **Preconditions** | User is on any vertical detail page |
| **Steps** | 1. Navigate to any vertical detail page 2. Observe left sidebar |
| **Test Data** | N/A |
| **Expected Result** | Left sidebar shows 5 verticals: Commercial (2595 companies), Distribution (83), Industrial (180), Manufacturing (203), Residential (5859). |

---

### TC-MV-008 — Switch Between Verticals via Left Sidebar

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-008 |
| **Test Case Name** | Verify clicking a different vertical in sidebar loads its questions |
| **Priority** | High |
| **Preconditions** | User is on Commercial vertical detail page |
| **Steps** | 1. Click "Distribution" in left sidebar |
| **Test Data** | Vertical: `Distribution` |
| **Expected Result** | Right panel heading updates to "Distribution". URL changes to Distribution's ID. Questions table reloads with Distribution's questions. |

---

### TC-MV-009 — Search Verticals in Left Sidebar

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-009 |
| **Test Case Name** | Verify left sidebar search filters the vertical list |
| **Priority** | Medium |
| **Preconditions** | User is on vertical detail page |
| **Steps** | 1. Type "Comm" in the left sidebar search box |
| **Test Data** | Search term: `Comm` |
| **Expected Result** | Left sidebar list filters to show only "Commercial". Other verticals are hidden. Clear (X) button appears. |

---

### TC-MV-010 — Clear Vertical Sidebar Search

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-010 |
| **Test Case Name** | Verify clearing sidebar search restores full vertical list |
| **Priority** | Medium |
| **Preconditions** | User has typed in left sidebar search box |
| **Steps** | 1. Type "Comm" in sidebar search 2. Click the clear (X) button |
| **Test Data** | Search term: `Comm` |
| **Expected Result** | Search box clears. All 5 verticals are shown again in the sidebar. |

---

### TC-MV-011 — Search Questions Within a Vertical

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-011 |
| **Test Case Name** | Verify "Search by Question" filters questions in the right panel |
| **Priority** | High |
| **Preconditions** | User is on Commercial vertical detail page (10 questions present) |
| **Steps** | 1. Type "budget" in the "Search by Question" search box |
| **Test Data** | Search term: `budget` |
| **Expected Result** | Questions table filters to show only "What is your monthly security budget?". Question count updates to 1. |

---

### TC-MV-012 — Clear Question Search

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-012 |
| **Test Case Name** | Verify clearing question search restores all questions |
| **Priority** | Medium |
| **Preconditions** | User has an active question search |
| **Steps** | 1. Type "budget" in question search 2. Click the clear (X) button |
| **Test Data** | Search term: `budget` |
| **Expected Result** | Search clears. All 10 questions are shown again. Question count resets to 10. |

---

### TC-MV-013 — View Question Detail Panel

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-013 |
| **Test Case Name** | Verify clicking a question row opens the detail side panel |
| **Priority** | High |
| **Preconditions** | User is on Commercial vertical detail page |
| **Steps** | 1. Click on the "What security services are you currently using? Why are you using?" row |
| **Test Data** | Question: `What security services are you currently using?` |
| **Expected Result** | A right-side drawer opens showing: "Question" heading, Edit button, close (X) button, "Associated Industries" chips (Commercial, Residential, Manufacturing, Industrial, Distribution), question statement, "Answer Type" section, and all options with points. |

---

### TC-MV-014 — Close Question Detail Panel

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-014 |
| **Test Case Name** | Verify the question detail panel can be closed |
| **Priority** | Medium |
| **Preconditions** | Question detail panel is open |
| **Steps** | 1. Click the close (X) button on the detail panel |
| **Test Data** | N/A |
| **Expected Result** | Side drawer closes. Questions table is fully visible again. |

---

### TC-MV-015 — Navigate to Add Question Form

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-015 |
| **Test Case Name** | Verify "Add Question" button navigates to question creation page |
| **Priority** | High |
| **Preconditions** | User is on a vertical detail page |
| **Steps** | 1. Click the "+ Add Question" button |
| **Test Data** | N/A |
| **Expected Result** | Page navigates to `questionBank/create`. Form shows: Question Statement (required), Instructions (optional), Answer Type dropdown (defaults to "Multiple Selection"), Market Verticals multi-select, "Add option" button, Required checkbox, Back/Cancel/Save buttons. |

---

### TC-MV-016 — Validate Required Fields on Add Question Form

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-016 |
| **Test Case Name** | Verify form shows validation errors when saving with empty required fields |
| **Priority** | High |
| **Preconditions** | User is on the Add Question form with all fields empty |
| **Steps** | 1. Click the "Save" button without filling any field |
| **Test Data** | N/A |
| **Expected Result** | Validation errors appear: "Question statement is required." below Question Statement field (red border). "Question Option must have at least 2 items." shown below options area. Market Verticals field shows red border. Form does NOT submit. |

---

### TC-MV-017 — Verify Answer Type Dropdown Options

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-017 |
| **Test Case Name** | Verify Answer Type dropdown contains all 3 expected options |
| **Priority** | Medium |
| **Preconditions** | User is on the Add Question form |
| **Steps** | 1. Click the Answer Type dropdown |
| **Test Data** | N/A |
| **Expected Result** | Dropdown shows exactly 3 options: "Multiple Selection", "Radio Buttons (Single Selection)", "DropDown" |

---

### TC-MV-018 — Verify Market Verticals Multi-Select Dropdown

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-018 |
| **Test Case Name** | Verify Market Verticals dropdown lists all 5 verticals with search |
| **Priority** | Medium |
| **Preconditions** | User is on the Add Question form |
| **Steps** | 1. Click the "Market Verticals" dropdown |
| **Test Data** | N/A |
| **Expected Result** | Dropdown opens with a Search box and 5 checkboxed options: Manufacturing, Industrial, Distribution, Residential, Commercial. |

---

### TC-MV-019 — Add Option Row Appears When Clicking "Add option"

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-019 |
| **Test Case Name** | Verify clicking "Add option" creates a new option input row |
| **Priority** | High |
| **Preconditions** | User is on Add Question form with Answer Type = "Multiple Selection" |
| **Steps** | 1. Click the "+ Add option" button |
| **Test Data** | N/A |
| **Expected Result** | A new row appears with: "Option Label" text input, a numeric points spinbutton (default 0), and a delete (trash) icon. |

---

### TC-MV-020 — Successfully Create a New Question (Multiple Selection)

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-020 |
| **Test Case Name** | Verify a new question can be created with all valid data |
| **Priority** | High |
| **Preconditions** | User is on the Add Question form |
| **Steps** | 1. Enter "Smoke Test Question - Automation" in Question Statement 2. Enter "Test instructions" in Instructions 3. Select "Multiple Selection" as Answer Type 4. Select "Commercial" from Market Verticals 5. Click "Add option", enter "Option A" and set points to 5 6. Click "Add option" again, enter "Option B" and set points to 10 7. Check the "Required" checkbox 8. Click "Save" |
| **Test Data** | Question: `Smoke Test Question - Automation`, Options: `Option A (5pts)`, `Option B (10pts)` |
| **Expected Result** | Form saves successfully. User is redirected to the vertical detail page. New question appears in the questions table. Question count increases by 1. |

---

### TC-MV-021 — Cancel Add Question Discards Form

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-021 |
| **Test Case Name** | Verify Cancel button discards the form and navigates back |
| **Priority** | Medium |
| **Preconditions** | User has partially filled the Add Question form |
| **Steps** | 1. Fill in Question Statement with "Test cancel" 2. Click "Cancel" |
| **Test Data** | Question: `Test cancel` |
| **Expected Result** | Form is discarded. User is navigated back to the vertical detail page. No new question appears in the table. |

---

### TC-MV-022 — Back Button on Add Question Navigates Back

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-022 |
| **Test Case Name** | Verify "Back" button navigates back to the questions list |
| **Priority** | Medium |
| **Preconditions** | User is on Add Question form |
| **Steps** | 1. Click the "← Back" button |
| **Test Data** | N/A |
| **Expected Result** | User is navigated back to the vertical detail page without saving. |

---

### TC-MV-023 — Open Edit Question from 3-dot Menu

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-023 |
| **Test Case Name** | Verify Edit option in 3-dot menu opens the edit form with pre-populated data |
| **Priority** | High |
| **Preconditions** | User is on Commercial vertical detail page with questions listed |
| **Steps** | 1. Click the 3-dot (⋮) button on the first question row 2. Click "Edit" |
| **Test Data** | Question: `What security services are you currently using? Why are you using?` |
| **Expected Result** | Page navigates to `questionBank/edit/:id`. Form is pre-populated with existing data: question statement, answer type (DropDown), all existing option labels and points. |

---

### TC-MV-024 — Open Edit Question from Detail Panel

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-024 |
| **Test Case Name** | Verify Edit button in question detail side panel opens the edit form |
| **Priority** | High |
| **Preconditions** | Question detail side panel is open |
| **Steps** | 1. Click on a question row to open detail panel 2. Click "Edit" button in the panel |
| **Test Data** | N/A |
| **Expected Result** | Page navigates to `questionBank/edit/:id` with form pre-populated. |

---

### TC-MV-025 — Delete Question Shows Confirmation Dialog

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-025 |
| **Test Case Name** | Verify clicking Delete from 3-dot menu shows confirmation dialog |
| **Priority** | High |
| **Preconditions** | User is on vertical detail page with questions |
| **Steps** | 1. Click the 3-dot (⋮) button on any question row 2. Click "Delete" |
| **Test Data** | N/A |
| **Expected Result** | A confirmation modal appears with: title "Delete Question", message "Are you sure you want to delete this question? This action cannot be undone!", and two buttons: "Cancel" (gray) and "Delete Question" (red). |

---

### TC-MV-026 — Cancel Delete Confirmation Dismisses Dialog

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-026 |
| **Test Case Name** | Verify Cancel on delete dialog dismisses without deleting |
| **Priority** | Medium |
| **Preconditions** | Delete confirmation dialog is open |
| **Steps** | 1. Click "Cancel" in the delete confirmation dialog |
| **Test Data** | N/A |
| **Expected Result** | Dialog closes. Question remains in the table. Question count is unchanged. |

---

### TC-MV-027 — Delete Question Successfully

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-027 |
| **Test Case Name** | Verify a question can be permanently deleted via confirmation |
| **Priority** | High |
| **Preconditions** | A test question exists in the vertical (created by TC-MV-020) |
| **Steps** | 1. Find the test question "Smoke Test Question - Automation" in the table 2. Click its 3-dot menu → Delete 3. Click "Delete Question" in the confirmation dialog |
| **Test Data** | Question: `Smoke Test Question - Automation` |
| **Expected Result** | Dialog closes. Question is removed from the table. Question count decreases by 1. |

---

### TC-MV-028 — Rows Per Page Dropdown on List Page

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-028 |
| **Test Case Name** | Verify rows per page dropdown controls pagination |
| **Priority** | Low |
| **Preconditions** | User is on Market Verticals list page |
| **Steps** | 1. Locate the "Rows per page" dropdown at the bottom 2. Change value |
| **Test Data** | N/A |
| **Expected Result** | Rows per page dropdown is visible. Default is 10. Pagination shows "1–5 of 5". Previous and Next pagination buttons are disabled (only 5 rows). |

---

### TC-MV-029 — Questions Table Drag Handle Visible

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-029 |
| **Test Case Name** | Verify drag handle (⠿) is visible on each question row for reordering |
| **Priority** | Low |
| **Preconditions** | User is on vertical detail page with questions listed |
| **Steps** | 1. Observe each row in the questions table |
| **Test Data** | N/A |
| **Expected Result** | Each question row has a drag handle icon (⠿) on the leftmost column, indicating drag-to-reorder functionality is available. |

---

### TC-MV-030 — Verify Question Table Columns on Detail Page

| Field | Value |
|---|---|
| **Test Case ID** | TC-MV-030 |
| **Test Case Name** | Verify all columns are present in the questions table on detail page |
| **Priority** | Medium |
| **Preconditions** | User is on any vertical detail page |
| **Steps** | 1. Navigate to a vertical detail page 2. Observe the questions table header |
| **Test Data** | N/A |
| **Expected Result** | Table headers visible: (drag handle), Question Statement, Last Edited By, Last Edited On, Answer Type, (actions / 3-dot menu) |

---

## Summary

| Priority | Count |
|---|---|
| High | 18 |
| Medium | 9 |
| Low | 3 |
| **Total** | **30** |

### Flows Covered
- ✅ Module navigation
- ✅ List page rendering & columns
- ✅ Search on list page (match + no-result)
- ✅ Vertical detail page navigation
- ✅ Sidebar vertical switching
- ✅ Sidebar search + clear
- ✅ Question search + clear
- ✅ Question detail side panel (view, close)
- ✅ Add Question form (navigation, fields, dropdowns, options)
- ✅ Validation (required fields, min options rule)
- ✅ Answer Type all 3 options
- ✅ Market Verticals multi-select
- ✅ Create question (happy path)
- ✅ Cancel / Back on form
- ✅ Edit question (via 3-dot + detail panel)
- ✅ Delete confirmation dialog
- ✅ Cancel delete
- ✅ Confirm delete
- ✅ Pagination / rows per page
- ✅ Drag handle visibility

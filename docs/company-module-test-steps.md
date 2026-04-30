# Company Module Review

Reviewed files:
- `tests/e2e/company-module.spec.js`
- `pages/company-module.js`

## Company cases ko kaise execute karein

Requirements:
- `npm install`
- `data/credentials.js` mein valid `baseUrl`, `email`, aur `password`

Commands:
- Run complete company suite: `npm run test:company`
- Run company suite in headed mode: `npm run test:company:headed`
- Run a single case: `npx playwright test tests/e2e/company-module.spec.js --project=chrome --grep "TC-COMP-00X"`
- Show report: `npm run report`

Latest verified result:
- `npm run test:company`
- Result: `15 passed`

## Overall flow

---

## Company Listing & Grid UI

### TC-COMP-001 | Verify that the Companies listing page loads successfully and displays charts, filters, and the companies grid
**Preconditions:** User is logged in as HO.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Observe the charts section at the top of the page.
4. Observe the filter controls (search box, Market Vertical filter, More Filters button).
5. Observe the companies data grid below the filters.
**Expected results / Assertion points:**
- After step 2: URL contains `/app/sales/companies`.
- After step 3: Chart headings "Companies by Contracts", "Companies by Market Verticals", and "Companies" (trend chart) are all visible.
- After step 4: Search box, Market Vertical filter heading, and More Filters button are visible.
- After step 5: Table is visible with at least 1 data row. Create Company button is visible.

### TC-COMP-002 | Verify that the total Companies count is displayed and matches the grid pagination total
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Read the total count displayed in the "Companies by Contracts" chart heading (e.g., "9,148").
2. Read the pagination footer text (e.g., "1-10 of 9148").
3. Compare the two totals.
**Expected results / Assertion points:**
- After step 1: The chart total heading (h1) is visible and contains a numeric value.
- After step 2: Pagination footer matches pattern `X-Y of Z`.
- After step 3: The chart total and the pagination `Z` value are equal.

### TC-COMP-003 | Verify that the grid displays N/A for empty fields consistently without UI break
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Observe the grid rows for fields that have no data (Parent Company, Sub Market Vertical, Phone, etc.).
2. Check that empty fields display "N/A" consistently.
3. Verify no blank cells, broken layout, or missing cell content.
**Expected results / Assertion points:**
- After step 1: Table is visible with rows.
- After step 2: Cells with no data show "N/A" text (count of N/A cells > 0 in the first row).
- After step 3: No table cell in the first row is empty string (all cells have either data or "N/A").

### TC-COMP-004 | Verify that horizontal scrolling allows viewing all columns without layout breaking
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Verify the table container is horizontally scrollable (scrollWidth > clientWidth).
2. Scroll the table container to the far right.
3. Verify the last column header ("NAICS Codes") is visible within the scrolled viewport.
**Expected results / Assertion points:**
- After step 1: Table container scrollWidth is greater than clientWidth.
- After step 2: Table container scrollLeft is greater than 0.
- After step 3: The last column header ("NAICS Codes") is within the visible viewport of the table container.

### TC-COMP-005 | Verify that the grid retains current filters/sort after page refresh (if expected behavior)
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Click "Company Name" sort button to apply ascending sort.
2. Capture the first row company name after sort.
3. Reload the page (F5 / page.reload()).
4. Wait for the table to reload.
5. Check whether the sort order is retained or reset to default.
**Expected results / Assertion points:**
- After step 1: First row text changes (sort applied).
- After step 4: Page loads successfully with data visible.
- After step 5: Verify the sort state — either retained (first row matches step 2) or reset to default (document actual behavior). The page must not crash or show an error.

### TC-COMP-006 | Verify that the Companies listing page shows a friendly error state if the data unable to load
**Preconditions:** User is logged in as HO.
**Steps:**
1. Intercept the companies API endpoint using `page.route()` to return a failure (status 500 or abort).
2. Navigate to `/app/sales/companies`.
3. Wait for the page to handle the failed API response.
4. Observe the UI state.
**Expected results / Assertion points:**
- After step 3: The page does not crash or show a white screen.
- After step 4: Either an empty state, an error message, or the pagination shows "0-0 of 0" — the UI remains functional and does not freeze.

### TC-COMP-007 | Verify that charts do not overlap or break layout when data is missing or zero
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Verify all three chart containers are visible.
2. Get bounding boxes of each chart container.
3. Check that no chart container overlaps another.
**Expected results / Assertion points:**
- After step 1: All three chart headings are visible.
- After step 3: No two chart bounding boxes overlap (each chart's right edge < next chart's left edge, or each chart's bottom edge < next chart's top edge).
- After step 3: Each chart container has non-zero width and height.

### TC-COMP-008 | Verify that sorting does not break when the column contains N/A values (N/A handled consistently)
**Preconditions:** User is on the Companies listing page with data loaded. The "Last Activity" column contains N/A values.
**Steps:**
1. Click the "Last Activity" sort button to sort ascending.
2. Capture the first row's Last Activity cell value.
3. Click the "Last Activity" sort button again to sort descending.
4. Capture the first row's Last Activity cell value.
**Expected results / Assertion points:**
- After step 2: The first row value is either "N/A" or a valid date string — the grid does not crash.
- After step 4: The first row value differs from step 2 (sort direction changed).
- After step 4: The table still has visible rows (no empty grid after sorting).

### TC-COMP-009 | Verify that sorting remains stable and does not randomize results when toggled quickly
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Capture the first row company name (baseline).
2. Click "Company Name" sort button rapidly 4 times in succession.
3. Wait for the grid to settle (pagination visible, rows present).
4. Capture the first row company name (final state).
5. Click "Company Name" sort button once more slowly.
6. Capture the first row company name.
**Expected results / Assertion points:**
- After step 3: The table is not empty — rows are visible and pagination shows a valid total.
- After step 4: The first row has a non-empty company name (grid did not break).
- After step 6: The first row company name differs from step 4 (sort toggled correctly, not randomized).

### TC-COMP-010 | Verify that the grid does not become unclickable after closing the filters panel (no overlay remains)
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Click "More Filters" to open the filters drawer.
2. Verify the "All Filters" heading is visible.
3. Close the filters drawer (press Escape or click Cancel).
4. Verify the "All Filters" heading is no longer visible.
5. Click the first company name in the grid.
**Expected results / Assertion points:**
- After step 2: "All Filters" heading is visible (drawer open).
- After step 4: "All Filters" heading is not visible (drawer closed, no overlay remains).
- After step 5: URL changes to `/app/sales/companies/company/` (detail page opened — grid was clickable).

### TC-COMP-011 | Verify that proper validation messages are displayed instead of generic errors
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Click "Create Company" button to open the drawer.
2. Verify the "Create a New Company" heading is visible.
3. Touch the Company Name field and tab away without entering data.
4. Touch the Address field and tab away without entering data.
5. Observe the validation messages displayed.
**Expected results / Assertion points:**
- After step 2: "Create a New Company" heading is visible.
- After step 5: A validation message for Company Name appears (e.g., "Company Name required" or field marked aria-invalid).
- After step 5: A validation message for Address appears (e.g., "Address required" or field marked aria-invalid).

### TC-COMP-012 | Verify that system does not crash or freeze when user rapidly opens and closes dropdowns
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Click the Market Vertical filter heading to open the dropdown.
2. Immediately press Escape to close it.
3. Repeat steps 1-2 rapidly five times total.
4. After the 5th close, verify the page is still responsive.
5. Verify the table is still visible and interactive.
**Expected results / Assertion points:**
- After step 4: The Market Vertical dropdown tooltip is not visible (cleanly closed).
- After step 5: The companies table is visible with data rows (page did not freeze or crash).

---

## Analytics & Charts

### TC-COMP-013 | Verify that the 'Companies by Contracts' donut chart renders with Active vs Inactive contract breakdown
**Preconditions:** User is logged in as HO and on the Companies listing page with data loaded.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Locate the "Companies by Contracts" chart section.
4. Verify the donut chart graphic (SVG or canvas) is rendered inside the chart container.
5. Verify the chart displays an "Active" segment or legend entry.
6. Verify the chart displays an "Inactive" segment or legend entry.
**Expected results / Assertion points:**
- After step 3: The "Companies by Contracts" heading (h6) is visible.
- After step 4: A chart element (SVG, canvas, or recharts container) is visible inside the chart container with non-zero dimensions.
- After step 5: An "Active" label/legend item is visible within the chart section.
- After step 6: An "Inactive" label/legend item is visible within the chart section.

### TC-COMP-014 | Verify that the 'Companies by Market Verticals' donut chart renders with market vertical distribution and legend
**Preconditions:** User is logged in as HO and on the Companies listing page with data loaded.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Locate the "Companies by Market Verticals" chart section.
4. Verify the donut chart graphic (SVG or canvas) is rendered inside the chart container.
5. Verify the chart legend is visible and contains at least one market vertical label (e.g., Commercial, Industrial, Manufacturing, Residential, Distribution).
6. Count the number of legend entries.
**Expected results / Assertion points:**
- After step 3: The "Companies by Market Verticals" heading (h6) is visible.
- After step 4: A chart element (SVG, canvas, or recharts container) is visible inside the chart container with non-zero dimensions.
- After step 5: At least one known market vertical label is visible in the legend area.
- After step 6: The legend contains more than one entry (multiple verticals represented).

### TC-COMP-015 | Verify that the Companies trend chart renders and is aligned with the selected time range on the x-axis
**Preconditions:** User is logged in as HO and on the Companies listing page with data loaded.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Locate the "Companies" trend chart section (the third chart, with exact heading "Companies").
4. Verify the trend chart graphic (SVG or canvas) is rendered inside the chart container.
5. Verify the x-axis contains date or time-range labels.
6. Verify the x-axis labels are consistent with a reasonable time range (e.g., months, quarters, or years).
**Expected results / Assertion points:**
- After step 3: The "Companies" heading (h6, exact match) is visible.
- After step 4: A chart element (SVG, canvas, or recharts container) is visible inside the chart container with non-zero dimensions.
- After step 5: The x-axis area contains text elements with date-like patterns (month names, year numbers, or date strings).
- After step 6: At least 2 x-axis labels are present, confirming the chart spans a time range.

---

## Search Functionality

### TC-COMP-016 | Verify that the Search by Company input allows searching by full company name and returns matching results
**Preconditions:** User is logged in as HO and on the Companies listing page with data loaded.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Type a known full company name (e.g., "TestCompany-TK") into the "Search by Company" searchbox.
4. Wait for the grid to update with filtered results.
5. Observe the grid rows and pagination.
**Expected results / Assertion points:**
- After step 2: Pagination shows a non-zero total (e.g., "1-10 of 9148").
- After step 4: The grid displays at least 1 row containing the searched company name.
- After step 5: The first row's Company Name cell contains the exact search term "TestCompany-TK".
- After step 5: Pagination total is less than the original unfiltered total.

### TC-COMP-017 | Verify that the Search by Company input supports partial text search and updates the grid accordingly
**Preconditions:** User is on the Companies listing page with search cleared.
**Steps:**
1. Clear the search input if it has a value.
2. Type a partial company name (e.g., "TestComp") into the "Search by Company" searchbox.
3. Wait for the grid to update with filtered results.
4. Observe the grid rows.
**Expected results / Assertion points:**
- After step 3: The grid displays at least 1 row.
- After step 4: All visible first-column cells contain the partial text "TestComp" (case-insensitive).
- After step 4: Pagination total reflects the filtered count (less than the full unfiltered total).

### TC-COMP-018 | Verify that clearing the search input restores the default company list results
**Preconditions:** User is on the Companies listing page with an active search filter applied.
**Steps:**
1. Confirm the search input has a value and the grid is showing filtered results.
2. Clear the search input (select all + delete or .clear()).
3. Wait for the grid to update.
4. Observe the pagination footer.
**Expected results / Assertion points:**
- After step 1: The search input has a non-empty value.
- After step 3: The grid displays rows (at least 1 row visible).
- After step 4: Pagination total is restored to the original unfiltered count (e.g., 9148).

### TC-COMP-019 | Verify that search with special characters (e.g., @, #, %) does not crash and returns valid 'no results' behavior
**Preconditions:** User is on the Companies listing page with search cleared.
**Steps:**
1. Type special characters (e.g., "@#$%^&*") into the "Search by Company" searchbox.
2. Wait for the grid to update.
3. Observe the grid state and pagination.
**Expected results / Assertion points:**
- After step 2: The page does not crash or show an unhandled error.
- After step 3: The "No Record Found" heading (h2) is visible in the table area.
- After step 3: Pagination shows "0-0 of 0" or equivalent zero-result state.
- After step 3: The table structure (headers) remains intact.

### TC-COMP-020 | Verify that search with very long text does not break UI and is handled gracefully
**Preconditions:** User is on the Companies listing page with search cleared.
**Steps:**
1. Clear the search input.
2. Type a very long string (200+ characters) into the "Search by Company" searchbox.
3. Wait for the grid to update.
4. Observe the UI state.
**Expected results / Assertion points:**
- After step 2: The search input accepts the text without truncation errors or UI freeze.
- After step 3: The page does not crash — either results are shown or the "No Record Found" state appears.
- After step 4: The table header row remains visible (layout not broken).
- After step 4: Pagination footer is still visible and shows a valid pattern.

### TC-COMP-021 | Verify that the grid shows 'No results' state when filters return no matching companies
**Preconditions:** User is on the Companies listing page with search cleared.
**Steps:**
1. Clear the search input.
2. Type a nonsensical string guaranteed to match no companies (e.g., "ZZZZNOCOMPANY999XYZ").
3. Wait for the grid to update.
4. Observe the grid state.
**Expected results / Assertion points:**
- After step 3: The "No Record Found" heading (h2) is visible.
- After step 3: The descriptive paragraph "Expecting to see new companies? Try again in a few seconds as the system catches up." is visible.
- After step 4: Pagination shows "0-0 of 0".
- After step 4: The table header row is still visible (column headers intact).

---

## Filter Management (Market Vertical & More Filters)

### TC-COMP-022 | Verify that the Market Vertical filter dropdown opens and shows all available market vertical options
**Preconditions:** User is logged in as HO and on the Companies listing page with data loaded.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Click the "Market Vertical" filter heading to open the dropdown tooltip.
4. Observe the dropdown options displayed inside the tooltip.
**Expected results / Assertion points:**
- After step 3: The tooltip (`#simple-popper[role="tooltip"]`) is visible.
- After step 4: All five market vertical options are visible: Commercial, Distribution, Industrial, Manufacturing, Residential.
- After step 4: Each option is clickable (has cursor pointer or checkbox icon).

### TC-COMP-023 | Verify that the Market Vertical filter supports searching within the dropdown list (Search by Industry)
**Preconditions:** User is on the Companies listing page. Market Vertical dropdown is open.
**Steps:**
1. Open the Market Vertical filter dropdown.
2. Locate the "Search by Industry" textbox inside the tooltip.
3. Type a partial market vertical name (e.g., "Manu") into the search box.
4. Observe the filtered options list.
5. Clear the search text.
6. Observe the options list returns to full set.
**Expected results / Assertion points:**
- After step 2: The "Search by Industry" textbox is visible inside the tooltip.
- After step 4: Only "Manufacturing" option is visible (others filtered out).
- After step 6: All five options are visible again.

### TC-COMP-024 | Verify that the user can select one market vertical option and the grid updates accordingly
**Preconditions:** User is on the Companies listing page with no filters applied.
**Steps:**
1. Capture the current pagination total (baseline).
2. Open the Market Vertical filter dropdown.
3. Click on "Manufacturing" option to select it.
4. Wait for the grid to update.
5. Observe the grid rows and pagination.
**Expected results / Assertion points:**
- After step 3: The "Manufacturing" option shows a checked state (checkbox icon visible).
- After step 4: The grid rows are updated — all visible "Market Vertical" column cells show "Manufacturing".
- After step 5: The pagination total has changed from the baseline.

### TC-COMP-025 | Verify that the user can select multiple market vertical options (checkbox multi-select) and the grid updates accordingly
**Preconditions:** User is on the Companies listing page. One market vertical ("Manufacturing") is already selected from TC-COMP-024.
**Steps:**
1. Reopen the Market Vertical filter dropdown if closed.
2. Click on "Industrial" option to add a second selection.
3. Wait for the grid to update.
4. Observe the grid rows.
**Expected results / Assertion points:**
- After step 2: Both "Manufacturing" and "Industrial" options show checked state.
- After step 3: The grid rows show either "Manufacturing" or "Industrial" in the Market Vertical column.
- After step 3: The pagination total differs from the single-filter total (either more or different count).

### TC-COMP-026 | Verify that deselecting a selected market vertical option removes the filter and updates the grid
**Preconditions:** User is on the Companies listing page with multiple market verticals selected.
**Steps:**
1. Capture the current pagination total.
2. Open the Market Vertical filter dropdown.
3. Click on "Industrial" to deselect it.
4. Wait for the grid to update.
5. Observe the grid rows and pagination.
**Expected results / Assertion points:**
- After step 3: "Industrial" no longer shows checked state.
- After step 4: The grid rows update — Market Vertical column no longer shows "Industrial".
- After step 5: Pagination total changes from the multi-select total.

### TC-COMP-027 | Verify that Market Vertical dropdown does not close unexpectedly while selecting multiple options
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Open the Market Vertical filter dropdown.
2. Click on "Commercial" to select it.
3. Verify the dropdown tooltip is still visible after selection.
4. Click on "Industrial" to select a second option.
5. Verify the dropdown tooltip is still visible after second selection.
**Expected results / Assertion points:**
- After step 3: The tooltip remains visible (did not close after first selection).
- After step 5: The tooltip remains visible (did not close after second selection).
- After step 5: Both "Commercial" and "Industrial" show checked state.

### TC-COMP-028 | Verify that Market Vertical dropdown selection does not reset after interacting with other page elements via pagination
**Preconditions:** User is on the Companies listing page with at least one market vertical selected.
**Steps:**
1. Select "Manufacturing" from the Market Vertical dropdown and wait for grid update.
2. Capture the filtered pagination total.
3. Click "Go to next page" to navigate to page 2.
4. Wait for the page to update.
5. Observe the Market Vertical column values on page 2.
6. Navigate back to page 1.
7. Verify the Market Vertical filter is still applied.
**Expected results / Assertion points:**
- After step 3: Pagination updates to show page 2 range (e.g., "11-20 of X").
- After step 5: The Market Vertical column on page 2 still shows "Manufacturing" only.
- After step 7: The pagination total matches the filtered total from step 2 (filter not reset).

### TC-COMP-029 | Verify that the More Filters panel opens from the Companies page and overlays the page correctly
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Click the "More Filters" button.
2. Observe the panel that appears.
3. Verify the panel overlays the page (MUI drawer/modal structure).
**Expected results / Assertion points:**
- After step 2: The "All Filters" heading (h3) is visible.
- After step 2: The Cancel and Apply Filters buttons are visible at the bottom.
- After step 3: A presentation overlay (role="presentation") is visible, indicating the panel overlays the page.

### TC-COMP-030 | Verify that the More Filters panel shows filters for Country, States, Cities, Parent Company, Market Verticals, Created Date, Last Activity, and Last Modified
**Preconditions:** User is on the Companies listing page. More Filters panel is open.
**Steps:**
1. Open the More Filters panel.
2. Observe the filter fields displayed.
**Expected results / Assertion points:**
- After step 2: The "States" label and "Select states" dropdown are visible.
- After step 2: The "Cities" label and "Select cities" dropdown are visible.
- After step 2: The "Parent Company" label and "Select Parent Company" dropdown are visible.
- After step 2: The "Market Verticals" label and "Select Market Verticals" dropdown are visible.
- After step 2: The "Select SP Status" label and dropdown are visible.
- After step 2: The "Created Date", "Last Activity", and "Last Modified" date pickers are visible.
- NOTE: "Country" field is not present in the current UI implementation. The panel shows States directly.

### TC-COMP-031 | Verify that the Country dropdown allows selecting a country and filters the grid accordingly after Apply Filters
**Preconditions:** User is on the Companies listing page. More Filters panel is open.
**Steps:**
1. Open the More Filters panel.
2. Attempt to locate a "Country" dropdown.
**Expected results / Assertion points:**
- NOTE: The "Country" dropdown does not exist in the current More Filters panel UI. This test documents that Country filtering is not available in the current implementation. Mark as test.fail() with TODO.

### TC-COMP-032 | Verify that the States dropdown allows selecting a state and filters the grid accordingly after Apply Filters
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Capture the baseline pagination total.
2. Open the More Filters panel.
3. Click "Select states" dropdown to open it.
4. Select a state (e.g., "Nebraska").
5. Click "Apply Filters".
6. Wait for the grid to update.
7. Observe the grid rows and pagination.
**Expected results / Assertion points:**
- After step 3: The states dropdown opens with selectable options.
- After step 5: The More Filters panel closes.
- After step 7: The grid rows show the selected state in the "State" column.
- After step 7: The pagination total changes from the baseline.

### TC-COMP-033 | Verify that the Cities dropdown allows selecting a city and filters the grid accordingly after Apply Filters
**Preconditions:** User is on the Companies listing page. A state has been selected in More Filters.
**Steps:**
1. Open the More Filters panel.
2. Select a state first (e.g., "Nebraska") to enable the Cities dropdown.
3. Click "Select cities" dropdown.
4. Select a city (e.g., "Omaha").
5. Click "Apply Filters".
6. Wait for the grid to update.
7. Observe the grid rows.
**Expected results / Assertion points:**
- After step 3: The cities dropdown opens with city options for the selected state.
- After step 5: The More Filters panel closes.
- After step 7: The grid rows show the selected city in the "City" column.

### TC-COMP-034 | Verify that the Parent Company dropdown allows selecting a parent company and filters the grid accordingly after Apply Filters
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Capture the baseline pagination total.
2. Open the More Filters panel.
3. Click "Select Parent Company" dropdown.
4. Select a parent company from the list.
5. Click "Apply Filters".
6. Wait for the grid to update.
7. Observe the grid rows and pagination.
**Expected results / Assertion points:**
- After step 3: The Parent Company dropdown opens with selectable options.
- After step 5: The More Filters panel closes.
- After step 7: The pagination total changes from baseline (filter applied).

### TC-COMP-035 | Verify that the Select SP Status dropdown allows selecting a status and filters the grid accordingly after Apply Filters
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Capture the baseline pagination total.
2. Open the More Filters panel.
3. Click "Select SP Status" dropdown.
4. Select a status (e.g., "SP - Active" or "SP - Target").
5. Click "Apply Filters".
6. Wait for the grid to update.
7. Observe the grid rows.
**Expected results / Assertion points:**
- After step 3: The SP Status dropdown opens with options.
- After step 5: The More Filters panel closes.
- After step 7: The grid rows show the selected SP status in the "Strategic Partnership Status" column.
- After step 7: The pagination total changes from baseline.

### TC-COMP-036 | Verify that the Created Date picker allows selecting a date and filters results after Apply Filters
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Capture the baseline pagination total.
2. Open the More Filters panel.
3. Locate the "Created Date" field with "MM/DD/YYYY - MM/DD/YYYY" placeholder.
4. Type a valid date range (e.g., today's date for both start and end).
5. Click "Apply Filters".
6. Wait for the grid to update.
7. Observe the grid rows and pagination.
**Expected results / Assertion points:**
- After step 3: The Created Date textbox is visible with placeholder "MM/DD/YYYY - MM/DD/YYYY".
- After step 5: The More Filters panel closes.
- After step 7: The grid rows show companies with Created Date matching the selected range.

### TC-COMP-037 | Verify that the Last Activity date picker allows selecting a date and filters results after Apply Filters
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Capture the baseline pagination total.
2. Open the More Filters panel.
3. Locate the "Last Activity" date field.
4. Type a valid date range.
5. Click "Apply Filters".
6. Wait for the grid to update.
7. Observe the grid rows.
**Expected results / Assertion points:**
- After step 3: The Last Activity textbox is visible with placeholder "MM/DD/YYYY - MM/DD/YYYY".
- After step 5: The More Filters panel closes.
- After step 7: Pagination total changes from baseline (filter applied).

### TC-COMP-038 | Verify that the Last Modified date picker allows selecting a date and filters results after Apply Filters
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Capture the baseline pagination total.
2. Open the More Filters panel.
3. Locate the "Last Modified" date field.
4. Type a valid date range.
5. Click "Apply Filters".
6. Wait for the grid to update.
7. Observe the grid rows.
**Expected results / Assertion points:**
- After step 3: The Last Modified textbox is visible with placeholder "MM/DD/YYYY - MM/DD/YYYY".
- After step 5: The More Filters panel closes.
- After step 7: Pagination total changes from baseline (filter applied).

### TC-COMP-039 | Verify that the Apply Filters button applies selected filters, closes the panel, and refreshes the grid results
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Open the More Filters panel.
2. Select a filter (e.g., a state).
3. Click "Apply Filters".
4. Observe the panel state and grid.
**Expected results / Assertion points:**
- After step 3: The "All Filters" heading is no longer visible (panel closed).
- After step 3: The grid has refreshed — pagination shows updated results.
- After step 4: The filtered data is reflected in the grid rows.

### TC-COMP-040 | Verify that the Cancel button closes the More Filters panel without applying changes to the grid
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Capture the baseline pagination total.
2. Open the More Filters panel.
3. Select a filter (e.g., a state) inside the panel.
4. Click "Cancel".
5. Observe the panel state and grid.
**Expected results / Assertion points:**
- After step 4: The "All Filters" heading is no longer visible (panel closed).
- After step 5: The pagination total matches the baseline (no filter applied).
- After step 5: The grid data is unchanged.

### TC-COMP-041 | Verify that the Clear All option clears all selected filters in the panel and resets to default state
**Preconditions:** User is on the Companies listing page. More Filters panel is open with some filters selected.
**Steps:**
1. Open the More Filters panel.
2. Select a state and a market vertical.
3. Click "Clear All".
4. Observe the filter fields.
**Expected results / Assertion points:**
- After step 3: The States dropdown resets to "Select states" placeholder.
- After step 3: The Market Verticals dropdown resets to "Select Market Verticals" placeholder.
- After step 3: All date fields are cleared (show "MM/DD/YYYY - MM/DD/YYYY" placeholder).

### TC-COMP-042 | Verify that the More Filters panel does not allow invalid states selection without selecting a country first
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Open the More Filters panel.
2. Observe the States dropdown.
3. Click "Select states" and verify it opens or note that states load without country dependency.
**Expected results / Assertion points:**
- NOTE: The current UI does not have a Country dropdown. States dropdown is directly available without country selection dependency. This test documents that the Country->States dependency does not exist in the current implementation.
- After step 2: The "Select states" dropdown is clickable and opens without requiring a country selection first.

### TC-COMP-043 | Verify that the More Filters panel does not allow invalid cities selection without selecting a state first
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Open the More Filters panel.
2. Without selecting a state, observe the Cities dropdown.
3. Attempt to click the Cities dropdown.
4. Select a state (e.g., "Nebraska").
5. Observe the Cities dropdown after state selection.
**Expected results / Assertion points:**
- After step 2: The Cities dropdown ("Select cities") appears disabled or non-interactive.
- After step 3: The Cities dropdown does not open or shows no options.
- After step 5: The Cities dropdown becomes interactive and shows city options for the selected state.

### TC-COMP-044 | Verify that invalid date input (manual typing wrong format) is rejected or corrected with validation
**Preconditions:** User is on the Companies listing page. More Filters panel is open.
**Steps:**
1. Open the More Filters panel.
2. Click on the Created Date textbox.
3. Type an invalid date string (e.g., "99/99/9999 - 99/99/9999").
4. Observe the field state and any validation messages.
5. Click "Apply Filters" or observe if the button is disabled.
**Expected results / Assertion points:**
- After step 3: The field either rejects the invalid input, shows a validation error, or auto-corrects to a valid format.
- After step 5: The Apply Filters button either does not apply the invalid date or the system handles it gracefully without crashing.

### TC-COMP-045 | Verify that selecting a future date in Last Activity/Last Modified does not return incorrect results
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Open the More Filters panel.
2. Type a future date range in the Last Activity field (e.g., one year from today).
3. Click "Apply Filters".
4. Wait for the grid to update.
5. Observe the grid.
**Expected results / Assertion points:**
- After step 3: The More Filters panel closes.
- After step 4: The grid shows either no results or an empty state (no companies should have future Last Activity dates).
- After step 5: The pagination shows "0-0 of 0" or a very low count. The UI does not crash.

### TC-COMP-046 | Verify that applying filters with no selection does not change the grid unexpectedly
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Capture the baseline pagination total.
2. Open the More Filters panel.
3. Without selecting any filters, click "Apply Filters".
4. Observe the grid.
**Expected results / Assertion points:**
- After step 3: The More Filters panel closes.
- After step 4: The pagination total matches the baseline (grid unchanged).
- After step 4: The grid rows are the same as before opening the panel.

### TC-COMP-047 | Verify that clicking Apply Filters multiple times rapidly does not duplicate requests or break UI
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Open the More Filters panel.
2. Select a filter (e.g., a state).
3. Click "Apply Filters" rapidly 3 times in succession.
4. Wait for the UI to settle.
5. Observe the grid and panel state.
**Expected results / Assertion points:**
- After step 4: The More Filters panel is closed (not stuck open).
- After step 5: The grid shows valid filtered data (no duplicated or broken results).
- After step 5: The pagination shows a valid format and the page is responsive.

### TC-COMP-048 | Verify that Clear All resets all filter fields (including dates) and does not leave stale chips/values behind
**Preconditions:** User is on the Companies listing page with filters applied via More Filters.
**Steps:**
1. Open the More Filters panel.
2. Select a state, a market vertical, and type a Created Date range.
3. Click "Apply Filters" to apply them.
4. Reopen the More Filters panel.
5. Verify the previously selected filters are shown.
6. Click "Clear All".
7. Observe all filter fields.
8. Click "Apply Filters".
9. Observe the grid.
**Expected results / Assertion points:**
- After step 5: The previously applied state and market vertical selections are visible.
- After step 6: All dropdowns reset to their default placeholder text. Date fields are cleared.
- After step 9: The grid returns to the unfiltered state with the original pagination total.

### TC-COMP-049 | Verify that Cancel from the More Filters panel discards unsaved filter changes
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Capture the baseline pagination total.
2. Open the More Filters panel.
3. Select a state filter.
4. Click "Cancel" instead of Apply Filters.
5. Observe the grid.
6. Reopen the More Filters panel.
7. Observe the state dropdown.
**Expected results / Assertion points:**
- After step 4: The More Filters panel closes.
- After step 5: The pagination total matches the baseline (no filter applied).
- After step 7: The state dropdown shows default "Select states" placeholder (selection was discarded).

### TC-COMP-050 | Verify that the panel close (X) behaves the same as Cancel and does not apply filters
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Capture the baseline pagination total.
2. Open the More Filters panel.
3. Select a filter (e.g., a state).
4. Click the close (X) button (link adjacent to "All Filters" heading).
5. Observe the panel and grid.
**Expected results / Assertion points:**
- After step 4: The "All Filters" heading is no longer visible (panel closed).
- After step 5: The pagination total matches the baseline (no filter applied, same as Cancel behavior).

### TC-COMP-051 | Verify that More Filters Apply Filters button is disabled or shows validation when required filter dependencies are incomplete
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Open the More Filters panel.
2. Observe the Apply Filters button state without any selections.
3. Type an incomplete date (e.g., only start date in Created Date).
4. Observe the Apply Filters button state.
**Expected results / Assertion points:**
- After step 2: The Apply Filters button is either always enabled (allowing empty filter apply) or disabled when no filters are selected — document actual behavior.
- After step 4: If the date is incomplete, the system either prevents applying, shows validation, or handles gracefully.

### TC-COMP-052 | Verify that rapid open/close of filters and dropdowns does not cause UI flicker or stuck overlays
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Rapidly open and close the More Filters panel 5 times (click More Filters, then Escape/Cancel).
2. After the 5th close, verify the page is responsive.
3. Rapidly open the Market Vertical dropdown and close it 5 times.
4. After the 5th close, verify no stuck tooltips or overlays.
5. Verify the table is still interactive.
**Expected results / Assertion points:**
- After step 2: The "All Filters" heading is not visible (panel fully closed, no stuck overlay).
- After step 4: No tooltip (`#simple-popper`) is visible (no stuck dropdown).
- After step 5: The companies table is visible with data rows. The page did not freeze or crash.

---

## Sorting & Pagination

### TC-COMP-053 | Verify that applied filters persist when navigating between pages using pagination controls
**Preconditions:** User is logged in as HO and on the Companies listing page with data loaded.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Apply a Market Vertical filter (e.g., "Manufacturing") to narrow results.
4. Capture the filtered pagination total.
5. Click "Go to next page" to navigate to page 2.
6. Observe the Market Vertical column values on page 2.
7. Navigate back to page 1.
8. Verify the filter is still applied and pagination total matches step 4.
**Expected results / Assertion points:**
- After step 3: The grid rows show only "Manufacturing" in the Market Vertical column.
- After step 5: Pagination updates to show page 2 range (e.g., "11-20 of X").
- After step 6: All visible Market Vertical column cells on page 2 still show "Manufacturing".
- After step 8: The pagination total matches the filtered total from step 4 (filter not reset).

### TC-COMP-054 | Verify that column sorting works when clicking on a sortable column header (e.g., Company Name, Created Date)
**Preconditions:** User is logged in as HO and on the Companies listing page with data loaded.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Capture the first row Company Name value (baseline).
4. Click the "Company Name" sort button to apply sorting.
5. Capture the first row Company Name value after sort.
6. Click the "Created Date" sort button.
7. Capture the first row Created Date value after sort.
**Expected results / Assertion points:**
- After step 4: The first row changes from the baseline (sort applied).
- After step 5: The first row Company Name is a non-empty string.
- After step 6: The grid rows update (pagination still valid, rows visible).
- After step 7: The first row Created Date is a valid date string (MM/DD/YYYY) or "N/A".

### TC-COMP-055 | Verify that sorting toggles between ascending and descending order on repeated clicks
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Click the "Company Name" sort button once.
2. Capture the first row Company Name value (sort A).
3. Click the "Company Name" sort button again.
4. Capture the first row Company Name value (sort B).
5. Compare sort A and sort B.
**Expected results / Assertion points:**
- After step 2: The first row has a non-empty Company Name (sort applied successfully).
- After step 4: The first row has a non-empty Company Name (second sort applied).
- After step 5: sort A and sort B are different (sort direction toggled).
- After step 5: Table still has visible rows and pagination is valid.

### TC-COMP-056 | Verify that pagination controls (next/previous) navigate between pages and update the row range display
**Preconditions:** User is on the Companies listing page with data loaded and more than 10 companies exist.
**Steps:**
1. Verify pagination shows "1-10 of X" where X > 10.
2. Click "Go to next page".
3. Verify pagination updates to "11-20 of X".
4. Verify the first row Company Name on page 2 differs from page 1.
5. Click "Go to previous page".
6. Verify pagination returns to "1-10 of X".
**Expected results / Assertion points:**
- After step 1: Pagination matches pattern "1-10 of X" with X > 10.
- After step 3: Pagination start is 11 (page 2 range).
- After step 4: The first row Company Name differs from the page 1 first row.
- After step 6: Pagination start returns to 1 (page 1 range).

### TC-COMP-057 | Verify that changing 'Rows per page' updates the number of displayed rows and refreshes the grid
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Verify current "Rows per page" is 10 (default).
2. Capture the current row count in the table body.
3. Change "Rows per page" to 20 using the combobox.
4. Wait for the grid to refresh.
5. Capture the new row count in the table body.
6. Verify the pagination display updates accordingly.
**Expected results / Assertion points:**
- After step 2: The table body has 10 rows (default page size).
- After step 4: The pagination footer updates to show "1-20 of X".
- After step 5: The table body has 20 rows (or fewer if total < 20).
- After step 5: The row count increased from step 2.

### TC-COMP-058 | Verify that pagination does not reset unexpectedly when filters are applied
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Apply a Market Vertical filter (e.g., "Manufacturing").
2. Capture the filtered pagination total.
3. Navigate to page 2 using "Go to next page".
4. Verify pagination shows page 2 range.
5. Clear the Market Vertical filter.
6. Verify pagination resets to page 1 with the full (unfiltered) total.
**Expected results / Assertion points:**
- After step 2: Pagination total is less than the unfiltered total.
- After step 4: Pagination start is greater than 1 (on page 2).
- After step 6: Pagination start is 1 and total is the full unfiltered count.
- After step 6: The grid is not empty and shows data rows.

### TC-COMP-059 | Verify that pagination controls are disabled appropriately on first/last page to prevent invalid navigation
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Verify the user is on page 1 (pagination shows "1-10 of X").
2. Check the "Go to previous page" button state.
3. Navigate to the last page by clicking "Go to next page" repeatedly or via rows-per-page adjustment.
4. Check the "Go to next page" button state on the last page.
5. Navigate back to page 1.
6. Verify "Go to previous page" is disabled again.
**Expected results / Assertion points:**
- After step 2: "Go to previous page" button is disabled on page 1.
- After step 4: "Go to next page" button is disabled on the last page.
- After step 6: "Go to previous page" button is disabled again on page 1.

---

## Export & External Actions

### TC-COMP-060 | Verify that the Export button initiates an export action and downloads/produces the expected file output (if enabled)
**Preconditions:** User is logged in as HO and on the Companies listing page with data loaded.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Observe the Export button state.
4. If Export is disabled by default, document this behavior.
5. If Export becomes enabled after selecting rows, select a row and click Export.
6. Observe the download or export action.
**Expected results / Assertion points:**
- After step 3: The Export button is present in the toolbar (visible in DOM).
- After step 4: Document whether Export is disabled by default (current behavior: disabled without row selection).
- After step 6: If enabled, the export action produces a download or shows a confirmation. If disabled, document the behavior.
- NOTE: The Export button is currently disabled by default on the Companies page. This test documents that Export requires row selection or specific conditions to become enabled.

### TC-COMP-061 | Verify that Export is blocked or shows proper message when there is no data to export
**Preconditions:** User is on the Companies listing page.
**Steps:**
1. Search for a nonsensical term that returns no results (e.g., "ZZZZNOCOMPANY999XYZ").
2. Verify "No Record Found" state is shown.
3. Observe the Export button state.
**Expected results / Assertion points:**
- After step 2: The "No Record Found" heading is visible.
- After step 3: The Export button is disabled (cannot export empty dataset).
- After step 3: The Export button does not trigger any action when clicked (disabled state).

### TC-COMP-062 | Verify that Export handles large datasets without UI freeze (shows loader)
**Preconditions:** User is on the Companies listing page with full dataset loaded (9000+ companies).
**Steps:**
1. Verify the full dataset is loaded (pagination shows 9000+ total).
2. Observe the Export button state with the full dataset.
3. If Export is enabled, click it and observe UI responsiveness.
4. If Export is disabled, document the behavior.
**Expected results / Assertion points:**
- After step 1: Pagination shows 9000+ total companies.
- After step 2: The Export button state is documented (enabled or disabled).
- After step 3: If export triggered, the page does not freeze — either a loader appears or the download starts within a reasonable time. The table remains visible and pagination is still functional.
- NOTE: If Export is disabled by default, the test documents this and verifies the page remains responsive after attempting to interact with it.

### TC-COMP-063 | Verify that the page does not lose user-applied filters/sort when switching tabs or navigating away and back (if expected)
**Preconditions:** User is on the Companies listing page with data loaded.
**Steps:**
1. Apply a sort on "Company Name" column.
2. Apply a Market Vertical filter (e.g., "Manufacturing").
3. Capture the filtered pagination total and first row Company Name.
4. Navigate away to another page (e.g., `/app/sales/deals`).
5. Navigate back to `/app/sales/companies`.
6. Observe the sort state and filter state.
**Expected results / Assertion points:**
- After step 3: The grid is filtered and sorted (pagination shows filtered total).
- After step 5: The page loads successfully with data visible.
- After step 6: Document actual behavior — either filters/sort are retained (first row matches step 3) or reset to default. The page must not crash or show an error.
- After step 6: Pagination shows a valid format regardless of retention behavior.

---

## Create Company Workflow

### TC-COMP-064 | Verify that the Create Company button opens the Create Company form/modal successfully.
**Preconditions:** User is logged in as HO and on the Companies listing page.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Click the "Create Company" button in the toolbar.
4. Observe the form/modal that appears.
**Expected results / Assertion points:**
- After step 3: The "Create a New Company" heading (h4) is visible.
- After step 4: The Company Name input field is visible.
- After step 4: The Address input field is visible.
- After step 4: The Cancel button is visible.

### TC-COMP-065 | Verify that user is able to open the Create a New Company screen successfully.
**Preconditions:** User is logged in as HO and on the Companies listing page.
**Steps:**
1. Click the "Create Company" button.
2. Observe the Create a New Company screen.
3. Verify all form fields are present: Company Domain, Company Name, Market Vertical, Strategic Partnership Status, No. of Employees, Revenue, Address, and Map.
**Expected results / Assertion points:**
- After step 2: The "Create a New Company" heading is visible.
- After step 3: Company Domain textbox ("e.g., www.Signal.com") is visible.
- After step 3: Company Name textbox ("Add Company Name") is visible.
- After step 3: "Select Industry" dropdown trigger is visible.
- After step 3: "Select SP Status" dropdown trigger is visible.
- After step 3: No. of Employees spinbutton is visible.
- After step 3: Revenue spinbutton is visible.
- After step 3: Address textbox ("Type Address") is visible.

### TC-COMP-066 | Verify that Company Name field accepts valid company name and is marked as mandatory.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Observe the Company Name field label for a mandatory indicator (*).
3. Type a valid company name (e.g., "PAT {timestamp}") into the Company Name field.
4. Verify the field accepts the input.
**Expected results / Assertion points:**
- After step 2: The Company Name label contains an asterisk (*) mandatory marker.
- After step 3: The Company Name input has the typed value.
- After step 4: The input value matches what was typed.

### TC-COMP-067 | Verify that Market Vertical dropdown opens correctly and displays all available options.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Click the "Select Industry" dropdown trigger.
3. Observe the dropdown options displayed in the tooltip/popper.
**Expected results / Assertion points:**
- After step 2: The dropdown tooltip (#simple-popper) is visible.
- After step 3: At least the following options are visible: Commercial, Distribution, Industrial, Manufacturing, Residential.

### TC-COMP-068 | Verify that user is able to search and select a value from Market Vertical dropdown.
**Preconditions:** User is on the Create a New Company screen with Market Vertical dropdown open.
**Steps:**
1. Open the Create Company form.
2. Click the "Select Industry" dropdown trigger.
3. Select "Manufacturing" from the dropdown options.
4. Verify the selected value is reflected in the trigger.
**Expected results / Assertion points:**
- After step 3: The "Manufacturing" option is clicked.
- After step 4: The dropdown trigger now displays "Manufacturing" instead of "Select Industry".

### TC-COMP-069 | Verify that Strategic Partnership Status dropdown opens and displays all valid options.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Click the "Select SP Status" dropdown trigger.
3. Observe the dropdown options.
**Expected results / Assertion points:**
- After step 2: The dropdown opens with visible options.
- After step 3: "SP - Active", "SP - Target", and "Not SP" options are all visible.

### TC-COMP-070 | Verify that user can select any Strategic Partnership Status successfully.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Click the "Select SP Status" dropdown trigger.
3. Select "SP - Active" from the dropdown.
4. Verify the selected value is reflected in the trigger.
**Expected results / Assertion points:**
- After step 3: The "SP - Active" option is selected.
- After step 4: The trigger heading now shows "SP - Active" instead of "Select SP Status".

### TC-COMP-071 | Verify that Company Domain field accepts a valid domain format.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Type a valid domain (e.g., "www.testcompany.com") into the Company Domain field.
3. Verify the field accepts the input.
**Expected results / Assertion points:**
- After step 2: The Company Domain input has the typed value.
- After step 3: The input value matches "www.testcompany.com".

### TC-COMP-072 | Verify that No. of Employees field accepts numeric values only.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Type a numeric value (e.g., "500") into the No. of Employees field.
3. Verify the field accepts the value.
4. Clear the field and attempt to type alphabetic characters (e.g., "abc").
5. Verify the field does not accept alphabetic input (type=number prevents it).
**Expected results / Assertion points:**
- After step 2: The No. of Employees input value is "500".
- After step 4: The input value is empty or unchanged (type=number blocks non-numeric input).

### TC-COMP-073 | Verify that Revenue field accepts valid numeric input.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Type a valid numeric value (e.g., "100000") into the Revenue field.
3. Verify the field accepts the value.
**Expected results / Assertion points:**
- After step 2: The Revenue input value is "100000".
- After step 3: The input type is "number" (validates numeric-only at browser level).

### TC-COMP-074 | Verify that Address field allows user to search and select an address from Google Maps suggestions.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Type a partial address (e.g., "S 9th St, Omaha") into the Address field.
3. Wait for Google Maps autocomplete suggestions to appear.
4. Select the first suggestion from the dropdown.
**Expected results / Assertion points:**
- After step 3: Autocomplete suggestions appear below the Address input.
- After step 4: The Address input is populated with the selected address text.

### TC-COMP-075 | Verify that selected address is correctly reflected on the map.
**Preconditions:** User is on the Create a New Company screen with an address selected.
**Steps:**
1. Open the Create Company form.
2. Type and select an address from the autocomplete (e.g., "S 9th St, Omaha, NE 68102, USA").
3. Observe the map region below the address field.
**Expected results / Assertion points:**
- After step 2: The Address input contains the selected address.
- After step 3: The Map region is visible and rendered (non-zero dimensions).

### TC-COMP-076 | Verify that Create Company button gets enabled after filling all mandatory fields.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Verify the "Create Company" submit button is initially disabled.
3. Fill in Company Name with a valid name.
4. Select a Market Vertical (e.g., "Manufacturing").
5. Select an Address from autocomplete.
6. Observe the "Create Company" submit button state.
**Expected results / Assertion points:**
- After step 2: The submit button is disabled.
- After step 6: The submit button is enabled (all mandatory fields filled).

### TC-COMP-077 | Verify that company is created successfully when user clicks on Create Company with valid data.
**Preconditions:** User is logged in as HO and on the Companies listing page.
**Steps:**
1. Click "Create Company" to open the form.
2. Fill Company Name with a unique name (e.g., "PAT {timestamp}").
3. Select "Manufacturing" as Market Vertical.
4. Type and select an address from autocomplete.
5. Click the "Create Company" submit button.
6. Observe the result.
**Expected results / Assertion points:**
- After step 5: A success toast appears ("Company Created Successfully" or similar).
- After step 6: The Create Company modal closes (heading no longer visible).

### TC-COMP-078 | Verify that newly created company is visible in the company listing after successful creation.
**Preconditions:** A company was just created successfully (TC-COMP-077).
**Steps:**
1. After company creation, observe the companies listing.
2. Search for the newly created company name in the search box.
3. Verify the company appears in the grid.
**Expected results / Assertion points:**
- After step 2: The grid updates with filtered results.
- After step 3: The first row contains the newly created company name.
- After step 3: Pagination shows at least 1 result.

### TC-COMP-079 | Verify that Cancel button closes the Create Company screen without saving data.
**Preconditions:** User is on the Create a New Company screen with some data entered.
**Steps:**
1. Open the Create Company form.
2. Type a company name (e.g., "PAT Cancel Test").
3. Click the "Cancel" button.
4. Verify the form closes.
5. Reopen the Create Company form.
6. Verify the Company Name field is empty (data was not saved).
**Expected results / Assertion points:**
- After step 3: The "Create a New Company" heading is no longer visible (form closed).
- After step 6: The Company Name field is empty (previous data discarded).

### TC-COMP-080 | Verify that error message is displayed when user tries to create a company without entering Company Name.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Click the Company Name field and tab away without entering data.
3. Interact with another field (e.g., click the Address field).
4. Observe validation messages or field state.
**Expected results / Assertion points:**
- After step 2: A validation message for Company Name appears (e.g., "Company Name required") or the field is marked aria-invalid.
- After step 4: The "Create Company" submit button remains disabled.

### TC-COMP-081 | Verify that error message is shown when Market Vertical is not selected and user clicks Create Company.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Fill in Company Name and Address but do NOT select Market Vertical.
3. Observe the "Create Company" submit button state.
**Expected results / Assertion points:**
- After step 3: The "Create Company" submit button remains disabled (Market Vertical is mandatory).
- After step 3: The Market Vertical label shows a mandatory asterisk (*).

### TC-COMP-082 | Verify that Create Company button remains disabled if mandatory fields are missing.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Verify submit button is disabled with no fields filled.
3. Fill only Company Name.
4. Verify submit button is still disabled (Market Vertical and Address missing).
5. Also select Market Vertical but leave Address empty.
6. Verify submit button is still disabled (Address missing).
**Expected results / Assertion points:**
- After step 2: Submit button is disabled.
- After step 4: Submit button is disabled.
- After step 6: Submit button is disabled.

### TC-COMP-083 | Verify that Company Domain field does not accept invalid domain formats.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Type an invalid domain (e.g., "not a domain!!!") into the Company Domain field.
3. Fill all mandatory fields (Company Name, Market Vertical, Address).
4. Observe the form state and submit button.
**Expected results / Assertion points:**
- After step 2: The field accepts the typed text (no browser-level blocking for text input).
- After step 4: Document actual behavior — either the form shows a domain validation error, or the form allows submission (domain is not a mandatory field). The system should handle gracefully.

### TC-COMP-084 | Verify that No. of Employees field does not accept alphabetic or special characters.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Attempt to type alphabetic characters ("abc") into the No. of Employees field.
3. Attempt to type special characters ("@#$") into the No. of Employees field.
4. Observe the field value.
**Expected results / Assertion points:**
- After step 2: The field value is empty (type=number blocks alphabetic input).
- After step 3: The field value is empty (type=number blocks special characters).

### TC-COMP-085 | Verify that Revenue field does not accept invalid characters or negative values.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Attempt to type alphabetic characters ("abc") into the Revenue field.
3. Observe the field value.
4. Type a negative value ("-100") and observe.
**Expected results / Assertion points:**
- After step 2: The field value is empty (type=number blocks alphabetic input).
- After step 4: Document actual behavior — either the field accepts "-100" (browser allows minus in number fields) or rejects it. The form should not crash.

### TC-COMP-086 | Verify that user cannot submit the form without selecting an Address.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Fill Company Name with a valid name.
3. Select a Market Vertical.
4. Leave the Address field empty.
5. Observe the "Create Company" submit button state.
**Expected results / Assertion points:**
- After step 5: The submit button remains disabled (Address is mandatory).

### TC-COMP-087 | Verify that invalid or random text entered in Address field does not allow company creation.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Fill Company Name and select Market Vertical.
3. Type random text (e.g., "xyzxyzxyz123") into the Address field without selecting from autocomplete.
4. Observe the submit button state.
**Expected results / Assertion points:**
- After step 3: No autocomplete suggestions appear for the random text, or suggestions do not match.
- After step 4: The submit button remains disabled (address must be selected from autocomplete, not just typed).

### TC-COMP-088 | Verify that dropdown values do not disappear or overlap when opened multiple times.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Click the "Select Industry" dropdown trigger to open it.
3. Close it by pressing Escape.
4. Repeat steps 2-3 five times.
5. Open the dropdown one final time and verify options are displayed correctly.
**Expected results / Assertion points:**
- After step 4: The page does not freeze or crash.
- After step 5: The dropdown options (Commercial, Distribution, Industrial, Manufacturing, Residential) are all visible and not overlapping.

### TC-COMP-089 | Verify that selected Market Vertical value is not reset unexpectedly on form interaction.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Select "Manufacturing" as Market Vertical.
3. Fill in the Company Name field.
4. Fill in the Company Domain field.
5. Click the Address field.
6. Observe the Market Vertical trigger value.
**Expected results / Assertion points:**
- After step 2: The trigger shows "Manufacturing".
- After step 6: The trigger still shows "Manufacturing" (not reset to "Select Industry").

### TC-COMP-090 | Verify that selected Strategic Partnership Status remains intact after interacting with other fields.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Select "SP - Active" as Strategic Partnership Status.
3. Fill in the Company Name field.
4. Select a Market Vertical.
5. Fill in the Address field.
6. Observe the SP Status trigger value.
**Expected results / Assertion points:**
- After step 2: The trigger shows "SP - Active".
- After step 6: The trigger still shows "SP - Active" (not reset to "Select SP Status").

### TC-COMP-091 | Verify that user is prevented from creating duplicate company with same name.
**Preconditions:** User is logged in as HO. A company with a known name already exists in the system.
**Steps:**
1. Open the Create Company form.
2. Fill in a company name that already exists (e.g., use a name from the listing).
3. Select Market Vertical and Address.
4. Click the "Create Company" submit button.
5. Observe the result.
**Expected results / Assertion points:**
- After step 4: Document actual behavior — either a duplicate error/toast is shown, or the system allows creating a company with the same name. If duplicate is allowed, note this as actual system behavior.
- After step 5: The form either shows an error or closes with success. The system does not crash.

### TC-COMP-092 | Verify that form data is not saved when user clicks Cancel.
**Preconditions:** User is on the Create a New Company screen.
**Steps:**
1. Open the Create Company form.
2. Fill in Company Name, Company Domain, and select Market Vertical.
3. Click "Cancel".
4. Verify the form closes.
5. Open the Create Company form again.
6. Verify all fields are empty/reset to defaults.
**Expected results / Assertion points:**
- After step 3: The form closes ("Create a New Company" heading not visible).
- After step 6: Company Name is empty, Company Domain is empty, Market Vertical shows "Select Industry", SP Status shows "Select SP Status".

### TC-COMP-093 | Verify that Create Company button is not accessible for users without permission (proper access control for SM and other roles).
**Preconditions:** User is logged in as SM (Scenario Manager) role.
**Steps:**
1. Log in with SM credentials.
2. Navigate to `/app/sales/companies`.
3. Wait for the page to load.
4. Observe the toolbar for the "Create Company" button.
**Expected results / Assertion points:**
- After step 3: The Companies page loads successfully.
- After step 4: Document actual behavior — either the "Create Company" button is not visible/disabled for SM role, or it is visible (indicating SM has permission). This test documents the access control behavior.

---

## Change Review History

### TC-COMP-094 | Verify that the Change Review History button opens the review history change flow successfully
**Preconditions:** User is logged in as HO and on the Companies listing page with data loaded.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Observe the toolbar for the "Change Review" button.
4. Click the "Change Review" button.
5. Wait for the page to navigate.
6. Observe the review history page.
**Expected results / Assertion points:**
- After step 3: The "Change Review" button is visible in the toolbar area alongside Export and Create Company buttons.
- After step 4: The URL changes to `/app/sales/companies/reviews`.
- After step 6: The page title changes to "Companies Reviews - Signal".
- After step 6: The companies table is visible with data rows (companies that have been edited).
- After step 6: Pagination is visible and shows a valid range (e.g., "1-10 of 17").

### TC-COMP-095 | Verify that user is able to view change review history button on company listing to HO
**Preconditions:** User is logged in as HO and on the Companies listing page.
**Steps:**
1. Navigate to `/app/sales/companies`.
2. Wait for the page to finish loading (pagination shows non-zero total).
3. Observe the toolbar area for the "Change Review" button.
4. Verify the button is clickable (not disabled).
5. Verify the button text reads "Change Review".
**Expected results / Assertion points:**
- After step 2: The Companies page loads successfully with URL containing `/app/sales/companies`.
- After step 3: The "Change Review" button is visible in the toolbar.
- After step 4: The "Change Review" button is enabled (clickable).
- After step 5: The button text is exactly "Change Review".

### TC-COMP-096 | Verify that on company review history page only those companies are visible in which user edit anything in it
**Preconditions:** User is logged in as HO and has navigated to the Change Review History page at `/app/sales/companies/reviews`.
**Steps:**
1. Navigate to `/app/sales/companies` and capture the total companies count from pagination.
2. Click the "Change Review" button to navigate to `/app/sales/companies/reviews`.
3. Wait for the reviews page to load (pagination visible).
4. Capture the total companies count on the reviews page from pagination.
5. Compare the two totals.
**Expected results / Assertion points:**
- After step 1: The main companies listing shows a large total (e.g., 9000+).
- After step 3: The reviews page loads successfully with URL `/app/sales/companies/reviews`.
- After step 4: The reviews page pagination total is significantly smaller than the main listing total (only companies with edits are shown).
- After step 5: The reviews page total is less than the main listing total, confirming only edited companies are displayed.

### TC-COMP-097 | Verify that user is able to view the change history against the company by clicking on it
**Preconditions:** User is logged in as HO and is on the Change Review History page at `/app/sales/companies/reviews` with at least one company listed.
**Steps:**
1. Navigate to `/app/sales/companies/reviews`.
2. Wait for the table to load with at least one row.
3. Click on the first company name in the table.
4. Observe the drawer/panel that opens.
5. Verify the "Change review" heading is visible.
6. Verify the tabs "Pending Reviews" and "Activity Logs" are present.
7. Click the "Activity Logs" tab.
8. Observe the activity log content.
**Expected results / Assertion points:**
- After step 4: A drawer/panel opens with the heading "Change review" (h3).
- After step 4: The description "Please review to approve or reject the changes." is visible.
- After step 6: Both "Pending Reviews" and "Activity Logs" tabs are visible in the tablist.
- After step 7: The "Activity Logs" tab becomes selected/active.
- After step 8: The activity log shows change details including: a section heading (e.g., "Company Details"), field names, old and new values, "Edited by" label with user name and timestamp. If no activity exists, the empty state "No change request found." heading is shown.

### TC-COMP-098 | Verify that user can view every change which is done by other role users (SM and SP)
**Preconditions:** User is logged in as HO. An SM user has previously made edits to a company that appear on the review history page.
**Steps:**
1. Navigate to `/app/sales/companies/reviews`.
2. Wait for the table to load.
3. Click on a company that has been edited by an SM user (look for a company with change history).
4. Click the "Activity Logs" tab.
5. Observe the "Edited by" information in the activity log entries.
**Expected results / Assertion points:**
- After step 2: The reviews page loads with companies listed (pagination shows non-zero total).
- After step 3: The "Change review" drawer opens with heading visible.
- After step 4: The "Activity Logs" tab is selected and shows activity content.
- After step 5: The activity log shows "Edited by" with a user name that is not the current HO user (e.g., "Moiz SM UAT"), confirming changes by other role users are visible. The entry also shows a timestamp in the format "MM/DD/YYYY HH:MM AM/PM".
